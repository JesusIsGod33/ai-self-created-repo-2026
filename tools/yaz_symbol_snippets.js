import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = "/home/Woken/career-orchestrator-stack";
const MIRROR_DIR = path.join(ROOT_DIR, "data", "yaz-sync");
const AUDIT_PATH = path.join(MIRROR_DIR, "symbol-audit.json");
const SNIPPETS_PATH = path.join(MIRROR_DIR, "symbol-snippets.json");

function resolveSafeMirrorPath(relativePath) {
  const normalized = path.normalize(String(relativePath || "")).replace(/^(\.\.(\/|\\|$))+/, "");
  const resolved = path.resolve(MIRROR_DIR, normalized);
  if (!resolved.startsWith(MIRROR_DIR + path.sep) && resolved !== MIRROR_DIR) {
    return null;
  }
  return resolved;
}

export const customTools = [
  {
    name: "yaz_symbol_snippets",
    description: "Extract surrounding source lines around matched symbols from data/yaz-sync/symbol-audit.json into data/yaz-sync/symbol-snippets.json.",
    inputSchema: {
      type: "object",
      properties: {
        pattern: { type: "string", description: "Regex filter for symbol name, module name, or relativePath." },
        kind: { type: "string", description: "Optional symbol kind filter: class, def, or async_def." },
        contextLines: { type: "number", description: "Number of source lines before and after each symbol line (default 4)." },
        limit: { type: "number", description: "Maximum number of code snippets to return (default 25)." }
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
      const contextLines = Number.isFinite(Number(args.contextLines))
        ? Math.max(0, Math.min(30, Number(args.contextLines)))
        : 4;
      const limit = Number.isFinite(Number(args.limit)) ? Math.max(1, Number(args.limit)) : 25;

      const lineCache = new Map();
      const snippets = [];
      const sourceResults = Array.isArray(parsed.results) ? parsed.results : [];

      for (const mod of sourceResults) {
        const safePath = resolveSafeMirrorPath(mod.relativePath);
        if (!safePath || !fs.existsSync(safePath)) continue;

        let lines = lineCache.get(safePath);
        if (!lines) {
          const raw = fs.readFileSync(safePath, "utf8");
          lines = raw.split(/\r?\n/);
          lineCache.set(safePath, lines);
        }

        const syms = Array.isArray(mod.symbols) ? mod.symbols : [];
        for (const s of syms) {
          const kindOk = !kindFilter || s.kind === kindFilter;
          const patOk = !regex || regex.test(s.name) || regex.test(mod.name) || regex.test(mod.relativePath);
          if (!kindOk || !patOk) continue;

          const lineno = Number(s.lineno) || 1;
          const startIdx = Math.max(0, lineno - 1 - contextLines);
          const endIdx = Math.min(lines.length, lineno + contextLines);
          const excerpt = lines.slice(startIdx, endIdx).map((text, offset) => ({
            lineNumber: startIdx + offset + 1,
            text
          }));

          snippets.push({
            module: mod.name,
            relativePath: mod.relativePath,
            kind: s.kind,
            symbol: s.name,
            lineno,
            excerpt
          });
        }
      }

      const payload = {
        updatedAt: new Date().toISOString(),
        sourceAuditPath: AUDIT_PATH,
        pattern: args.pattern || "",
        kind: kindFilter,
        contextLines,
        totalSnippets: snippets.length,
        snippets
      };

      fs.writeFileSync(SNIPPETS_PATH, JSON.stringify(payload, null, 2), "utf8");

      return {
        ok: true,
        snippetsPath: SNIPPETS_PATH,
        totalSnippets: snippets.length,
        returnedCount: Math.min(snippets.length, limit),
        snippets: snippets.slice(0, limit)
      };
    }
  }
];
