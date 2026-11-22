import fs from "node:fs";
import path from "node:path";
import { loadCustomTools } from "../server/tool-loader.js";

const ROOT_DIR = "/home/Woken/career-orchestrator-stack";
const MIRROR_DIR = path.join(ROOT_DIR, "data", "yaz-sync");
const REPORT_MD_PATH = path.join(MIRROR_DIR, "symbol-pipeline-report.md");

export const customTools = [
  {
    name: "yaz_report_note",
    description: "Append a structured workspace note summarizing data/yaz-sync/symbol-pipeline-report.md into data/sol-assistant-notes.md.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Optional note heading (default 'Yaz Symbol Pipeline Report')." },
        maxLines: { type: "number", description: "Maximum lines from symbol-pipeline-report.md to include (default 40)." }
      }
    },
    async run(args = {}) {
      if (!fs.existsSync(REPORT_MD_PATH)) {
        return { ok: false, error: "symbol-pipeline-report.md not found. Run yaz-report first." };
      }

      const loaded = await loadCustomTools(path.join(ROOT_DIR, "tools"));
      const noteTool = loaded.find((t) => t.name === "sol_workspace_note");
      if (!noteTool) {
        return { ok: false, error: "sol_workspace_note tool not found in tools/." };
      }

      const maxLines = Number.isFinite(Number(args.maxLines))
        ? Math.max(5, Math.min(200, Number(args.maxLines)))
        : 40;
      const rawMd = fs.readFileSync(REPORT_MD_PATH, "utf8");
      const excerpt = rawMd.split(/\r?\n/).slice(0, maxLines).join("\n");
      const title = args.title ? String(args.title).trim() : "Yaz Symbol Pipeline Report";

      const result = await noteTool.run({
        title,
        body: `Source: ${REPORT_MD_PATH}\n\n${excerpt}`
      });

      return {
        ok: Boolean(result && result.ok !== false),
        sourceReportPath: REPORT_MD_PATH,
        includedLines: Math.min(rawMd.split(/\r?\n/).length, maxLines),
        noteResult: result
      };
    }
  }
];
