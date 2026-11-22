import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = "/home/Woken/career-orchestrator-stack";
const MIRROR_DIR = path.join(ROOT_DIR, "data", "yaz-sync");

function findPythonModules(dirPath, baseDir, nameRegex, acc) {
  if (!fs.existsSync(dirPath)) return;
  let entries = [];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name === "__pycache__") continue;
    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.relative(baseDir, fullPath);
    if (entry.isDirectory()) {
      findPythonModules(fullPath, baseDir, nameRegex, acc);
    } else if (entry.isFile() && entry.name.endsWith(".py")) {
      if (nameRegex && !nameRegex.test(entry.name) && !nameRegex.test(relPath)) {
        continue;
      }
      let content = "";
      let st = null;
      try {
        st = fs.statSync(fullPath);
        content = fs.readFileSync(fullPath, "utf8");
      } catch {
        continue;
      }
      const lines = content.split(/\r?\n/);
      const defs = lines
        .map((line, idx) => ({ line: line.trim(), lineNumber: idx + 1 }))
        .filter((item) => /^(def |async def |class )/.test(item.line))
        .slice(0, 25);

      acc.push({
        name: entry.name,
        relativePath: relPath,
        fullPath,
        size: st.size,
        lineCount: lines.length,
        symbols: defs
      });
    }
  }
}

export const customTools = [
  {
    name: "yaz_module_inspector",
    description: "Inspect synced Python modules inside data/yaz-sync, extract function and class signatures, and write data/yaz-sync/module-index.json.",
    inputSchema: {
      type: "object",
      properties: {
        pattern: { type: "string", description: "Optional regex pattern to filter module names or paths." },
        limit: { type: "number", description: "Maximum number of inspected modules to return (default 50)." }
      }
    },
    async run(args = {}) {
      fs.mkdirSync(MIRROR_DIR, { recursive: true });
      const nameRegex = args.pattern ? new RegExp(args.pattern, "i") : null;
      const limit = Number.isFinite(Number(args.limit)) ? Math.max(1, Number(args.limit)) : 50;
      const modules = [];
      findPythonModules(MIRROR_DIR, MIRROR_DIR, nameRegex, modules);

      const indexPath = path.join(MIRROR_DIR, "module-index.json");
      const payload = {
        updatedAt: new Date().toISOString(),
        mirrorDir: MIRROR_DIR,
        pattern: args.pattern || "",
        totalMatched: modules.length,
        modules
      };
      fs.writeFileSync(indexPath, JSON.stringify(payload, null, 2), "utf8");

      return {
        ok: true,
        indexPath,
        totalMatched: modules.length,
        returnedCount: Math.min(modules.length, limit),
        modules: modules.slice(0, limit)
      };
    }
  }
];
