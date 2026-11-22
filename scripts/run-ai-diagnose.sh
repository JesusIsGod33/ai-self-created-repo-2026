#!/usr/bin/env bash
set -euo pipefail
cd /home/Woken/career-orchestrator-stack
[ -f .env ] && set -a && source .env && set +a
./scripts/ensure-ollama.sh
node --input-type=module -e '
import { runAiDiagnosis } from "./server/ai-diagnoser.js";
const res = await runAiDiagnosis({
  host: process.env.HOST || "0.0.0.0",
  port: Number(process.env.PORT || 4080),
  cwd: process.cwd(),
  status: "manual-diagnostic"
});
console.log(res.diagnosis);
'
