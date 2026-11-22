import assert from "node:assert/strict";
import { once } from "node:events";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { createApp } from "../server/index.js";
import { handleMcpRpc } from "../server/mcp-server.js";
import { runAiDiagnosis } from "../server/ai-diagnoser.js";

function requestJson(port, method, reqPath, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: "127.0.0.1",
        family: 4,
        port,
        path: reqPath,
        method,
        agent: false,
        timeout: 8000,
        headers: {
          "Content-Type": "application/json",
          "Connection": "close",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {})
        }
      },
      (res) => {
        const chunks = [];
        res.on("data", (d) => chunks.push(d));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          resolve({ status: res.statusCode, data: text ? JSON.parse(text) : null });
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error(`Timeout on ${method} ${reqPath}`)));
    if (payload) req.write(payload);
    req.end();
  });
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "co-verify-"));
const { app, orchestrator } = createApp({ dataDir: tempDir, intervalMs: 5000 });

const srv = app.listen(0, "127.0.0.1");
await once(srv, "listening");
const { port } = srv.address();

let exitCode = 0;
try {
  orchestrator.start();

  const health = await requestJson(port, "GET", "/healthz");
  assert.equal(health.status, 200);
  assert.equal(health.data.status, "ok");

  const jobs = await requestJson(port, "GET", "/api/jobs?q=Support");
  assert.ok(jobs.data.count >= 1);

  const tpls = await requestJson(port, "GET", "/api/templates");
  assert.ok(tpls.data.count >= 4);

  const ord = await requestJson(port, "POST", "/api/orders/template", {
    templateId: tpls.data.templates[0].id,
    customTailoring: true,
    targetRole: "Support Specialist",
    targetCompany: "Northstar Cloud Health"
  });
  assert.equal(ord.data.order.fulfillmentStatus, "completed");

  const cl = await requestJson(port, "POST", "/api/cover-letters/generate", {
    candidateName: "Alex Rivera",
    targetRole: "Support Specialist",
    company: "Northstar Cloud Health"
  });
  assert.ok(cl.data.draft.draftText.includes("Northstar Cloud Health"));

  const inv = await requestJson(port, "POST", "/api/investigate", {
    targetUrl: `http://127.0.0.1:${port}/`,
    focus: "Inspect observable HTML headings, links, and endpoints on local stack"
  });
  assert.equal(inv.status, 200);
  assert.equal(inv.data.investigation.htmlAnalysis.title, "Career Orchestrator Local Investigator");
  assert.ok(Array.isArray(inv.data.investigation.evidence) && inv.data.investigation.evidence.length >= 1);
  assert.ok(Array.isArray(inv.data.investigation.uncertainties) && inv.data.investigation.uncertainties.length >= 1);

  const mcpList = await handleMcpRpc({ jsonrpc: "2.0", id: 1, method: "tools/list" }, { orchestrator, dataDir: tempDir });
  assert.ok(Array.isArray(mcpList.result.tools) && mcpList.result.tools.length >= 4);

  const mcpCall = await handleMcpRpc(
    {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "investigate_target",
        arguments: {
          localPath: "/home/Woken/career-orchestrator-stack/server/orchestrator.js",
          focus: "Inspect exported class and methods in orchestrator.js"
        }
      }
    },
    { orchestrator, dataDir: tempDir }
  );
  assert.ok(mcpCall.result.content[0].text.includes("CareerOrchestrator"));

  console.log("[VERIFY] Passed all full-stack, investigation, and MCP checks.");
} catch (err) {
  exitCode = 1;
  await runAiDiagnosis({
    stage: "verify-all",
    port,
    error: err.message,
    stack: err.stack
  });
  console.error(err);
} finally {
  orchestrator.stop();
  srv.closeAllConnections?.();
  srv.closeIdleConnections?.();
  srv.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
  setImmediate(() => process.exit(exitCode));
}
