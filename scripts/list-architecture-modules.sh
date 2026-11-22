#!/usr/bin/env bash
set -euo pipefail
cd /home/Woken/career-orchestrator-stack

echo "=== MODULE & TOOL INVENTORY ==="
find . -maxdepth 3 \
  -not -path '*/node_modules*' \
  -not -path '*/.git*' \
  | sort

echo "=== EXPORTED TOOLS & HANDLERS ==="
grep -rnE "export (const|async function|function|default)|customTools|loadCustomTools" server tools scripts 2>/dev/null || true
