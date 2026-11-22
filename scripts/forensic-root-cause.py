#!/usr/bin/env python3
import glob
import hashlib
import json
import os
import re
import socket
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path("/home/Woken/career-orchestrator-stack")
PORT = int(os.environ.get("YAZ_CHAT_PORT", "4090"))
OUT_JSON = ROOT / "data" / "investigations" / f"forensic-4090-{int(time.time())}.json"


def run_cmd(cmd: list[str], timeout: int = 4) -> dict:
    try:
        proc = subprocess.run(
            cmd,
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return {
            "cmd": cmd,
            "rc": proc.returncode,
            "stdout": proc.stdout[-4000:],
            "stderr": proc.stderr[-4000:],
        }
    except subprocess.TimeoutExpired as exc:
        return {"cmd": cmd, "rc": -1, "timeout": timeout, "error": str(exc)}
    except Exception as exc:
        return {"cmd": cmd, "rc": -2, "error": str(exc)}


def tcp_connect_probe(host: str, port: int, timeout: float = 1.2) -> dict:
    start = time.perf_counter()
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    try:
        sock.connect((host, port))
        peer = sock.getpeername()
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        return {"reachable": True, "peer": peer, "connect_ms": elapsed_ms}
    except Exception as exc:
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        return {"reachable": False, "error": repr(exc), "connect_ms": elapsed_ms}
    finally:
        sock.close()


def raw_http_probe(host: str, port: int, path_str: str, timeout: float = 1.5) -> dict:
    url = f"http://{host}:{port}{path_str}"
    start = time.perf_counter()
    req = urllib.request.Request(
        url,
        headers={"Connection": "close", "User-Agent": "YazForensicProbe/1.0"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read(512).decode("utf-8", errors="replace")
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
            return {
                "ok": True,
                "status": resp.status,
                "headers": dict(resp.headers.items()),
                "body_preview": body,
                "roundtrip_ms": elapsed_ms,
            }
    except urllib.error.HTTPError as exc:
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        return {
            "ok": False,
            "http_error": exc.code,
            "reason": exc.reason,
            "roundtrip_ms": elapsed_ms,
        }
    except Exception as exc:
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        return {"ok": False, "error": repr(exc), "roundtrip_ms": elapsed_ms}


def inspect_proc_tree() -> list[dict]:
    entries = []
    for pid_dir in sorted(Path("/proc").iterdir(), key=lambda p: p.name):
        if not pid_dir.name.isdigit():
            continue
        pid = int(pid_dir.name)
        try:
            cmdline_raw = (pid_dir / "cmdline").read_bytes()
            if not cmdline_raw:
                continue
            cmdline = cmdline_raw.replace(b"\x00", b" ").decode("utf-8", errors="replace").strip()
            if not any(k in cmdline for k in ("yaz_matrix_chat", "sol-assistant", "4090", "tool-loader")):
                continue
            stat_parts = (pid_dir / "stat").read_text(errors="replace").split()
            ppid = int(stat_parts[3]) if len(stat_parts) > 3 else -1
            state = stat_parts[2] if len(stat_parts) > 2 else "?"
            wchan_path = pid_dir / "wchan"
            wchan = wchan_path.read_text(errors="replace").strip() if wchan_path.exists() else ""
            fds = []
            fd_dir = pid_dir / "fd"
            if fd_dir.exists() and os.access(fd_dir, os.R_OK):
                for fd in sorted(fd_dir.iterdir(), key=lambda x: x.name):
                    try:
                        target = os.readlink(fd)
                        fds.append({"fd": fd.name, "target": target})
                    except OSError:
                        pass
            entries.append(
                {
                    "pid": pid,
                    "ppid": ppid,
                    "state": state,
                    "wchan": wchan,
                    "cmdline": cmdline[:400],
                    "open_fds": fds[:40],
                }
            )
        except Exception:
            continue
    return entries


def scan_suspicious_code_patterns() -> list[dict]:
    findings = []
    patterns = [
        ("unclosed_keepalive_or_timer", re.compile(r"setInterval\(|keepAliveMs|86400000")),
        ("shell_fd_inherit_risk", re.compile(r"xdg-open|ensure-ollama\.sh|pgrep -f")),
        ("bind_host_check", re.compile(r"127\.0\.0\.1|0\.0\.0\.0|localhost")),
        ("signal_handler_absence", re.compile(r"process\.on\(\s*['\"](SIGINT|SIGTERM)")),
    ]
    for pattern_glob in ("tools/*.js", "scripts/*.sh", "server/*.js"):
        for file_path in sorted(glob.glob(str(ROOT / pattern_glob))):
            p = Path(file_path)
            content = p.read_text(errors="replace")
            sha256 = hashlib.sha256(content.encode("utf-8")).hexdigest()[:12]
            matches = {}
            for name, rx in patterns:
                lines = [idx + 1 for idx, line in enumerate(content.splitlines()) if rx.search(line)]
                if lines:
                    matches[name] = lines
            findings.append(
                {
                    "file": str(p.relative_to(ROOT)),
                    "sha256_12": sha256,
                    "bytes": len(content.encode("utf-8")),
                    "matches": matches,
                }
            )
    return findings


def main() -> None:
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    report = {
        "timestamp_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "target_port": PORT,
        "tcp_probe": tcp_connect_probe("127.0.0.1", PORT),
        "http_history_probe": raw_http_probe("127.0.0.1", PORT, "/api/history"),
        "http_root_probe": raw_http_probe("127.0.0.1", PORT, "/"),
        "proc_entries": inspect_proc_tree(),
        "sockets_ss": run_cmd(["ss", "-tulpn"]),
        "code_forensics": scan_suspicious_code_patterns(),
        "log_tail_4090": run_cmd(["tail", "-n", "40", f"data/yaz-chat/matrix-{PORT}.log"]),
    }

    hypotheses = []
    if report["tcp_probe"].get("reachable") and not report["http_history_probe"].get("ok"):
        hypotheses.append(
            "TCP SYN/ACK succeeds on 127.0.0.1:4090, but HTTP /api/history timed out or failed: a listener socket is bound (possibly an older or stuck Node process) or request handling is blocked."
        )
    if any(not item["matches"].get("signal_handler_absence") and item["file"].endswith("yaz_matrix_chat.js") for item in report["code_forensics"]):
        hypotheses.append(
            "yaz_matrix_chat.js lacks explicit SIGINT/SIGTERM server.close() handlers, so orphaned or keepAliveMs processes can linger across restarts."
        )
    if any("ensure-ollama.sh" in item["matches"] for item in report["code_forensics"] if item["file"] == "scripts/sol-assistant.sh"):
        hypotheses.append(
            "sol-assistant.sh invokes ensure-ollama.sh on every invocation before subcommand execution, adding startup latency or side effects."
        )

    report["root_cause_hypotheses"] = hypotheses
    OUT_JSON.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(f"FORENSIC_REPORT={OUT_JSON.relative_to(ROOT)}")
    print(f"TCP_PROBE={json.dumps(report['tcp_probe'])}")
    print(f"HTTP_HISTORY={json.dumps(report['http_history_probe'])}")
    print(f"MATCHED_PROCS={len(report['proc_entries'])}")
    for proc in report["proc_entries"]:
        print(f"  PID={proc['pid']} PPID={proc['ppid']} STATE={proc['state']} WCHAN={proc['wchan']} CMD={proc['cmdline'][:140]}")
    for idx, hyp in enumerate(hypotheses, 1):
        print(f"HYPOTHESIS_{idx}={hyp}")


if __name__ == "__main__":
    main()
