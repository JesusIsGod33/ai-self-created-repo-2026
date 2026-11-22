import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const ROOT_DIR = "/home/Woken/career-orchestrator-stack";
const MIRROR_DIR = path.join(ROOT_DIR, "data", "yaz-sync");
const REPORT_PATH = path.join(MIRROR_DIR, "symbol-audit.json");

function collectPyFiles(dirPath, baseDir, maxFiles, acc = []) {
  if (!fs.existsSync(dirPath) || acc.length >= maxFiles) return acc;
  let entries = [];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    if (acc.length >= maxFiles) break;
    if (entry.name === "__pycache__" || entry.name === ".git" || entry.name === "node_modules") continue;
    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.relative(baseDir, fullPath);
    if (entry.isDirectory()) {
      collectPyFiles(fullPath, baseDir, maxFiles, acc);
    } else if (entry.isFile() && entry.name.endsWith(".py")) {
      acc.push({ name: entry.name, relativePath: relPath, fullPath });
    }
  }
  return acc;
}

export const customTools = [
  {
    name: "yaz_symbol_runner",
    description: "Run AST syntax checks across synced Python files in data/yaz-sync and search matching classes, functions, or methods into data/yaz-sync/symbol-audit.json.",
    inputSchema: {
      type: "object",
      properties: {
        pattern: { type: "string", description: "Optional regex filter for module name, path, or symbol name." },
        checkSyntax: { type: "boolean", description: "Run Python ast.parse syntax check on matched files (default true)." },
        limit: { type: "number", description: "Maximum number of file entries to return (default 50)." },
        maxFiles: { type: "number", description: "Maximum number of Python files to scan (default 400)." }
      }
    },
    async run(args = {}) {
      fs.mkdirSync(MIRROR_DIR, { recursive: true });
      const checkSyntax = args.checkSyntax !== false;
      const limit = Number.isFinite(Number(args.limit)) ? Math.max(1, Number(args.limit)) : 50;
      const maxFiles = Number.isFinite(Number(args.maxFiles)) ? Math.max(10, Math.min(2000, Number(args.maxFiles))) : 400;
      const regex = args.pattern ? new RegExp(args.pattern, "i") : null;

      const allPy = collectPyFiles(MIRROR_DIR, MIRROR_DIR, maxFiles, []).filter((f) => {
        if (!regex) return true;
        return regex.test(f.name) || regex.test(f.relativePath);
      });

      if (allPy.length === 0) {
        const emptyReport = {
          updatedAt: new Date().toISOString(),
          mirrorDir: MIRROR_DIR,
          pattern: args.pattern || "",
          totalMatched: 0,
          syntaxErrorCount: 0,
          results: []
        };
        fs.writeFileSync(REPORT_PATH, JSON.stringify(emptyReport, null, 2), "utf8");
        return {
          ok: true,
          reportPath: REPORT_PATH,
          totalMatched: 0,
          syntaxErrorCount: 0,
          returnedCount: 0,
          results: []
        };
      }

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "yaz-ast-"));
      const workerScript = path.join(tmpDir, "audit_worker.py");
      const inputJsonPath = path.join(tmpDir, "items.json");
      const outputJsonPath = path.join(tmpDir, "out.json");

      const pyCode = [
        "import ast, json, re, sys",
        "items_path, out_path, flag_str, pat_str = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]",
        "with open(items_path, 'r', encoding='utf-8') as f:",
        "    items = json.load(f)",
        "check_syntax = flag_str == '1'",
        "sym_pat = re.compile(pat_str, re.I) if pat_str else None",
        "out = []",
        "for it in items:",
        "    p = it['fullPath']",
        "    try:",
        "        with open(p, 'r', encoding='utf-8', errors='replace') as fh:",
        "            src = fh.read()",
        "    except Exception as e:",
        "        out.append({'name': it['name'], 'relativePath': it['relativePath'], 'syntaxOk': False, 'syntaxError': str(e), 'symbols': []})",
        "        continue",
        "    syntax_ok = True",
        "    syntax_err = None",
        "    syms = []",
        "    if check_syntax:",
        "        try:",
        "            tree = ast.parse(src, filename=p)",
        "            for node in ast.walk(tree):",
        "                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):",
        "                    kind = 'class' if isinstance(node, ast.ClassDef) else ('async_def' if isinstance(node, ast.AsyncFunctionDef) else 'def')",
        "                    if not sym_pat or sym_pat.search(node.name) or sym_pat.search(it['name']) or sym_pat.search(it['relativePath']):",
        "                        syms.append({'kind': kind, 'name': node.name, 'lineno': node.lineno})",
        "        except SyntaxError as se:",
        "            syntax_ok = False",
        "            syntax_err = f'{se.msg} (line {se.lineno})'",
        "    out.append({'name': it['name'], 'relativePath': it['relativePath'], 'syntaxOk': syntax_ok, 'syntaxError': syntax_err, 'symbols': syms})",
        "with open(out_path, 'w', encoding='utf-8') as out_f:",
        "    json.dump(out, out_f)"
      ].join("\n");

      try {
        fs.writeFileSync(workerScript, pyCode, "utf8");
        fs.writeFileSync(inputJsonPath, JSON.stringify(allPy), "utf8");
        const pyBin = process.env.PYTHON_BIN || "python3";
        await execFileAsync(
          pyBin,
          [workerScript, inputJsonPath, outputJsonPath, checkSyntax ? "1" : "0", args.pattern || ""],
          { timeout: 15000, maxBuffer: 1024 * 1024 * 4, killSignal: "SIGKILL" }
        );
        const rawOut = fs.existsSync(outputJsonPath) ? fs.readFileSync(outputJsonPath, "utf8") : "[]";
        const results = JSON.parse((rawOut || "[]").trim() || "[]");
        const syntaxErrors = results.filter((r) => !r.syntaxOk);
        const report = {
          updatedAt: new Date().toISOString(),
          mirrorDir: MIRROR_DIR,
          pattern: args.pattern || "",
          totalMatched: results.length,
          syntaxErrorCount: syntaxErrors.length,
          results
        };
        fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");

        return {
          ok: true,
          reportPath: REPORT_PATH,
          totalMatched: results.length,
          syntaxErrorCount: syntaxErrors.length,
          returnedCount: Math.min(results.length, limit),
          results: results.slice(0, limit)
        };
      } catch (err) {
        return { ok: false, error: err.message };
      } finally {
        try {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        } catch {}
      }
    }
  }
];
