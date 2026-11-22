#!/usr/bin/env bash
set -euo pipefail
cd /home/Woken/career-orchestrator-stack

PORT="${YAZ_CHAT_PORT:-4090}"
LOG_FILE="data/yaz-chat/matrix-${PORT}.log"
mkdir -p data/yaz-chat

echo "=== YAZ ERROR SCANNER (PORT ${PORT}) ==="

echo "[1/5] Listening sockets on :${PORT} and :4080"
ss -tulpn 2>/dev/null | grep -E ":4090\b|:4080\b" || netstat -tulpn 2>/dev/null | grep -E ":4090\b|:4080\b" || echo "No ss/netstat match for 4090/4080"

echo "[2/5] Matching processes (yaz_matrix_chat / sol-assistant)"
ps -ef | grep -E "yaz_matrix_chat|sol-assistant|matrix-${PORT}" | grep -v grep || echo "No matching background processes"

echo "[3/5] Loopback HTTP probe on http://127.0.0.1:${PORT}/api/history"
if curl -sS --max-time 2 --no-keepalive -i "http://127.0.0.1:${PORT}/api/history" 2>&1; then
  echo ""
else
  echo "HTTP probe failed on 127.0.0.1:${PORT}"
fi

echo "[4/5] Recent error lines in ${LOG_FILE} and data/sol-4080.log"
if [ -f "${LOG_FILE}" ]; then
  grep -n -E -i "error|err_|eaddrinuse|exception|fail|unhandled|syntax|refused|timeout" "${LOG_FILE}" || tail -n 25 "${LOG_FILE}"
else
  echo "Log file missing: ${LOG_FILE}"
fi
if [ -f "data/sol-4080.log" ]; then
  grep -n -E -i "error|err_|eaddrinuse|exception|fail|unhandled|syntax|refused|timeout" "data/sol-4080.log" || true
fi

echo "[5/5] JavaScript & Shell syntax check across scripts/ and tools/"
for f in scripts/*.sh; do
  [ -e "$f" ] && bash -n "$f" && echo "OK: $f" || echo "ERR: $f"
done
for f in tools/*.js server/*.js; do
  [ -e "$f" ] && node --check "$f" && echo "OK: $f" || echo "ERR: $f"
done
