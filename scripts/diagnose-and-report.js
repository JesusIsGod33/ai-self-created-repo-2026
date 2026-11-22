import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";

const projectRoot = "/home/Woken/career-orchestrator-stack";

function runSafe(cmd) {
  try {
    return {
      ok: true,
      output: execSync(cmd, { cwd: projectRoot, encoding: "utf8", timeout: 10000 }).trim()
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message,
      stdout: err.stdout ? String(err.stdout).trim() : "",
      stderr: err.stderr ? String(err.stderr).trim() : ""
    };
  }
}

function probeHealth(port) {
  return new Promise((resolve) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        family: 4,
        port,
        path: "/healthz",
        method: "GET",
        agent: false,
        timeout: 3000,
        headers: { Connection: "close" }
      },
      (res) => {
        let raw = "";
        res.on("data", (d) => (raw += d));
        res.on("end", () => resolve({ reachable: true, status: res.statusCode, body: raw }));
      }
    );
    req.on("error", (err) => resolve({ reachable: false, error: err.code || err.message }));
    req.on("timeout", () => {
      req.destroy();
      resolve({ reachable: false, error: "ETIMEDOUT" });
    });
    req.end();
  });
}

function summarizeReport(report) {
  const findings = [];
  if (!report.port4080Health.reachable) {
    findings.push(`Port 4080 health check failed (${report.port4080Health.error}).`);
  }
  if (!report.syntaxCheckServer.ok) {
    findings.push(`server/index.js syntax check failed: ${report.syntaxCheckServer.stderr || report.syntaxCheckServer.error}`);
  }
  if (!report.syntaxCheckVerify.ok) {
    findings.push(`tests/verify-all.js syntax check failed: ${report.syntaxCheckVerify.stderr || report.syntaxCheckVerify.error}`);
  }
  if (!report.verifyRun.ok) {
    findings.push(`tests/verify-all.js execution failed: ${report.verifyRun.stderr || report.verifyRun.error}`);
  }
  if (findings.length === 0) {
    findings.push("All workspace files, syntax checks, health check, and verification tests passed.");
  }
  return findings.join("\n");
}

const report = {
  generatedAt: new Date().toISOString(),
  host: {
    hostname: os.hostname(),
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    nodeVersion: process.version
  },
  workspace: {
    exists: fs.existsSync(projectRoot),
    hasPackageJson: fs.existsSync(path.join(projectRoot, "package.json")),
    hasEnv: fs.existsSync(path.join(projectRoot, ".env")),
    hasVaultKeys: fs.existsSync(path.join(projectRoot, "config/vault-keys.json")),
    hasServerIndex: fs.existsSync(path.join(projectRoot, "server/index.js")),
    hasVerifyScript: fs.existsSync(path.join(projectRoot, "tests/verify-all.js"))
  },
  port4080Health: await probeHealth(4080),
  syntaxCheckServer: runSafe("node --check server/index.js"),
  syntaxCheckVerify: runSafe("node --check tests/verify-all.js"),
  verifyRun: runSafe("node tests/verify-all.js")
};

fs.mkdirSync(path.join(projectRoot, "data"), { recursive: true });
const reportPath = path.join(projectRoot, "data/diagnostic-report.json");
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");

const groqKeys = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3
].filter(Boolean);

const groqModels = [
  "llama-3.1-8b-instant",
  "gemma2-9b-it",
  "mixtral-8x7b-32768"
];

let aiText = summarizeReport(report);
let sentToAi = false;

for (const apiKey of groqKeys) {
  for (const model of groqModels) {
    try {
      const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: "You are a concise Linux and Node.js full-stack diagnostic engineer. Identify root causes and exact fixes."
            },
            {
              role: "user",
              content: JSON.stringify(report)
            }
          ],
          temperature: 0.1
        })
      });
      const aiJson = await aiRes.json();
      if (aiRes.ok && aiJson?.choices?.[0]?.message?.content) {
        aiText = aiJson.choices[0].message.content;
        sentToAi = true;
        break;
      }
    } catch {
      // Try next key or model fallback
    }
  }
  if (sentToAi) break;
}

fs.writeFileSync(path.join(projectRoot, "data/ai-diagnosis.txt"), aiText + "\n");
console.log("[AI DIAGNOSIS]\n" + aiText);
console.log("[DIAGNOSTIC BUNDLE]\n" + JSON.stringify(report, null, 2));
