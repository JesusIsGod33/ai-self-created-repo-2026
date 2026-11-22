#!/usr/bin/env bash
set -euo pipefail
cd /home/Woken/career-orchestrator-stack
[ -f .env ] && set -a && source .env && set +a

TARGET_URL="${1:-}"
LOCAL_PATH="${2:-/home/Woken/career-orchestrator-stack/server/index.js}"
FOCUS="${3:-Inspect observable layout, routes, scripts, evidence, and uncertainties}"

node --input-type=module -e '
import { investigateTarget } from "./server/target-investigator.js";
import { runAiDiagnosis } from "./server/ai-diagnoser.js";

const targetUrl = process.env.INV_URL || "";
const localPath = process.env.INV_LOCAL_PATH || "";
const focus = process.env.INV_FOCUS || "";

const report = await investigateTarget({ targetUrl, localPath, focus });
const ai = await runAiDiagnosis({ stage: "cli-investigate", investigation: report });
console.log(JSON.stringify({
  evidence: report.evidence,
  uncertainties: report.uncertainties,
  aiModel: ai.model,
  aiSummary: ai.diagnosis
}, null, 2));
' INV_URL="$TARGET_URL" INV_LOCAL_PATH="$LOCAL_PATH" INV_FOCUS="$FOCUS"
