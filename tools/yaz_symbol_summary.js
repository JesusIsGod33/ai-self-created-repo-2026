import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = "/home/Woken/career-orchestrator-stack";
const MIRROR_DIR = path.join(ROOT_DIR, "data", "yaz-sync");
const AUDIT_PATH = path.join(MIRROR_DIR, "symbol-audit.json");
const SUMMARY_PATH = path.join(MIRROR_DIR, "symbol-summary.json");

export const customTools = [
  {
    name: "yaz_symbol_summary",
    description: "Summarize data/yaz-sync/symbol-audit.json into module counts, class/function symbol totals, and syntax error lists into data/yaz-sync/symbol-summary.json.",
    inputSchema: {
      type: "object",
      properties: {
        pattern: { type: "string", description: "Optional regex filter applied to module name or relativePath." }
      }
    },
    async run(args = {}) {
      fs.mkdirSync(MIRROR_DIR, { recursive: true });
      if (!fs.existsSync(AUDIT_PATH)) {
        return { ok: false, error: "symbol-audit.json not found. Run yaz-audit first." };
      }

      let parsed = {};
      try {
        parsed = JSON.parse(fs.readFileSync(AUDIT_PATH, "utf8"));
      } catch (err) {
        return { ok: false, error: err.message };
      }

      const regex = args.pattern ? new RegExp(args.pattern, "i") : null;
      const items = Array.isArray(parsed.results)
        ? parsed.results.filter((r) => !regex || regex.test(r.name) || regex.test(r.relativePath))
        : [];

      const byKind = { class: 0, def: 0, async_def: 0 };
      const brokenModules = [];
      const moduleBreakdown = [];

      for (const item of items) {
        const syms = Array.isArray(item.symbols) ? item.symbols : [];
        let classes = 0;
        let defs = 0;
        let asyncDefs = 0;
        for (const s of syms) {
          if (s.kind === "class") {
            classes += 1;
            byKind.class += 1;
          } else if (s.kind === "async_def") {
            asyncDefs += 1;
            byKind.async_def += 1;
          } else {
            defs += 1;
            byKind.def += 1;
          }
        }
        if (!item.syntaxOk) {
          brokenModules.push({
            name: item.name,
            relativePath: item.relativePath,
            syntaxError: item.syntaxError || "Unknown syntax error"
          });
        }
        moduleBreakdown.push({
          name: item.name,
          relativePath: item.relativePath,
          syntaxOk: Boolean(item.syntaxOk),
          symbolCount: syms.length,
          classes,
          defs,
          asyncDefs
        });
      }

      const summary = {
        updatedAt: new Date().toISOString(),
        sourceAuditPath: AUDIT_PATH,
        pattern: args.pattern || "",
        auditedModules: items.length,
        validSyntaxCount: items.length - brokenModules.length,
        syntaxErrorCount: brokenModules.length,
        totalSymbols: byKind.class + byKind.def + byKind.async_def,
        symbolsByKind: byKind,
        brokenModules,
        modules: moduleBreakdown
      };

      fs.writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2), "utf8");

      return {
        ok: true,
        summaryPath: SUMMARY_PATH,
        auditedModules: summary.auditedModules,
        validSyntaxCount: summary.validSyntaxCount,
        syntaxErrorCount: summary.syntaxErrorCount,
        totalSymbols: summary.totalSymbols,
        symbolsByKind: summary.symbolsByKind,
        brokenModules: summary.brokenModules,
        modules: summary.modules
      };
    }
  }
];
