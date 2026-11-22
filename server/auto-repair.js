import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const OLLAMA_BASE = (process.env.OLLAMA_HOST || "http://127.0.0.1:11434").replace(/\/+$/, "");
const OLLAMA_ENDPOINT = `${OLLAMA_BASE}/api/chat`;
const REPAIR_MODELS = [
  "qwen2.5:1.5b-instruct",
  "qwen2.5:1.5b",
  "qwen2.5:0.5b"
];

const ALLOWED_SAFE_ACTIONS = new Set([
  "ensure_ollama_daemon",
  "ensure_project_directories",
  "ensure_executable_scripts",
  "check_healthz_loopback",
  "run_verify_all_suite"
]);

function extractJsonPlan(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : text.trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

function buildDeterministicFallbackPlan(context = {}) {
  const actions = ["ensure_project_directories", "ensure_ollama_daemon", "ensure_executable_scripts"];
  if (context.triggerVerify !== false) {
    actions.push("run_verify_all_suite");
  }
  return {
    summary: "Deterministic local repair plan for Ollama daemon, project directories, script permissions, and test suite.",
    actions
  };
}

function executeSafeAction(action, projectRoot) {
  switch (action) {
    case "ensure_project_directories": {
      for (const rel of ["server", "tests", "scripts", "tools", "data", "data/investigations", "data/repairs"]) {
        fs.mkdirSync(path.join(projectRoot, rel), { recursive: true });
      }
      return { action, ok: true, detail: "Verified required project, tool, and data directories." };
    }
    case "ensure_ollama_daemon": {
      const scriptPath = path.join(projectRoot, "scripts/ensure-ollama.sh");
      if (!fs.existsSync(scriptPath)) {
        return { action, ok: false, detail: "Missing scripts/ensure-ollama.sh" };
      }
      try {
        execFileSync("bash", [scriptPath], { cwd: projectRoot, stdio: "pipe", timeout: 20000 });
        return { action, ok: true, detail: "Local Ollama daemon verified or started on 127.0.0.1:11434." };
      } catch (err) {
        return { action, ok: false, detail: `Ollama daemon check failed: ${err.message}` };
      }
    }
    case "ensure_executable_scripts": {
      const scriptsDir = path.join(projectRoot, "scripts");
      if (!fs.existsSync(scriptsDir)) {
        return { action, ok: false, detail: "Missing scripts directory." };
      }
      const files = fs.readdirSync(scriptsDir).filter((f) => f.endsWith(".sh"));
      for (const f of files) {
        fs.chmodSync(path.join(scriptsDir, f), 0o755);
      }
      return { action, ok: true, detail: `Set executable permissions on ${files.length} shell scripts.` };
    }
    case "check_healthz_loopback": {
      try {
        const out = execFileSync(
          "node",
          [
            "--input-type=module",
            "-e",
            `
            import http from "node:http";
            import { once } from "node:events";
            import { createApp } from "./server/index.js";
            const { app, orchestrator } = createApp({ dataDir: "./data", intervalMs: 5000 });
            orchestrator.start();
            const srv = app.listen(0, "127.0.0.1");
            await once(srv, "listening");
            const { port } = srv.address();
            const res = await new Promise((resolve, reject) => {
              const req = http.get({ hostname: "127.0.0.1", family: 4, port, path: "/healthz", agent: false, timeout: 4000 }, (r) => {
                let b = "";
                r.on("data", (c) => (b += c));
                r.on("end", () => resolve({ status: r.statusCode, body: b }));
              });
              req.on("error", reject);
              req.on("timeout", () => req.destroy(new Error("healthz probe timeout")));
            });
            orchestrator.stop();
            srv.closeAllConnections?.();
            srv.close();
            if (res.status !== 200) throw new Error("Expected HTTP 200 from /healthz");
            console.log(res.body);
            setImmediate(() => process.exit(0));
            `
          ],
          { cwd: projectRoot, encoding: "utf8", timeout: 12000, maxBuffer: 2 * 1024 * 1024 }
        ).trim();
        return { action, ok: true, detail: `Verified /healthz loopback response: ${out}` };
      } catch (err) {
        const stderr = err.stderr ? String(err.stderr).trim() : err.message;
        return { action, ok: false, detail: `Healthz loopback check failed: ${stderr}` };
      }
    }
    case "run_verify_all_suite": {
      const testPath = path.join(projectRoot, "tests/verify-all.js");
      if (!fs.existsSync(testPath)) {
        return { action, ok: false, detail: "Missing tests/verify-all.js" };
      }
      try {
        const out = execFileSync("node", [testPath], {
          cwd: projectRoot,
          encoding: "utf8",
          timeout: 25000,
          maxBuffer: 2 * 1024 * 1024
        }).trim();
        return { action, ok: true, detail: out || "tests/verify-all.js passed." };
      } catch (err) {
        const stderr = err.stderr ? String(err.stderr).trim() : err.message;
        return { action, ok: false, detail: `verify-all failed: ${stderr}` };
      }
    }
    default:
      return { action, ok: false, detail: `Action not allowed: ${action}` };
  }
}

export async function runAutonomousLocalRepair(issuePayload = {}, options = {}) {
  const projectRoot = options.projectRoot || "/home/Woken/career-orchestrator-stack";
  const dataDir = options.dataDir || path.join(projectRoot, "data");
  const preferredModel = options.model || process.env.OLLAMA_MODEL || "";
  const models = preferredModel
    ? [preferredModel, ...REPAIR_MODELS.filter((m) => m !== preferredModel)]
    : REPAIR_MODELS;

  fs.mkdirSync(path.join(dataDir, "repairs"), { recursive: true });

  let plan = null;
  let plannerModel = "deterministic-local-planner";

  const promptContext = {
    timestamp: new Date().toISOString(),
    projectRoot,
    nodeVersion: process.version,
    issue: issuePayload,
    allowedActions: Array.from(ALLOWED_SAFE_ACTIONS)
  };

  for (const model of models) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(OLLAMA_ENDPOINT, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          stream: false,
          keep_alive: "30m",
          options: { temperature: 0.1, num_predict: 220, num_ctx: 2048 },
          messages: [
            {
              role: "system",
              content:
                "Return ONLY valid JSON with keys \"summary\" (string) and \"actions\" (array of strings chosen strictly from allowedActions). Never invent shell commands or downgrade Node versions."
            },
            {
              role: "user",
              content: JSON.stringify(promptContext)
            }
          ]
        })
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      const json = await res.json();
      const parsed = extractJsonPlan(json?.message?.content || "");
      if (parsed && Array.isArray(parsed.actions)) {
        const validActions = parsed.actions.filter((a) => ALLOWED_SAFE_ACTIONS.has(a));
        if (validActions.length > 0) {
          plan = {
            summary: typeof parsed.summary === "string" && parsed.summary.trim()
              ? parsed.summary.trim()
              : "Local Ollama autonomous repair plan.",
            actions: validActions
          };
          plannerModel = model;
          break;
        }
      }
    } catch {
      clearTimeout(timer);
    }
  }

  if (!plan) {
    plan = buildDeterministicFallbackPlan(issuePayload);
  }

  const executionResults = [];
  for (const action of plan.actions) {
    executionResults.push(executeSafeAction(action, projectRoot));
  }

  const record = {
    id: `repair-${Date.now()}`,
    timestamp: new Date().toISOString(),
    plannerModel,
    plan,
    executionResults,
    allSucceeded: executionResults.every((r) => r.ok)
  };

  const outFile = path.join(dataDir, "repairs", `${record.id}.json`);
  fs.writeFileSync(outFile, JSON.stringify(record, null, 2), "utf8");
  return { ...record, outFile };
}
