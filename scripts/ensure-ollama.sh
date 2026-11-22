#!/usr/bin/env bash
set -euo pipefail

OLLAMA_URL="${OLLAMA_HOST:-http://127.0.0.1:11434}"
OLLAMA_URL="${OLLAMA_URL%/}"
LOG_FILE="${OLLAMA_LOG_FILE:-/tmp/ollama-serve.log}"

if curl -sf --max-time 2 "${OLLAMA_URL}/api/tags" >/dev/null 2>&1; then
  exit 0
fi

if ! command -v ollama >/dev/null 2>&1; then
  echo "[OLLAMA] Binary not found in PATH" >&2
  exit 1
fi

nohup ollama serve >"$LOG_FILE" 2>&1 &

for _ in $(seq 1 30); do
  if curl -sf --max-time 2 "${OLLAMA_URL}/api/tags" >/dev/null 2>&1; then
    exit 0
  fi
  sleep 0.5
done

echo "[OLLAMA] Failed to start within 15s; check $LOG_FILE" >&2
exit 1
