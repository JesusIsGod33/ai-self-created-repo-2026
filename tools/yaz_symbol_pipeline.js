import fs from "node:fs";
import path from "node:path";
import { loadCustomTools } from "../server/tool-loader.js";

const ROOT_DIR = "/home/Woken/career-orchestrator-stack";
const MIRROR_DIR = path.join(ROOT_DIR, "data", "yaz-sync");
const PIPELINE_PATH = path.join(MIRROR_DIR, "symbol-pipeline.json");

export const customTools = [
  {
    name: "yaz_symbol_pipeline",
    description: "Run an end-to-end AST audit, summary rollup, symbol search, and source snippet extraction pipeline on data/yaz-sync into data/yaz-sync/symbol-pipeline.json.",
    inputSchema: {
      type: "object",
      properties: {
        pattern: { type: "string", description: "Optional regex filter for module name, path, or symbol name." },
        kind: { type: "string", description: "Optional symbol kind filter: class, def, or async_def." },
        contextLines: { type: "number", description: "Source lines before and after each matched symbol line (default 4)." },
        limit: { type: "number", description: "Maximum number of snippet and hit entries to return (default 25)." },
        maxFiles: { type: "number", description: "Maximum number of Python files scanned during AST audit (default 400)." }
      }
    },
    async run(args = {}) {
      fs.mkdirSync(MIRROR_DIR, { recursive: true });
      const loaded = await loadCustomTools(path.join(ROOT_DIR, "tools"));
      const byName = new Map(loaded.map((t) => [t.name, t]));

      const runner = byName.get("yaz_symbol_runner");
      const summaryTool = byName.get("yaz_symbol_summary");
      const searchTool = byName.get("yaz_symbol_search");
      const snippetsTool = byName.get("yaz_symbol_snippets");

      if (!runner || !summaryTool || !searchTool || !snippetsTool) {
        return { ok: false, error: "One or more required yaz_symbol_* tools are missing from tools/." };
      }

      const pattern = args.pattern || "";
      const kind = args.kind || "";
      const contextLines = Number.isFinite(Number(args.contextLines))
        ? Math.max(0, Math.min(30, Number(args.contextLines)))
        : 4;
      const limit = Number.isFinite(Number(args.limit)) ? Math.max(1, Number(args.limit)) : 25;
      const maxFiles = Number.isFinite(Number(args.maxFiles))
        ? Math.max(10, Math.min(2000, Number(args.maxFiles)))
        : 400;

      const audit = await runner.run({
        pattern,
        checkSyntax: true,
        limit,
        maxFiles
      });
      if (!audit.ok) {
        return { ok: false, stage: "audit", error: audit.error };
      }

      const summary = await summaryTool.run({ pattern });
      if (!summary.ok) {
        return { ok: false, stage: "summary", error: summary.error };
      }

      const search = await searchTool.run({ pattern, kind, limit });
      if (!search.ok) {
        return { ok: false, stage: "search", error: search.error };
      }

      const snippets = await snippetsTool.run({ pattern, kind, contextLines, limit });
      if (!snippets.ok) {
        return { ok: false, stage: "snippets", error: snippets.error };
      }

      const pipelineReport = {
        updatedAt: new Date().toISOString(),
        mirrorDir: MIRROR_DIR,
        pipelinePath: PIPELINE_PATH,
        filters: { pattern, kind, contextLines, limit, maxFiles },
        summary: {
          auditedModules: summary.auditedModules,
          validSyntaxCount: summary.validSyntaxCount,
          syntaxErrorCount: summary.syntaxErrorCount,
          totalSymbols: summary.totalSymbols,
          symbolsByKind: summary.symbolsByKind,
          brokenModules: summary.brokenModules
        },
        totalHits: search.totalHits,
        hits: search.hits,
        totalSnippets: snippets.totalSnippets,
        snippets: snippets.snippets
      };

      fs.writeFileSync(PIPELINE_PATH, JSON.stringify(pipelineReport, null, 2), "utf8");

      return {
        ok: true,
        pipelinePath: PIPELINE_PATH,
        summary: pipelineReport.summary,
        totalHits: search.totalHits,
        returnedHits: search.hits.length,
        hits: search.hits,
        totalSnippets: snippets.totalSnippets,
        returnedSnippets: snippets.snippets.length,
        snippets: snippets.snippets
      };
    }
  }
];
