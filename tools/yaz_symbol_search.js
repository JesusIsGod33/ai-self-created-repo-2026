import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = "/home/Woken/career-orchestrator-stack";
const MIRROR_DIR = path.join(ROOT_DIR, "data", "yaz-sync");
const AUDIT_PATH = path.join(MIRROR_DIR, "symbol-audit.json");
const SEARCH_PATH = path.join(MIRROR_DIR, "symbol-search.json");

export const customTools = [
  {
    name: "yaz_symbol_search",
    description: "Search flat symbol hits across data/yaz-sync/symbol-audit.json by symbol name regex, module pattern, or symbol kind and write data/yaz-sync/symbol-search.json.",
    inputSchema: {
      type: "object",
      properties: {
        pattern: { type: "string", description: "Regex matching symbol name, module name, or relativePath." },
        kind: { type: "string", description: "Optional symbol kind filter: class, def, or async_def." },
        limit: { type: "number", description: "Maximum number of flat symbol hits to return (default 100)." }
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
      const limit = Number.isFinite(Number(args.limit)) ? Math.max(1, Number(args.limit)) : 100;

      const hits = [];
      const sourceResults = Array.isArray(parsed.results) ? parsed.results : [];

      for (const mod of sourceResults) {
        const syms = Array.isArray(mod.symbols) ? mod.symbols : [];
        for (const s of syms) {
          const kindOk = !kindFilter || s.kind === kindFilter;
          const patOk = !regex || regex.test(s.name) || regex.test(mod.name) || regex.test(mod.relativePath);
          if (kindOk && patOk) {
            hits.push({
              module: mod.name,
              relativePath: mod.relativePath,
              syntaxOk: Boolean(mod.syntaxOk),
              kind: s.kind,
              symbol: s.name,
              lineno: s.lineno
            });
          }
        }
      }

      const searchPayload = {
        updatedAt: new Date().toISOString(),
        sourceAuditPath: AUDIT_PATH,
        pattern: args.pattern || "",
        kind: kindFilter,
        totalHits: hits.length,
        hits
      };

      fs.writeFileSync(SEARCH_PATH, JSON.stringify(searchPayload, null, 2), "utf8");

      return {
        ok: true,
        searchPath: SEARCH_PATH,
        totalHits: hits.length,
        returnedCount: Math.min(hits.length, limit),
        hits: hits.slice(0, limit)
      };
    }
  }
];
