import { investigateTarget } from "./target-investigator.js";
import { runAiDiagnosis } from "./ai-diagnoser.js";
import { runAutonomousLocalRepair } from "./auto-repair.js";
import { loadCustomTools } from "./tool-loader.js";

const CORE_MCP_TOOLS = [
  {
    name: "investigate_target",
    description:
      "Inspect an authorized HTTP/HTTPS endpoint, HTML structure, scripts, routes, and local files to gather structured observations, evidence, and uncertainties.",
    inputSchema: {
      type: "object",
      properties: {
        targetUrl: { type: "string" },
        localPath: { type: "string" },
        focus: { type: "string" },
        maxScripts: { type: "number" },
        timeoutMs: { type: "number" },
        synthesizeWithOllama: { type: "boolean" }
      }
    }
  },
  {
    name: "diagnose_with_local_ollama",
    description:
      "Run local Ollama diagnostics (127.0.0.1:11434) over a diagnostic or investigation payload and save report artifacts.",
    inputSchema: {
      type: "object",
      properties: {
        report: { type: "object" },
        model: { type: "string" },
        autoRepair: { type: "boolean" }
      },
      required: ["report"]
    }
  },
  {
    name: "repair_with_local_ollama",
    description:
      "Ask local Ollama to plan and execute safe local repairs (Ollama daemon check, directories, script permissions, loopback /healthz, and verify-all tests).",
    inputSchema: {
      type: "object",
      properties: {
        issue: { type: "object" },
        model: { type: "string" },
        triggerVerify: { type: "boolean" }
      }
    }
  },
  {
    name: "orchestrator_status",
    description: "Return current local CareerOrchestrator runtime status and counters.",
    inputSchema: { type: "object", properties: {} }
  }
];

async function getAllTools() {
  const custom = await loadCustomTools();
  const byName = new Map();
  for (const t of CORE_MCP_TOOLS) byName.set(t.name, t);
  for (const t of custom) byName.set(t.name, { name: t.name, description: t.description, inputSchema: t.inputSchema });
  return { schemas: Array.from(byName.values()), customMap: new Map(custom.map((t) => [t.name, t])) };
}

export async function handleMcpRpc(msg, context = {}) {
  const { id = null, method = "", params = {} } = msg || {};
  const { orchestrator, dataDir } = context;

  const ok = (result) => ({ jsonrpc: "2.0", id, result });
  const fail = (code, message) => ({ jsonrpc: "2.0", id, error: { code, message } });

  try {
    if (method === "initialize") {
      return ok({
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: {
          name: "brahma-sol-local-mcp",
          version: "1.3.0"
        }
      });
    }

    if (method === "notifications/initialized" || method === "ping") {
      return ok({});
    }

    if (method === "tools/list") {
      const { schemas } = await getAllTools();
      return ok({ tools: schemas });
    }

    if (method === "tools/call") {
      const toolName = params?.name;
      const args = params?.arguments || {};

      if (toolName === "orchestrator_status") {
        const status = orchestrator ? orchestrator.getStatus() : { running: false, localOnly: true };
        return ok({
          content: [{ type: "text", text: JSON.stringify(status, null, 2) }]
        });
      }

      if (toolName === "investigate_target") {
        const result = await investigateTarget(args);
        let aiAnalysis = null;
        if (args.synthesizeWithOllama) {
          aiAnalysis = await runAiDiagnosis(
            { stage: "mcp-investigate-target", investigation: result },
            { dataDir }
          );
        }
        orchestrator?.recordInvestigation?.({
          kind: "mcp-investigate",
          focus: result.focus,
          targetUrl: result.targetUrl,
          localPath: result.localPath,
          evidenceCount: result.evidence.length,
          uncertaintyCount: result.uncertainties.length
        });
        return ok({
          content: [
            {
              type: "text",
              text: JSON.stringify({ investigation: result, aiAnalysis }, null, 2)
            }
          ]
        });
      }

      if (toolName === "diagnose_with_local_ollama") {
        const diag = await runAiDiagnosis(args.report || {}, {
          dataDir,
          model: args.model,
          autoRepair: Boolean(args.autoRepair)
        });
        return ok({
          content: [{ type: "text", text: JSON.stringify(diag, null, 2) }]
        });
      }

      if (toolName === "repair_with_local_ollama") {
        const repair = await runAutonomousLocalRepair(args.issue || {}, {
          dataDir,
          model: args.model,
          triggerVerify: args.triggerVerify
        });
        return ok({
          content: [{ type: "text", text: JSON.stringify(repair, null, 2) }]
        });
      }

      const { customMap } = await getAllTools();
      const customTool = customMap.get(toolName);
      if (customTool) {
        const out = await customTool.run(args, { orchestrator, dataDir });
        return ok({
          content: [{ type: "text", text: JSON.stringify(out, null, 2) }]
        });
      }

      return fail(-32601, `Unknown MCP tool: ${toolName}`);
    }

    return fail(-32601, `Method not found: ${method}`);
  } catch (err) {
    return fail(-32000, err.message || "MCP execution error");
  }
}
