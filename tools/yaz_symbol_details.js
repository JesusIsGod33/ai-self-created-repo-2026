import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = "/home/Woken/career-orchestrator-stack";
const MIRROR_DIR = path.join(ROOT_DIR, "data", "yaz-sync");
const AUDIT_PATH = path.join(MIRROR_DIR, "symbol-audit.json");
const DETAILS_PATH = path.join(MIRROR_DIR, "symbol-details.json");

export const customTools = [
  {
    name: "yaz_symbol_details",
    description: "Inspect detailed symbol entries and line numbers for a specific module or regex pattern from data/yaz-sync/symbol-audit.json into data/yaz-sync/symbol-details.json.",
    inputSchema: {
      type: "object",
      properties: {
        pattern: { type: "string", description: "Regex pattern matching module name, relativePath, or symbol name." },
        kind: { type: "string", description: "Optional symbol kind filter: class, def, or async_def." },
        limit: { type: "number", description: "Maximum number of matched modules to return (default 20)." }
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
      const kindFilter = args.kind ? String(args.kind).trim() : "";
      const limit = Number.isFinite(Number(args.limit)) ? Math.max(1, Number(args.limit)) : 20;

      const sourceResults = Array.isArray(parsed.results) ? parsed.results : [];
      const matched = [];

      for (const item of sourceResults) {
        const syms = Array.isArray(item.symbols) ? item.symbols : [];
        const filteredSyms = syms.filter((s) => {
          const kindOk = !kindFilter || s.kind === kindFilter;
          const patOk = !regex || regex.test(s.name) || regex.test(item.name) || regex.test(item.relativePath);
          return kindOk && patOk;
        });

        if (!regex || regex.test(item.name) || regex.test(item.relativePath) || filteredSyms.length > 0) {
          matched.push({
            name: item.name,
            relativePath: item.relativePath,
            syntaxOk: Boolean(item.syntaxOk),
            syntaxError: item.syntaxError || null,
            matchedSymbolCount: filteredSyms.length,
            symbols: filteredSyms
          });
        }
      }

      const detailsPayload = {
        updatedAt: new Date().toISOString(),
        sourceAuditPath: AUDIT_PATH,
        pattern: args.pattern || "",
        kind: kindFilter,
        totalMatchedModules: matched.length,
        modules: matched
      };

      fs.writeFileSync(DETAILS_PATH, JSON.stringify(detailsPayload, null, 2), "utf8");

      return {
        ok: true,
        detailsPath: DETAILS_PATH,
        totalMatchedModules: matched.length,
        returnedCount: Math.min(matched.length, limit),
        modules: matched.slice(0, limit)
      };
    }
  }
];
