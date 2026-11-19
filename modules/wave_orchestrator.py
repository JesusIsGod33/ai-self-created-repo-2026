import asyncio
import json
import os
import random
import signal
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Any, Dict, List

from env_provisioner import VirtualEnvProvisioner
from repo_pool import GitHubRepoPoolManager
from task_scheduler import MicroTaskLedgerAndQueue


def _emit_log(level: str, msg: str, **fields: Any) -> None:
    payload = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "level": level,
        "module": "wave_orchestrator",
        "msg": msg,
        **fields,
    }
    print(json.dumps(payload), flush=True)


class PhaseLockedWaveOrchestrator:
    def __init__(self, config_path: str) -> None:
        with open(config_path, "r", encoding="utf-8") as f:
            self.cfg = json.load(f)

        paths = self.cfg["paths"]
        conc = self.cfg.get("concurrency", {})

        self.max_workers = int(conc.get("max_workers", 6))
        self.semaphore_limit = int(conc.get("semaphore_limit", 4))
        self.wave_size = int(conc.get("wave_size", 12))
        self.wave_timeout = float(conc.get("wave_timeout_seconds", 30.0))
        bounds = conc.get("jitter_bounds", [0.05, 0.35])
        self.jitter_min = float(bounds[0])
        self.jitter_max = float(bounds[1])

        self.env_provisioner = VirtualEnvProvisioner(paths["venvs_dir"])
        self.repo_pool = GitHubRepoPoolManager(paths["repos_dir"], self.cfg.get("repositories", []))
        self.scheduler = MicroTaskLedgerAndQueue(paths["queue_db"], paths["ledger_file"])

        self._semaphore = asyncio.Semaphore(self.semaphore_limit)
        self._executor = ThreadPoolExecutor(max_workers=self.max_workers, thread_name_prefix="wave-worker")
        self._stop_event = asyncio.Event()
        self._wave_counter = 0
        self._repo_venv_map: Dict[str, str] = {}

    async def _sleep_jitter(self, tag: str) -> float:
        delay = round(random.uniform(min(self.jitter_min, self.jitter_max), max(self.jitter_min, self.jitter_max)), 4)
        _emit_log("DEBUG", "Applying randomized temporal jitter", tag=tag, jitter_sec=delay)
        try:
            await asyncio.wait_for(self._stop_event.wait(), timeout=delay)
        except asyncio.TimeoutError:
            pass
        return delay

    async def _prepare_environments(self) -> None:
        for spec in self.cfg.get("repositories", []):
            repo_name = spec["name"]
            reqs = spec.get("requirements", [])
            prov_info = await asyncio.to_thread(self.env_provisioner.provision_sync, repo_name, reqs)
            self._repo_venv_map[repo_name] = prov_info["python_executable"]
            _emit_log(
                "INFO",
                "Virtual environment ready for repository",
                repo_name=repo_name,
                spec_id=prov_info["spec_id"],
                python_executable=prov_info["python_executable"],
            )

    async def _run_single_micro_task(
        self,
        task_row: Dict[str, Any],
        wave_id: int,
        phase_barrier: asyncio.Barrier,
    ) -> Dict[str, Any]:
        task_id = task_row["task_id"]
        repo_name = task_row["repo_name"]
        operation = task_row["operation"]
        payload = json.loads(task_row["payload_json"])
        venv_python = self._repo_venv_map.get(repo_name) or os.path.join(self.cfg["paths"]["venvs_dir"], "default", "bin", "python")

        try:
            async with self._semaphore:
                await self._sleep_jitter("pre_dispatch")
                await asyncio.to_thread(self.scheduler.transition_state, task_id, "DISPATCHED", wave_id=wave_id)

                worker_script = (
                    "import hashlib, json\n"
                    "digest = hashlib.sha256(json.dumps(DATA, sort_keys=True).encode('utf-8')).hexdigest()\n"
                    "print(json.dumps({'status': 'ok', 'operation': DATA.get('op', 'compute'), 'digest': digest}))\n"
                )
                loop = asyncio.get_running_loop()
                exec_out = await loop.run_in_executor(
                    self._executor,
                    self.env_provisioner.run_isolated_micro_task,
                    venv_python,
                    worker_script,
                    {"op": operation, "task_id": task_id, "payload": payload},
                    15.0,
                )

            await asyncio.to_thread(self.scheduler.transition_state, task_id, "PHASE_LOCKED", wave_id=wave_id)
            await asyncio.wait_for(phase_barrier.wait(), timeout=self.wave_timeout)
            await self._sleep_jitter("post_barrier")

            await asyncio.to_thread(
                self.scheduler.transition_state,
                task_id,
                "COMPLETED",
                wave_id=wave_id,
                result=exec_out,
            )
            return {"task_id": task_id, "status": "COMPLETED"}

        except Exception as exc:
            err_str = str(exc)
            try:
                await asyncio.to_thread(
                    self.scheduler.transition_state,
                    task_id,
                    "FAILED",
                    wave_id=wave_id,
                    error_text=err_str,
                )
            except Exception as ledger_exc:
                _emit_log("ERROR", "Failed to record FAILED state in ledger", task_id=task_id, error=str(ledger_exc))
            _emit_log("ERROR", "Isolated micro-task crashed without breaking wave", task_id=task_id, error=err_str)
            return {"task_id": task_id, "status": "FAILED", "error": err_str}

    async def execute_wave(self, batch: List[Dict[str, Any]]) -> Dict[str, Any]:
        self._wave_counter += 1
        wave_id = self._wave_counter
        count = len(batch)
        _emit_log("INFO", "Starting phase-locked execution wave", wave_id=wave_id, task_count=count)

        barrier = asyncio.Barrier(count)
        coros = [self._run_single_micro_task(row, wave_id, barrier) for row in batch]
        gathered = await asyncio.gather(*coros, return_exceptions=True)

        completed = 0
        failed = 0
        for item in gathered:
            if isinstance(item, dict) and item.get("status") == "COMPLETED":
                completed += 1
            else:
                failed += 1

        wave_summary = {
            "wave_id": wave_id,
            "total": count,
            "completed": completed,
            "failed": failed,
            "finished_at": datetime.now(timezone.utc).isoformat(),
        }
        _emit_log("INFO", "Completed phase-locked wave", **wave_summary)

        if self.cfg.get("repositories"):
            primary_repo = self.cfg["repositories"][0]["name"]
            await self.repo_pool.record_execution_snapshot(primary_repo, wave_id, wave_summary)

        return wave_summary

    async def seed_demo_wave_if_empty(self) -> None:
        existing = await asyncio.to_thread(self.scheduler.fetch_batch, 1)
        if existing or not self.cfg.get("repositories"):
            return
        primary_repo = self.cfg["repositories"][0]["name"]
        for i in range(self.wave_size):
            await asyncio.to_thread(
                self.scheduler.enqueue_task,
                primary_repo,
                "wave_micro_op",
                {"seq": i, "engine": self.cfg.get("engine_id", "phase-locked-engine-01")},
            )

    async def run_forever(self) -> None:
        _emit_log("INFO", "Phase-Locked Agentic Orchestration Engine starting", engine_id=self.cfg.get("engine_id"))
        await self.repo_pool.sync_all()
        await self._prepare_environments()
        await self.seed_demo_wave_if_empty()

        while not self._stop_event.is_set():
            batch = await asyncio.to_thread(self.scheduler.fetch_batch, self.wave_size)
            if batch:
                await self.execute_wave(batch)
            else:
                await self._sleep_jitter("idle_poll")

        self._executor.shutdown(wait=True, cancel_futures=False)
        _emit_log("INFO", "Phase-Locked Agentic Orchestration Engine stopped cleanly")


def main() -> int:
    cfg_path = sys.argv[1] if len(sys.argv) > 1 else "/opt/phase-locked-orchestrator/config/orchestrator.json"
    orchestrator = PhaseLockedWaveOrchestrator(cfg_path)

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    def _on_sig(signum: int) -> None:
        _emit_log("INFO", "Shutdown signal received", signal=signum)
        orchestrator._stop_event.set()

    for sig in (signal.SIGTERM, signal.SIGINT):
        try:
            loop.add_signal_handler(sig, _on_sig, sig.value)
        except NotImplementedError:
            signal.signal(sig, lambda s, _f: _on_sig(s))

    try:
        loop.run_until_complete(orchestrator.run_forever())
    finally:
        loop.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
