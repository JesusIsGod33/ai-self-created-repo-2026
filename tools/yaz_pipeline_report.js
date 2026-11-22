import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = "/home/Woken/career-orchestrator-stack";
const MIRROR_DIR = path.join(ROOT_DIR, "data", "yaz-sync");
const PIPELINE_PATH = path.join(MIRROR_DIR, "symbol-pipeline.json");
const REPORT_MD_PATH = path.join(MIRROR_DIR, "symbol-pipeline-report.md");

export const customTools = [
  {
    name: "yaz_pipeline_report",
    description: "Render a human-readable Markdown report from data/yaz-sync/symbol-pipeline.json into data/yaz-sync/symbol-pipeline-report.md.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Maximum number of symbol hits and snippets to include in the Markdown report (default 25)." }
      }
    },
    async run(args = {}) {
      fs.mkdirSync(MIRROR_DIR, { recursive: true });
      if (!fs.existsSync(PIPELINE_PATH)) {
        return { ok: false, error: "symbol-pipeline.json not found. Run yaz-pipeline first." };
      }

      let data = {};
      try {
        data = JSON.parse(fs.readFileSync(PIPELINE_PATH, "utf8"));
      } catch (err) {
        return { ok: false, error: err.message };
      }

      const limit = Number.isFinite(Number(args.limit)) ? Math.max(1, Number(args.limit)) : 25;
      const summary = data.summary || {};
      const byKind = summary.symbolsByKind || {};
      const hits = Array.isArray(data.hits) ? data.hits.slice(0, limit) : [];
      const snippets = Array.isArray(data.snippets) ? data.snippets.slice(0, limit) : [];

      const lines = [
        "# Yaz Symbol Pipeline Report",
        "",
        `- Updated At: ${data.updatedAt || new Date().toISOString()}`,
        `- Mirror Dir: ${data.mirrorDir || MIRROR_DIR}`,
        `- Audited Modules: ${summary.auditedModules ?? 0}`,
        `- Valid Syntax: ${summary.validSyntaxCount ?? 0}`,
        `- Syntax Errors: ${summary.syntaxErrorCount ?? 0}`,
        `- Total Symbols: ${summary.totalSymbols ?? 0} (class: ${byKind.class ?? 0}, def: ${byKind.def ?? 0}, async_def: ${byKind.async_def ?? 0})`,
        `- Total Hits: ${data.totalHits ?? hits.length} (showing ${hits.length})`,
        `- Total Snippets: ${data.totalSnippets ?? snippets.length} (showing ${snippets.length})`,
        "",
        "## Symbol Hits",
        ""
      ];

      if (hits.length === 0) {
        lines.push("_No symbol hits matched._", "");
      } else {
        for (const h of hits) {
          lines.push(`- \`${h.kind}\` **${h.symbol}** in \`${h.relativePath}\` (line ${h.lineno})`);
        }
        lines.push("");
      }

      lines.push("## Code Snippets", "");
      if (snippets.length === 0) {
        lines.push("_No code snippets extracted._", "");
      } else {
        for (const s of snippets) {
          lines.push(`### ${s.symbol} (\`${s.kind}\` at line ${s.lineno})`);
          lines.push(`File: \`${s.relativePath}\``);
          lines.push("```python");
          for (const ex of s.excerpt || []) {
            lines.push(`${ex.lineNumber}: ${ex.text}`);
          }
          lines.push("```");
          lines.push("");
        }
      }

      const markdown = lines.join("\n");
      fs.writeFileSync(REPORT_MD_PATH, markdown, "utf8");

      return {
        ok: true,
        reportMarkdownPath: REPORT_MD_PATH,
        auditedModules: summary.auditedModules ?? 0,
        totalHits: data.totalHits ?? hits.length,
        totalSnippets: data.totalSnippets ?? snippets.length,
        preview: markdown.slice(0, 2000)
      };
    }
  }
];
