#!/usr/bin/env bash
set -euo pipefail
cd /home/Woken/career-orchestrator-stack
[ -f .env ] && set -a && source .env && set +a
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-4080}"
export HOST PORT
node tests/verify-all.js
exec node server/index.js
