#!/usr/bin/env bash
set -euo pipefail

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="/opt/phase-locked-orchestrator"

echo "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"level\":\"INFO\",\"module\":\"deploy\",\"msg\":\"Deploying Phase-Locked Agentic Orchestration Engine to ${TARGET_DIR}\"}"

sudo mkdir -p "${TARGET_DIR}"/{config,modules,repos,venvs,state}
sudo cp -f "${SRC_DIR}/config/orchestrator.json" "${TARGET_DIR}/config/orchestrator.json"
sudo cp -f "${SRC_DIR}/modules/"*.py "${TARGET_DIR}/modules/"
sudo chmod 0755 "${TARGET_DIR}/modules/"*.py

if [ ! -f "${TARGET_DIR}/state/lifecycle_ledger.json" ]; then
  echo "[]" | sudo tee "${TARGET_DIR}/state/lifecycle_ledger.json" >/dev/null
fi

sudo python3 - << 'PYEOF'
import asyncio
import json
import sys

sys.path.insert(0, "/opt/phase-locked-orchestrator/modules")
from env_provisioner import VirtualEnvProvisioner
from repo_pool import GitHubRepoPoolManager
from task_scheduler import MicroTaskLedgerAndQueue

with open("/opt/phase-locked-orchestrator/config/orchestrator.json", "r", encoding="utf-8") as f:
    cfg = json.load(f)

prov = VirtualEnvProvisioner(cfg["paths"]["venvs_dir"])
venv_info = prov.provision_sync("infuselink-worker", [])
out = prov.run_isolated_micro_task(
    venv_info["python_executable"],
    "import json; print(json.dumps({'isolated_check': True, 'val': DATA['x'] * 2}))",
    {"x": 21},
)
assert out["output"]["isolated_check"] is True and out["output"]["val"] == 42

sched = MicroTaskLedgerAndQueue(cfg["paths"]["queue_db"], cfg["paths"]["ledger_file"])
tid = sched.enqueue_task("infuselink-worker", "smoke_test", {"probe": 1})
sched.transition_state(tid, "DISPATCHED", wave_id=1)
sched.transition_state(tid, "PHASE_LOCKED", wave_id=1)
sched.transition_state(tid, "COMPLETED", wave_id=1, result={"ok": True})
chain_status = sched.verify_chain()
assert chain_status["valid"] is True, f"Chain invalid: {chain_status}"

async def _repo_smoke():
    pool = GitHubRepoPoolManager(cfg["paths"]["repos_dir"], cfg["repositories"])
    res = await pool.sync_all()
    print(json.dumps({"venv": venv_info, "isolated_out": out, "ledger": chain_status, "repos": res}, indent=2))

asyncio.run(_repo_smoke())
PYEOF

echo "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"level\":\"INFO\",\"module\":\"deploy\",\"msg\":\"Verification complete\"}"
