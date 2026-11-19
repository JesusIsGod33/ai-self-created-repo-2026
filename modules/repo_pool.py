import asyncio
import json
import os
import subprocess
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


def _emit_log(level: str, msg: str, **fields: Any) -> None:
    payload = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "level": level,
        "module": "repo_pool",
        "msg": msg,
        **fields,
    }
    print(json.dumps(payload), flush=True)


def _resolve_repo_url(spec: Dict[str, Any]) -> str:
    env_key = spec.get("url_env")
    if env_key and os.environ.get(env_key):
        return os.environ[env_key].strip()
    if spec.get("auth_url"):
        return str(spec["auth_url"]).strip()
    return str(spec["url"]).strip()


class GitHubRepoPoolManager:
    def __init__(self, repos_root: str, repo_specs: List[Dict[str, Any]]) -> None:
        self.repos_root = repos_root
        self.repo_specs = repo_specs
        self._locks: Dict[str, asyncio.Lock] = {
            spec["name"]: asyncio.Lock() for spec in repo_specs
        }
        os.makedirs(self.repos_root, exist_ok=True)

    def _run_git_sync(self, args: List[str], cwd: Optional[str] = None, timeout: int = 45) -> subprocess.CompletedProcess:
        cmd = ["git", "-C", cwd, *args] if cwd else ["git", *args]
        env = os.environ.copy()
        env["GIT_TERMINAL_PROMPT"] = "0"
        env.setdefault(
            "GIT_SSH_COMMAND",
            "ssh -p 443 -o HostName=ssh.github.com -i /home/Woken/.ssh/id_ed25519_orchestrator "
            "-o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new "
            "-o UserKnownHostsFile=/home/Woken/.ssh/known_hosts -o ConnectTimeout=15",
        )
        return subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            env=env,
            check=False,
        )

    def _sync_repo_blocking(self, spec: Dict[str, Any]) -> Dict[str, Any]:
        name = spec["name"]
        url = _resolve_repo_url(spec)
        branch = spec.get("branch", "main")
        local_path = os.path.join(self.repos_root, name)

        if not os.path.exists(os.path.join(local_path, ".git")):
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            clone_proc = self._run_git_sync(["clone", "--branch", branch, "--single-branch", url, local_path], timeout=90)
            if clone_proc.returncode != 0:
                _emit_log("WARN", "Git clone failed; initializing fallback local repo", repo=name, stderr=clone_proc.stderr.strip())
                os.makedirs(local_path, exist_ok=True)
                self._run_git_sync(["init", "-b", branch], cwd=local_path)
                self._run_git_sync(["config", "user.name", "Orchestrator Bot"], cwd=local_path)
                self._run_git_sync(["config", "user.email", "orchestrator@localhost.local"], cwd=local_path)
                manifest = os.path.join(local_path, "manifest.json")
                if not os.path.exists(manifest):
                    with open(manifest, "w", encoding="utf-8") as f:
                        json.dump({"repo": name, "branch": branch, "mode": "local_fallback"}, f, indent=2)
                self._run_git_sync(["add", "."], cwd=local_path)
                self._run_git_sync(["commit", "--allow-empty", "-m", f"init: fallback manifest for {name}"], cwd=local_path)

        self._run_git_sync(["config", "user.name", "Orchestrator Bot"], cwd=local_path)
        self._run_git_sync(["config", "user.email", "orchestrator@localhost.local"], cwd=local_path)
        if url:
            self._run_git_sync(["remote", "set-url", "origin", url], cwd=local_path)

        fetch_proc = self._run_git_sync(["fetch", "--all", "--prune"], cwd=local_path, timeout=45)
        remote_exists = self._run_git_sync(["ls-remote", "--exit-code", "origin", branch], cwd=local_path, timeout=20).returncode == 0

        if remote_exists:
            checkout_proc = self._run_git_sync(["checkout", "-B", branch, f"origin/{branch}"], cwd=local_path)
            if checkout_proc.returncode != 0:
                self._run_git_sync(["checkout", "-B", branch], cwd=local_path)
            pull_proc = self._run_git_sync(["pull", "--ff-only", "origin", branch], cwd=local_path, timeout=45)
            if pull_proc.returncode != 0:
                self._run_git_sync(["reset", "--hard", f"origin/{branch}"], cwd=local_path)
        else:
            current_branch = self._run_git_sync(["rev-parse", "--abbrev-ref", "HEAD"], cwd=local_path).stdout.strip()
            if current_branch != branch:
                self._run_git_sync(["checkout", "-B", branch], cwd=local_path)

        head_proc = self._run_git_sync(["rev-parse", "HEAD"], cwd=local_path)
        head_sha = head_proc.stdout.strip() if head_proc.returncode == 0 else "UNCOMMITTED"

        status = {
            "repo": name,
            "local_path": local_path,
            "branch": branch,
            "remote_reachable": remote_exists,
            "fetch_ok": fetch_proc.returncode == 0,
            "head_sha": head_sha,
        }
        _emit_log("INFO", "Synchronized repository in pool", **status)
        return status

    async def sync_repo(self, name: str) -> Dict[str, Any]:
        spec = next((r for r in self.repo_specs if r["name"] == name), None)
        if not spec:
            raise KeyError(f"Repository '{name}' is not configured in pool.")
        lock = self._locks.setdefault(name, asyncio.Lock())
        async with lock:
            return await asyncio.to_thread(self._sync_repo_blocking, spec)

    async def sync_all(self) -> List[Dict[str, Any]]:
        tasks = [self.sync_repo(spec["name"]) for spec in self.repo_specs]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        out: List[Dict[str, Any]] = []
        for spec, res in zip(self.repo_specs, results):
            if isinstance(res, Exception):
                _emit_log("ERROR", "Repository sync exception", repo=spec["name"], error=str(res))
                out.append({"repo": spec["name"], "error": str(res)})
            else:
                out.append(res)
        return out

    def _record_execution_snapshot_blocking(self, repo_name: str, wave_id: int, summary: Dict[str, Any]) -> Dict[str, Any]:
        spec = next((r for r in self.repo_specs if r["name"] == repo_name), None)
        if not spec:
            return {"committed": False, "reason": "unknown_repo"}
        url = _resolve_repo_url(spec)
        branch = spec.get("branch", "main")
        local_path = os.path.join(self.repos_root, repo_name)
        audit_dir = os.path.join(local_path, ".orchestrator_runs")
        os.makedirs(audit_dir, exist_ok=True)

        snapshot_file = os.path.join(audit_dir, f"wave_{wave_id:04d}.json")
        with open(snapshot_file, "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2, sort_keys=True)
            f.write("\n")

        self._run_git_sync(["checkout", "-B", branch], cwd=local_path)
        self._run_git_sync(["add", ".orchestrator_runs"], cwd=local_path)
        commit_proc = self._run_git_sync(
            ["commit", "-m", f"chore(wave-{wave_id}): record verified micro-task batch outcome"],
            cwd=local_path,
        )
        sha = self._run_git_sync(["rev-parse", "HEAD"], cwd=local_path).stdout.strip()
        pushed = False
        push_err = ""
        if url and commit_proc.returncode == 0:
            self._run_git_sync(["remote", "set-url", "origin", url], cwd=local_path)
            push_proc = self._run_git_sync(["push", "-u", "origin", branch], cwd=local_path, timeout=30)
            pushed = push_proc.returncode == 0
            if not pushed:
                push_err = push_proc.stderr.strip()

        res = {
            "repo": repo_name,
            "wave_id": wave_id,
            "committed": commit_proc.returncode == 0,
            "pushed": pushed,
            "commit_sha": sha,
            "push_error": push_err,
        }
        _emit_log("INFO", "Recorded execution snapshot to repo", **res)
        return res

    async def record_execution_snapshot(self, repo_name: str, wave_id: int, summary: Dict[str, Any]) -> Dict[str, Any]:
        lock = self._locks.setdefault(repo_name, asyncio.Lock())
        async with lock:
            return await asyncio.to_thread(self._record_execution_snapshot_blocking, repo_name, wave_id, summary)
