#!/usr/bin/env bash
set -euo pipefail
cd /home/Woken/career-orchestrator-stack
mkdir -p data/yaz-sync

DRY_RUN="${1:-false}"
MOUNT_ROOT="${2:-/mnt/d}"

if [ ! -d "$MOUNT_ROOT" ]; then
  mkdir -p "$MOUNT_ROOT" 2>/dev/null || true
  mount -t drvfs D: "$MOUNT_ROOT" 2>/dev/null || true
fi

if [ "$DRY_RUN" != "true" ]; then
  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command '
    $destRoot = "\\\\wsl.localhost\\kali-linux\\home\\Woken\\career-orchestrator-stack\\data\\yaz-sync"
    if (-not (Test-Path -LiteralPath $destRoot)) {
      New-Item -ItemType Directory -Path $destRoot -Force | Out-Null
    }
    if (Test-Path -LiteralPath "D:\\") {
      Get-ChildItem -LiteralPath "D:\\" -Force -ErrorAction SilentlyContinue | Where-Object { $_.Name -match "yaz" } | ForEach-Object {
        $target = Join-Path $destRoot $_.Name
        if ($_.PSIsContainer) {
          Copy-Item -LiteralPath $_.FullName -Destination $target -Recurse -Force -ErrorAction SilentlyContinue
        } else {
          Copy-Item -LiteralPath $_.FullName -Destination $target -Force -ErrorAction SilentlyContinue
        }
      }
    }
  ' >/dev/null 2>&1 || true
fi

node --input-type=module -e '
import { loadCustomTools } from "./server/tool-loader.js";
const tools = await loadCustomTools("./tools");
const syncTool = tools.find((t) => t.name === "yaz_drive_sync");
if (!syncTool) {
  console.error("yaz_drive_sync tool not found");
  process.exit(1);
}
const res = await syncTool.run({
  mountRoot: process.env.YAZ_MOUNT_ROOT || "/mnt/d",
  dryRun: process.env.YAZ_DRY_RUN === "true"
});
console.log(JSON.stringify(res, null, 2));
'
