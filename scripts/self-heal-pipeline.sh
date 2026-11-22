#!/usr/bin/env bash
set -euo pipefail
cd /home/Woken/career-orchestrator-stack
[ -f .env ] && set -a && source .env && set +a

PORT="${YAZ_CHAT_PORT:-4090}"
LOG_FILE="/home/Woken/career-orchestrator-stack/data/yaz-chat/matrix-${PORT}.log"
mkdir -p /home/Woken/career-orchestrator-stack/data/yaz-chat data/repairs data/investigations
: > "${LOG_FILE}"

echo "[STAGE 1] Isolating stale listeners on port ${PORT}..."
PIDS="$(ss -tulpn 2>/dev/null | grep -E ":${PORT}\b" | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' | sort -u || true)"
if [ -n "${PIDS}" ]; then
  kill -9 ${PIDS} >/dev/null 2>&1 || true
  sleep 0.25
fi
echo "ISOLATED_PIDS=${PIDS:-none}"

echo "[STAGE 2] Validating syntax on yaz_matrix_chat.js and sol-assistant.sh..."
node --check tools/yaz_matrix_chat.js
bash -n scripts/sol-assistant.sh
echo "SYNTAX_CHECK=OK"

echo "[STAGE 3] Starting chat service on 127.0.0.1:${PORT}..."
setsid node --input-type=module -e '
import { loadCustomTools } from "./server/tool-loader.js";
const tools = await loadCustomTools("./tools");
const chatTool = tools.find((t) => t.name === "yaz_matrix_chat");
if (!chatTool) {
  console.error("ERR_TOOL_NOT_FOUND=yaz_matrix_chat");
  process.exit(1);
}
const res = await chatTool.run({ port: Number(process.env.YAZ_CHAT_PORT || 4090), keepAliveMs: 86400000 });
console.log("YAZ_CHAT_STARTED=" + JSON.stringify(res));
' >> "${LOG_FILE}" 2>&1 < /dev/null &
CHILD_PID=$!

echo "[STAGE 4] Probing loopback endpoint http://127.0.0.1:${PORT}/api/history..."
READY=0
for ATTEMPT in $(seq 1 30); do
  if ! kill -0 "${CHILD_PID}" 2>/dev/null; then
    echo "CHILD_EXITED_AT_ATTEMPT=${ATTEMPT}"
    break
  fi
  if curl -sS --max-time 2 --no-keepalive "http://127.0.0.1:${PORT}/api/history" >> "${LOG_FILE}" 2>&1; then
    READY=1
    break
  fi
  sleep 0.25
done

echo "--- LOG OUTPUT (${LOG_FILE}) ---"
cat "${LOG_FILE}" 2>/dev/null || true
echo "--- LISTENER CHECK (:${PORT}) ---"
ss -tulpn 2>/dev/null | grep -E ":${PORT}\b" || true

if [ "${READY}" -eq 1 ]; then
  echo "SELF_HEAL_OK=http://127.0.0.1:${PORT}"
else
  echo "SELF_HEAL_FAIL=http://127.0.0.1:${PORT}"
  exit 1
fi
