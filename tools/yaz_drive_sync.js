import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const ROOT_DIR = "/home/Woken/career-orchestrator-stack";
const SYNC_MIRROR_DIR = path.join(ROOT_DIR, "data", "yaz-sync");

function collectYazEntries(dirPath, baseDir, depth = 0, maxDepth = 5, acc = []) {
  if (!fs.existsSync(dirPath) || depth > maxDepth) return acc;
  let entries = [];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.relative(baseDir, fullPath);
    const matchesYaz = /yaz/i.test(entry.name) || /yaz/i.test(relPath);
    if (matchesYaz) {
      let size = 0;
      let mtimeMs = 0;
      try {
        const st = fs.statSync(fullPath);
        size = st.isFile() ? st.size : 0;
        mtimeMs = st.mtimeMs;
      } catch {
        continue;
      }
      acc.push({
        name: entry.name,
        relativePath: relPath,
        fullPath,
        type: entry.isDirectory() ? "directory" : "file",
        size,
        mtimeMs
      });
    }
    if (entry.isDirectory() && depth < maxDepth) {
      collectYazEntries(fullPath, baseDir, depth + 1, maxDepth, acc);
    }
  }
  return acc;
}

async function syncViaWindowsCopy(dryRun) {
  const psScript = [
    "$destRoot = '\\\\wsl.localhost\\kali-linux\\home\\Woken\\career-orchestrator-stack\\data\\yaz-sync'",
    "if (-not (Test-Path -LiteralPath $destRoot)) { New-Item -ItemType Directory -Path $destRoot -Force | Out-Null }",
    "$items = @()",
    "if (Test-Path -LiteralPath 'D:\\') {",
    "  Get-ChildItem -LiteralPath 'D:\\' -Force -ErrorAction SilentlyContinue | Where-Object { $_.Name -match 'yaz' } | ForEach-Object {",
    "    $target = Join-Path $destRoot $_.Name",
    "    if (-not " + (dryRun ? "$true" : "$false") + ") {",
    "      if ($_.PSIsContainer) {",
    "        Copy-Item -LiteralPath $_.FullName -Destination $target -Recurse -Force -ErrorAction SilentlyContinue",
    "      } else {",
    "        Copy-Item -LiteralPath $_.FullName -Destination $target -Force -ErrorAction SilentlyContinue",
    "      }",
    "    }",
    "    $items += [PSCustomObject]@{ source = $_.FullName; destination = $target; type = if ($_.PSIsContainer) { 'directory' } else { 'file' } }",
    "  }",
    "}",
    "$items | ConvertTo-Json -Compress"
  ].join("; ");

  try {
    const { stdout } = await execFileAsync(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", psScript],
      { timeout: 25000, maxBuffer: 1024 * 1024 * 4 }
    );
    const trimmed = (stdout || "").trim();
    if (!trimmed) return [];
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

export const customTools = [
  {
    name: "yaz_drive_sync",
    description: "Discover and sync all 'yaz' files and folders from Windows drive D:\\ into data/yaz-sync and report mount/mirror status.",
    inputSchema: {
      type: "object",
      properties: {
        mountRoot: { type: "string", description: "Optional WSL mount path for D: (defaults to /mnt/d)." },
        dryRun: { type: "boolean", description: "Preview matching yaz items without copying when true." }
      }
    },
    async run(args = {}) {
      const mountRoot = args.mountRoot || "/mnt/d";
      const dryRun = Boolean(args.dryRun);
      fs.mkdirSync(SYNC_MIRROR_DIR, { recursive: true });

      const mountExists = fs.existsSync(mountRoot);
      const winCopied = await syncViaWindowsCopy(dryRun);
      const mirroredMatches = collectYazEntries(SYNC_MIRROR_DIR, SYNC_MIRROR_DIR, 0, 5, []);

      const manifestPath = path.join(SYNC_MIRROR_DIR, "manifest.json");
      const manifest = {
        updatedAt: new Date().toISOString(),
        windowsDrive: "D:\\",
        wslMountRoot: mountRoot,
        wslMountAvailable: mountExists,
        dryRun,
        matchedCount: mirroredMatches.length,
        syncedCount: dryRun ? 0 : mirroredMatches.filter((m) => m.type === "file").length,
        windowsSyncedRoots: winCopied,
        mirroredEntries: mirroredMatches
      };
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

      return {
        ok: true,
        manifestPath,
        mirrorDir: SYNC_MIRROR_DIR,
        wslMountAvailable: mountExists,
        matchedCount: mirroredMatches.length,
        syncedCount: manifest.syncedCount,
        windowsSyncedRoots: winCopied,
        mirroredEntries: mirroredMatches
      };
    }
  }
];
