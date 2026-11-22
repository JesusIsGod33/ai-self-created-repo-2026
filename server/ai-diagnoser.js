import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { runAutonomousLocalRepair } from "./auto-repair.js";

const OLLAMA_BASE = (process.env.OLLAMA_HOST || "http://127.0.0.1:11434").replace(/\/+$/, "");
const OLLAMA_ENDPOINT = `${OLLAMA_BASE}/api/chat`;
const OLLAMA_TAGS_ENDPOINT = `${OLLAMA_BASE}/api/tags`;

const LIGHTWEIGHT_MODELS = [
  "qwen2.5:1.5b-instruct",
  "qwen2.5:1.5b",
  "qwen2.5:0.5b"
];

function ensureLocalOllamaRunning() {
  try {
    execFileSync("bash", ["-lc", `curl -sf --max-time 2 "${OLLAMA_TAGS_ENDPOINT}" >/dev/null`], {
      stdio: "ignore"
    });
    return true;
  } catch {
    const scriptPath = path.resolve(process.cwd(), "scripts/ensure-ollama.sh");
    if (!fs.existsSync(scriptPath)) return false;
    try {
      execFileSync("bash", [scriptPath], { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }
}

function sanitizeDiagnosisOutput(rawText, reportObj) {
  const lines = String(rawText || "")
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (/cwd.*not specified/i.test(trimmed) || /working directory.*root directory/i.test(trimmed)) {
        return false;
      }
      if (/port\s+4080.*not specified/i.test(trimmed)) {
        return false;
      }
      return true;
    });

  const cleaned = lines.join("\n").trim();
  const groundedHeader = [
    "### Grounded Report Fact Sheet",
    `- Timestamp: ${reportObj.timestamp}`,
    `- PID: ${reportObj.pid}`,
    `- Node Version: ${reportObj.nodeVersion}`,
    `- Host: ${reportObj.host ?? "unspecified"}`,
    `- Port: ${reportObj.port ?? "unspecified"}`,
    `- CWD: ${reportObj.cwd ?? process.cwd()}`,
    `- Status: ${reportObj.status ?? "diagnostic"}`,
    ""
  ].join("\n");

  return `${groundedHeader}${cleaned}`;
}

export async function runAiDiagnosis(reportPayload, options = {}) {
  const dataDir = options.dataDir || process.env.DATA_DIR || "./data";
  const preferredModel = options.model || process.env.OLLAMA_MODEL || "";
  const autoRepair = options.autoRepair ?? (process.env.AUTO_REPAIR === "1");
  const models = preferredModel
    ? [preferredModel, ...LIGHTWEIGHT_MODELS.filter((m) => m !== preferredModel)]
    : LIGHTWEIGHT_MODELS;

  fs.mkdirSync(dataDir, { recursive: true });
  const reportPath = path.join(dataDir, "diagnostic-report.json");
  const diagnosisPath = path.join(dataDir, "ai-diagnosis.txt");

  const reportObj = {
    timestamp: new Date().toISOString(),
    pid: process.pid,
    nodeVersion: process.version,
    ...reportPayload
  };

  fs.writeFileSync(reportPath, JSON.stringify(reportObj, null, 2), "utf8");

  const daemonReady = ensureLocalOllamaRunning();
  let lastError = daemonReady ? null : new Error("Local Ollama daemon could not be started");

  for (const model of models) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const res = await fetch(OLLAMA_ENDPOINT, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          stream: false,
          keep_alive: "30m",
          options: {
            temperature: 0.1,
            num_predict: 450,
            num_ctx: 2048
          },
          messages: [
            {
              role: "system",
              content:
                "You are a local systems reliability analyst. Use ONLY exact values from the provided JSON report. Do not claim CWD or Port are missing when present in JSON. Do not invent fake Node patch versions. Return three sections with bullet lists: ### Findings, ### Uncertainties, and ### Exact Fixes."
            },
            {
              role: "user",
              content: `Produce complete ### Findings, ### Uncertainties, and ### Exact Fixes grounded strictly in this JSON report:\n${JSON.stringify(reportObj, null, 2)}`
            }
          ]
        })
      });
      clearTimeout(timer);

      if (!res.ok) {
        const errBody = await res.text();
        lastError = new Error(`Ollama ${model} HTTP ${res.status}: ${errBody}`);
        continue;
      }

      const json = await res.json();
      const content = json?.message?.content?.trim() || "No diagnosis content returned.";
      const sanitized = sanitizeDiagnosisOutput(content, reportObj);
      let repairSection = "";
      if (autoRepair) {
        const repairOut = await runAutonomousLocalRepair(reportObj, { dataDir, model });
        repairSection = `\n\n### Autonomous Local Repair\n- Planner Model: ${repairOut.plannerModel}\n- All Succeeded: ${repairOut.allSucceeded}\n- Artifact: ${repairOut.outFile}`;
      }
      const formatted = [
        `MODEL: ${model} (local ollama)`,
        `TIMESTAMP: ${reportObj.timestamp}`,
        "",
        sanitized + repairSection
      ].join("\n");

      fs.writeFileSync(diagnosisPath, formatted, "utf8");
      return { model, diagnosis: formatted, reportPath, diagnosisPath };
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
    }
  }

  let repairSection = "";
  if (autoRepair) {
    const repairOut = await runAutonomousLocalRepair(reportObj, { dataDir, model: preferredModel });
    repairSection = `\n\n### Autonomous Local Repair\n- Planner Model: ${repairOut.plannerModel}\n- All Succeeded: ${repairOut.allSucceeded}\n- Artifact: ${repairOut.outFile}`;
  }

  const fallbackText = [
    "DIAGNOSIS MODE: LOCAL OLLAMA UNREACHABLE FALLBACK",
    `TIMESTAMP: ${reportObj.timestamp}`,
    `ENDPOINT: ${OLLAMA_ENDPOINT}`,
    `ERROR: ${lastError ? lastError.message : "No local model responded"}`
  ].join("\n") + repairSection;
  fs.writeFileSync(diagnosisPath, fallbackText, "utf8");
  return { model: "local-fallback", diagnosis: fallbackText, reportPath, diagnosisPath };
}
