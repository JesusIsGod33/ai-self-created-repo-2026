#!/usr/bin/env bash
set -euo pipefail
cd /home/Woken/career-orchestrator-stack
[ -f .env ] && set -a && source .env && set +a

CMD="${1:-help}"
ARG1="${2:-}"
ARG2="${3:-}"

kill_port_holders() {
  local target_port="$1"
  local pids=""
  if command -v fuser >/dev/null 2>&1; then
    pids="$(fuser "${target_port}/tcp" 2>/dev/null || true)"
  fi
  if [ -z "${pids}" ] && command -v ss >/dev/null 2>&1; then
    pids="$(ss -tulpn 2>/dev/null | grep -E ":${target_port}\b" | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' | sort -u || true)"
  fi
  if [ -z "${pids}" ]; then
    pids="$(pgrep -f "yaz_matrix_chat|port: ${target_port}|port=${target_port}" || true)"
  fi
  if [ -n "${pids}" ]; then
    kill -9 ${pids} >/dev/null 2>&1 || true
    sleep 0.25
  fi
}

case "$CMD" in
  heal)
    if [ -x ./scripts/ensure-ollama.sh ]; then
      timeout 4 ./scripts/ensure-ollama.sh >/dev/null 2>&1 || true
    fi
    REPAIR_ERROR="${ARG1:-Brahma Sol self-heal requested}" ./scripts/run-auto-repair.sh
    ;;
  diagnose)
    ./scripts/run-ai-diagnose.sh
    ;;
  investigate)
    ./scripts/run-investigate.sh "${ARG1:-}" "${ARG2:-/home/Woken/career-orchestrator-stack/server/index.js}" "Sol workspace investigation"
    ;;
  tools)
    node --input-type=module -e '
    import { loadCustomTools } from "./server/tool-loader.js";
    const tools = await loadCustomTools("./tools");
    console.log(JSON.stringify(tools.map((t) => ({ name: t.name, description: t.description })), null, 2));
    '
    ;;
  note)
    node --input-type=module -e '
    import { loadCustomTools } from "./server/tool-loader.js";
    const tools = await loadCustomTools("./tools");
    const noteTool = tools.find((t) => t.name === "sol_workspace_note");
    const res = await noteTool.run({ title: process.env.SOL_NOTE_TITLE || "Sol Note", body: process.env.SOL_NOTE_BODY || "" });
    console.log(JSON.stringify(res, null, 2));
    '
    ;;
  sync-yaz)
    YAZ_DRY_RUN="${ARG1:-false}" YAZ_MOUNT_ROOT="${ARG2:-/mnt/d}" ./scripts/sync-yaz-drive.sh "${ARG1:-false}" "${ARG2:-/mnt/d}"
    ;;
  yaz-catalog)
    node --input-type=module -e '
    import { loadCustomTools } from "./server/tool-loader.js";
    const tools = await loadCustomTools("./tools");
    const catTool = tools.find((t) => t.name === "yaz_mirror_catalog");
    const res = await catTool.run({ pattern: process.env.YAZ_PATTERN || "", limit: Number(process.env.YAZ_LIMIT || 200) });
    console.log(JSON.stringify(res, null, 2));
    '
    ;;
  yaz-inspect)
    node --input-type=module -e '
    import { loadCustomTools } from "./server/tool-loader.js";
    const tools = await loadCustomTools("./tools");
    const inspTool = tools.find((t) => t.name === "yaz_module_inspector");
    const res = await inspTool.run({ pattern: process.env.YAZ_PATTERN || "", limit: Number(process.env.YAZ_LIMIT || 50) });
    console.log(JSON.stringify(res, null, 2));
    '
    ;;
  yaz-audit)
    node --input-type=module -e '
    import { loadCustomTools } from "./server/tool-loader.js";
    const tools = await loadCustomTools("./tools");
    const runTool = tools.find((t) => t.name === "yaz_symbol_runner");
    const res = await runTool.run({
      pattern: process.env.YAZ_PATTERN || "",
      checkSyntax: process.env.YAZ_CHECK_SYNTAX !== "false",
      limit: Number(process.env.YAZ_LIMIT || 50),
      maxFiles: Number(process.env.YAZ_MAX_FILES || 400)
    });
    console.log(JSON.stringify(res, null, 2));
    '
    ;;
  yaz-summary)
    node --input-type=module -e '
    import { loadCustomTools } from "./server/tool-loader.js";
    const tools = await loadCustomTools("./tools");
    const sumTool = tools.find((t) => t.name === "yaz_symbol_summary");
    const res = await sumTool.run({ pattern: process.env.YAZ_PATTERN || "" });
    console.log(JSON.stringify(res, null, 2));
    '
    ;;
  yaz-details)
    node --input-type=module -e '
    import { loadCustomTools } from "./server/tool-loader.js";
    const tools = await loadCustomTools("./tools");
    const detTool = tools.find((t) => t.name === "yaz_symbol_details");
    const res = await detTool.run({
      pattern: process.env.YAZ_PATTERN || "",
      kind: process.env.YAZ_KIND || "",
      limit: Number(process.env.YAZ_LIMIT || 20)
    });
    console.log(JSON.stringify(res, null, 2));
    '
    ;;
  yaz-search)
    node --input-type=module -e '
    import { loadCustomTools } from "./server/tool-loader.js";
    const tools = await loadCustomTools("./tools");
    const srchTool = tools.find((t) => t.name === "yaz_symbol_search");
    const res = await srchTool.run({
      pattern: process.env.YAZ_PATTERN || "",
      kind: process.env.YAZ_KIND || "",
      limit: Number(process.env.YAZ_LIMIT || 100)
    });
    console.log(JSON.stringify(res, null, 2));
    '
    ;;
  yaz-snippets)
    node --input-type=module -e '
    import { loadCustomTools } from "./server/tool-loader.js";
    const tools = await loadCustomTools("./tools");
    const snipTool = tools.find((t) => t.name === "yaz_symbol_snippets");
    const res = await snipTool.run({
      pattern: process.env.YAZ_PATTERN || "",
      kind: process.env.YAZ_KIND || "",
      contextLines: Number(process.env.YAZ_CONTEXT_LINES || 4),
      limit: Number(process.env.YAZ_LIMIT || 25)
    });
    console.log(JSON.stringify(res, null, 2));
    '
    ;;
  yaz-pipeline)
    node --input-type=module -e '
    import { loadCustomTools } from "./server/tool-loader.js";
    const tools = await loadCustomTools("./tools");
    const pipeTool = tools.find((t) => t.name === "yaz_symbol_pipeline");
    const res = await pipeTool.run({
      pattern: process.env.YAZ_PATTERN || "",
      kind: process.env.YAZ_KIND || "",
      contextLines: Number(process.env.YAZ_CONTEXT_LINES || 4),
      limit: Number(process.env.YAZ_LIMIT || 25),
      maxFiles: Number(process.env.YAZ_MAX_FILES || 400)
    });
    console.log(JSON.stringify(res, null, 2));
    '
    ;;
  yaz-report)
    node --input-type=module -e '
    import { loadCustomTools } from "./server/tool-loader.js";
    const tools = await loadCustomTools("./tools");
    const repTool = tools.find((t) => t.name === "yaz_pipeline_report");
    const res = await repTool.run({ limit: Number(process.env.YAZ_LIMIT || 25) });
    console.log(JSON.stringify(res, null, 2));
    '
    ;;
  yaz-report-note)
    node --input-type=module -e '
    import { loadCustomTools } from "./server/tool-loader.js";
    const tools = await loadCustomTools("./tools");
    const repNoteTool = tools.find((t) => t.name === "yaz_report_note");
    const res = await repNoteTool.run({
      title: process.env.SOL_NOTE_TITLE || "Yaz Symbol Pipeline Report",
      maxLines: Number(process.env.YAZ_NOTE_MAX_LINES || 40)
    });
    console.log(JSON.stringify(res, null, 2));
    '
    ;;
  yaz-chat)
    PORT="${YAZ_CHAT_PORT:-4090}"
    LOG_FILE="data/yaz-chat/matrix-${PORT}.log"
    mkdir -p data/yaz-chat
    if ! curl -sf --max-time 1 --no-keepalive "http://127.0.0.1:${PORT}/api/history" >/dev/null 2>&1; then
      kill_port_holders "${PORT}"
      nohup node --input-type=module -e "
      import { loadCustomTools } from './server/tool-loader.js';
      const tools = await loadCustomTools('./tools');
      const chatTool = tools.find((t) => t.name === 'yaz_matrix_chat');
      await chatTool.run({ port: ${PORT}, keepAliveMs: 86400000 });
      " > "${LOG_FILE}" 2>&1 < /dev/null &
      for _ in $(seq 1 20); do
        if curl -sf --max-time 1 --no-keepalive "http://127.0.0.1:${PORT}/api/history" >/dev/null 2>&1; then
          break
        fi
        sleep 0.25
      done
    fi
    if curl -sf --max-time 2 --no-keepalive "http://127.0.0.1:${PORT}/api/history" >/dev/null 2>&1; then
      echo "Yaz Matrix Chat ONLINE at http://127.0.0.1:${PORT}"
    else
      echo "Yaz Matrix Chat NOT responding on 127.0.0.1:${PORT}. Log tail:"
      tail -n 25 "${LOG_FILE}" 2>/dev/null || true
      exit 1
    fi
    ;;
  start)
    if ! curl -sf --max-time 2 --no-keepalive http://127.0.0.1:4080/healthz >/dev/null 2>&1; then
      if [ -f ./scripts/run-verify-and-start.sh ]; then
        nohup ./scripts/run-verify-and-start.sh > data/sol-4080.log 2>&1 < /dev/null &
      else
        nohup node server/index.js > data/sol-4080.log 2>&1 < /dev/null &
      fi
      for _ in $(seq 1 20); do
        if curl -sf --max-time 2 --no-keepalive http://127.0.0.1:4080/healthz >/dev/null 2>&1; then
          break
        fi
        sleep 0.25
      done
    fi
    curl -s --max-time 3 --no-keepalive http://127.0.0.1:4080/healthz || tail -n 25 data/sol-4080.log 2>/dev/null || echo "Starting on 127.0.0.1:4080"
    ;;
  *)
    echo "Usage: ./scripts/sol-assistant.sh {heal|diagnose|investigate|tools|note|sync-yaz|yaz-catalog|yaz-inspect|yaz-audit|yaz-summary|yaz-details|yaz-search|yaz-snippets|yaz-pipeline|yaz-report|yaz-report-note|yaz-chat|start}"
    ;;
esac
