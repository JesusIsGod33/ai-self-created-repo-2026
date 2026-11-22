import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = "/home/Woken/career-orchestrator-stack";
const MIRROR_DIR = path.join(ROOT_DIR, "data", "yaz-sync");

function scanMirror(dirPath, baseDir, query, acc) {
  if (!fs.existsSync(dirPath)) return;
  let entries = [];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name === "manifest.json" || entry.name === "catalog.json") continue;
    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.relative(baseDir, fullPath);
    const matches = !query || new RegExp(query, "i").test(entry.name) || new RegExp(query, "i").test(relPath);
    if (entry.isDirectory()) {
      scanMirror(fullPath, baseDir, query, acc);
    } else if (entry.isFile() && matches) {
      let size = 0;
      let mtimeMs = 0;
      try {
        const st = fs.statSync(fullPath);
        size = st.size;
        mtimeMs = st.mtimeMs;
      } catch {
        continue;
      }
      acc.push({
        name: entry.name,
        relativePath: relPath,
        fullPath,
        extension: path.extname(entry.name).toLowerCase(),
        size,
        mtimeMs
      });
    }
  }
}

export const customTools = [
  {
    name: "yaz_mirror_catalog",
    description: "Index and filter synced yaz files inside data/yaz-sync by optional regex pattern and write data/yaz-sync/catalog.json.",
    inputSchema: {
      type: "object",
      properties: {
        pattern: { type: "string", description: "Optional regex filter matching file name or relative path." },
        limit: { type: "number", description: "Maximum number of file entries to return (default 200)." }
      }
    },
    async run(args = {}) {
      fs.mkdirSync(MIRROR_DIR, { recursive: true });
      const pattern = args.pattern || "";
      const limit = Number.isFinite(Number(args.limit)) ? Math.max(1, Number(args.limit)) : 200;
      const allFiles = [];
      scanMirror(MIRROR_DIR, MIRROR_DIR, pattern, allFiles);

      const byExtension = {};
      for (const f of allFiles) {
        const ext = f.extension || "(none)";
        byExtension[ext] = (byExtension[ext] || 0) + 1;
      }

      const catalogPath = path.join(MIRROR_DIR, "catalog.json");
      const catalog = {
        updatedAt: new Date().toISOString(),
        mirrorDir: MIRROR_DIR,
        pattern,
        totalFiles: allFiles.length,
        byExtension,
        entries: allFiles
      };
      fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), "utf8");

      return {
        ok: true,
        catalogPath,
        totalFiles: allFiles.length,
        returnedCount: Math.min(allFiles.length, limit),
        byExtension,
        entries: allFiles.slice(0, limit)
      };
    }
  }
];
