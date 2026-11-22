#!/usr/bin/env bash
set -euo pipefail
cd /home/Woken/career-orchestrator-stack
[ -f .env ] && set -a && source .env && set +a
./scripts/ensure-ollama.sh
node --input-type=module -e '
import { runAutonomousLocalRepair } from "./server/auto-repair.js";
const issue = {
  error: process.env.REPAIR_ERROR || "Timeout on GET /healthz or stale local environment",
  host: process.env.HOST || "0.0.0.0",
  port: Number(process.env.PORT || 4080),
  cwd: process.cwd(),
  nodeVersion: process.version,
  triggerVerify: process.env.TRIGGER_VERIFY !== "0"
};
const res = await runAutonomousLocalRepair(issue, { model: process.env.OLLAMA_MODEL || "" });
console.log(JSON.stringify(res, null, 2));
'
