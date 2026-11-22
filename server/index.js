import http from "node:http";
import { CareerOrchestrator } from "./orchestrator.js";
import { investigateTarget } from "./target-investigator.js";
import { runAiDiagnosis } from "./ai-diagnoser.js";
import { handleMcpRpc } from "./mcp-server.js";

const SAMPLE_JOBS = [
  { id: "job-1", title: "Remote IT Support Specialist", company: "Northstar Cloud Health", location: "Remote" },
  { id: "job-2", title: "Technical Support Engineer", company: "Harbor Systems", location: "Remote" },
  { id: "job-3", title: "Healthcare Operations Coordinator", company: "CareBridge", location: "Remote" }
];

const SAMPLE_TEMPLATES = [
  { id: "tpl-it-support", name: "IT & Systems Support Resume", category: "IT" },
  { id: "tpl-ops-coord", name: "Operations & Support Resume", category: "Operations" },
  { id: "tpl-cover-short", name: "Concise Cover Letter", category: "Cover Letter" },
  { id: "tpl-cover-tech", name: "Technical Cover Letter", category: "Cover Letter" }
];

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Connection": "close"
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

export function createApp(options = {}) {
  const dataDir = options.dataDir || process.env.DATA_DIR || "./data";
  const orchestrator = new CareerOrchestrator({
    dataDir,
    intervalMs: Number(options.intervalMs || process.env.WORKER_INTERVAL_MS || 5000),
    maxRetries: Number(options.maxRetries || process.env.WORKER_MAX_RETRIES || 3)
  });

  const server = http.createServer((req, res) => {
    const urlObj = new URL(req.url || "/", "http://127.0.0.1");
    const pathname = urlObj.pathname;

    if (req.method === "GET" && pathname === "/healthz") {
      return sendJson(res, 200, { status: "ok", uptime: process.uptime(), localOnly: true });
    }

    if (req.method === "GET" && pathname === "/api/status") {
      return sendJson(res, 200, orchestrator.getStatus());
    }

    if (req.method === "GET" && pathname === "/api/jobs") {
      const q = (urlObj.searchParams.get("q") || "").trim().toLowerCase();
      const filtered = q
        ? SAMPLE_JOBS.filter(
            (j) =>
              j.title.toLowerCase().includes(q) ||
              j.company.toLowerCase().includes(q) ||
              j.location.toLowerCase().includes(q)
          )
        : SAMPLE_JOBS;
      return sendJson(res, 200, { count: filtered.length, jobs: filtered });
    }

    if (req.method === "GET" && pathname === "/api/templates") {
      return sendJson(res, 200, { count: SAMPLE_TEMPLATES.length, templates: SAMPLE_TEMPLATES });
    }

    if (req.method === "GET" && pathname === "/") {
      const html =
        "<!doctype html><html><head><title>Career Orchestrator Local Investigator</title></head><body><h1>Career Orchestrator Local Stack</h1><p>Endpoints: /healthz, /api/status, /api/jobs, /api/templates, /api/orders/template, /api/cover-letters/generate, /api/investigate, /api/mcp</p></body></html>";
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Length": Buffer.byteLength(html),
        "Connection": "close"
      });
      return res.end(html);
    }

    if (
      req.method === "POST" &&
      (pathname === "/api/orders/template" ||
        pathname === "/api/cover-letters/generate" ||
        pathname === "/api/investigate" ||
        pathname === "/api/mcp")
    ) {
      readBody(req)
        .then(async (body) => {
          try {
            if (pathname === "/api/orders/template") {
              const order = orchestrator.createTemplateOrder(body);
              return sendJson(res, 201, { order });
            }
            if (pathname === "/api/cover-letters/generate") {
              const draft = orchestrator.generateCoverLetter(body);
              return sendJson(res, 201, { draft });
            }
            if (pathname === "/api/investigate") {
              const investigation = await investigateTarget(body);
              let aiSynthesis = null;
              if (body.synthesizeWithOllama) {
                aiSynthesis = await runAiDiagnosis(
                  { stage: "http-investigate", investigation },
                  { dataDir, model: body.model }
                );
              }
              const saved = orchestrator.recordInvestigation({
                kind: "http-investigate",
                focus: investigation.focus,
                targetUrl: investigation.targetUrl,
                localPath: investigation.localPath,
                evidenceCount: investigation.evidence.length,
                uncertaintyCount: investigation.uncertainties.length
              });
              return sendJson(res, 200, { investigation, aiSynthesis, recordId: saved.id });
            }
            const rpcResponse = await handleMcpRpc(body, { orchestrator, dataDir });
            return sendJson(res, 200, rpcResponse);
          } catch (err) {
            return sendJson(res, 500, { error: err.message || "Internal server error" });
          }
        })
        .catch((err) => sendJson(res, 400, { error: err.message || "Invalid JSON body" }));
      return;
    }

    return sendJson(res, 404, { error: "Not found", path: pathname });
  });

  server.keepAliveTimeout = 1000;
  server.headersTimeout = 2000;

  const app = {
    listen(port, host, cb) {
      return server.listen(port, host, cb);
    },
    close(cb) {
      server.closeAllConnections?.();
      server.closeIdleConnections?.();
      return server.close(cb);
    },
    rawServer: server
  };

  return { app, orchestrator };
}

if (process.argv[1] && process.argv[1].endsWith("server/index.js")) {
  const host = process.env.HOST || "127.0.0.1";
  const port = Number(process.env.PORT || 4080);
  const { app, orchestrator } = createApp();
  orchestrator.start();
  app.listen(port, host, () => {
    console.log(`[READY] Career Orchestrator running on http://${host}:${port}`);
  });
}
