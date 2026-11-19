import hashlib
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


def _emit_log(level: str, msg: str, **fields: Any) -> None:
    payload = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "level": level,
        "module": "env_provisioner",
        "msg": msg,
        **fields,
    }
    print(json.dumps(payload), flush=True)


class VirtualEnvProvisioner:
    def __init__(self, venvs_root: str) -> None:
        self.venvs_root = venvs_root
        os.makedirs(self.venvs_root, exist_ok=True)

    @staticmethod
    def compute_spec_hash(repo_key: str, requirements: List[str]) -> str:
        canonical = json.dumps(
            {"repo_key": repo_key, "requirements": sorted(set(r.strip() for r in requirements if r.strip()))},
            sort_keys=True,
        )
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()[:16]

    def get_venv_paths(self, spec_id: str) -> Dict[str, str]:
        venv_dir = os.path.join(self.venvs_root, f"venv_{spec_id}")
        python_bin = os.path.join(venv_dir, "bin", "python")
        pip_bin = os.path.join(venv_dir, "bin", "pip")
        return {"venv_dir": venv_dir, "python": python_bin, "pip": pip_bin}

    def provision_sync(self, repo_key: str, requirements: Optional[List[str]] = None) -> Dict[str, Any]:
        reqs = sorted(set(r.strip() for r in (requirements or []) if r and r.strip()))
        spec_id = self.compute_spec_hash(repo_key, reqs)
        paths = self.get_venv_paths(spec_id)
        venv_dir = paths["venv_dir"]
        python_bin = paths["python"]

        if not os.path.exists(python_bin):
            _emit_log("INFO", "Creating isolated virtual environment", repo_key=repo_key, spec_id=spec_id, venv_dir=venv_dir)
            proc = subprocess.run(
                [sys.executable, "-m", "venv", "--without-pip", venv_dir],
                capture_output=True,
                text=True,
                timeout=120,
                check=False,
            )
            if proc.returncode != 0:
                raise RuntimeError(f"Failed to create venv {venv_dir}: {proc.stderr.strip()}")

        if reqs:
            pip_proc = subprocess.run(
                [python_bin, "-m", "pip", "install", "--disable-pip-version-check", "--no-input", *reqs],
                capture_output=True,
                text=True,
                timeout=300,
                check=False,
            )
            if pip_proc.returncode != 0:
                raise RuntimeError(f"Dependency installation failed for {spec_id}: {pip_proc.stderr.strip()}")

        return {
            "spec_id": spec_id,
            "repo_key": repo_key,
            "venv_dir": venv_dir,
            "python_executable": python_bin,
            "installed_packages": reqs,
        }

    def run_isolated_micro_task(
        self,
        venv_python: str,
        script_code: str,
        task_input: Dict[str, Any],
        timeout_seconds: float = 15.0,
    ) -> Dict[str, Any]:
        clean_env = {
            "PATH": f"{os.path.dirname(venv_python)}:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
            "VIRTUAL_ENV": os.path.dirname(os.path.dirname(venv_python)),
            "PYTHONNOUSERSITE": "1",
            "PYTHONDONTWRITEBYTECODE": "1",
            "LC_ALL": "C.UTF-8",
            "LANG": "C.UTF-8",
        }
        encoded_input = json.dumps(task_input, sort_keys=True)
        wrapper = (
            "import json, sys\n"
            f"DATA = json.loads({json.dumps(encoded_input)})\n"
            + script_code
        )
        proc = subprocess.run(
            [venv_python, "-I", "-B", "-c", wrapper],
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            env=clean_env,
            check=False,
        )
        if proc.returncode != 0:
            raise RuntimeError(f"Isolated worker exited {proc.returncode}: {proc.stderr.strip()}")

        stdout_lines = [line.strip() for line in proc.stdout.splitlines() if line.strip()]
        parsed_output: Any = stdout_lines[-1] if stdout_lines else {}
        if stdout_lines:
            try:
                parsed_output = json.loads(stdout_lines[-1])
            except json.JSONDecodeError:
                parsed_output = {"raw_output": stdout_lines[-1]}

        return {
            "exit_code": proc.returncode,
            "output": parsed_output,
            "stderr_tail": proc.stderr.strip()[-500:] if proc.stderr else "",
        }
