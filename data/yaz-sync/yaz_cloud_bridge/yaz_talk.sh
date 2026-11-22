#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -z "${GEMINI_API_KEY:-}" ]; then
  echo "Missing GEMINI_API_KEY. Export it first: export GEMINI_API_KEY='your_key'" >&2
  exit 1
fi

if [ "$#" -eq 0 ]; then
  python3 "$SCRIPT_DIR/bridge_client.py"
elif [ "$1" = "--task" ]; then
  shift
  python3 "$SCRIPT_DIR/bridge_client.py" --task "$*"
else
  python3 "$SCRIPT_DIR/bridge_client.py" --message "$*"
fi
