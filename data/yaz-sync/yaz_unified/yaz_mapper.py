#!/usr/bin/env python3
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

HOME = Path.home()
DEFAULT_SCAN_DIRS = [
    HOME,
    HOME / "yaz_core",
    HOME / "yaz_workspace",
    HOME / "ai-memory-bank",
    HOME / "scripts",
    HOME / "tools",
]
INDEX_FILE = HOME / ".yaz_workspace_map.json"
DEFAULT_ENDPOINT = os.environ.get(
    "YAZ_API_URL",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
)


def build_workspace_map(roots=None) -> dict:
    roots = roots or DEFAULT_SCAN_DIRS
    py_files = []
    sh_files = []
    seen = set()

    for root in roots:
        if not root.exists():
            continue
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [
                d
                for d in dirnames
                if d not in {".git", "__pycache__", "node_modules", "myenv", "aws-cli-venv", "self_healing_system_venv"}
            ]
            for fname in sorted(filenames):
                full = Path(dirpath) / fname
                key = str(full)
                if key in seen:
                    continue
                seen.add(key)
                if fname.endswith(".py"):
                    py_files.append(key)
                elif fname.endswith(".sh"):
                    sh_files.append(key)

    payload = {
        "python_count": len(py_files),
        "shell_count": len(sh_files),
        "python_scripts": py_files[:400],
        "shell_scripts": sh_files[:200],
    }
    INDEX_FILE.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return payload


def ask_cloud(prompt: str, context_summary: str) -> str:
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        return "GEMINI_API_KEY is not set; workspace map is ready via 'ls' or 'map'."

    system_msg = (
        "You are YAZ running on a Chromebook Linux environment. "
        "Use the provided workspace file map to answer questions about available scripts, "
        "tools, and architecture clearly and concisely."
    )
    body = {
        "system_instruction": {"parts": [{"text": system_msg}]},
        "contents": [
            {
                "role": "user",
                "parts": [{"text": f"Workspace Map:\n{context_summary}\n\nRequest:\n{prompt}"}],
            }
        ],
        "generationConfig": {"maxOutputTokens": 2048, "temperature": 0.3},
    }
    url = f"{DEFAULT_ENDPOINT}?key={api_key}" if "key=" not in DEFAULT_ENDPOINT else DEFAULT_ENDPOINT
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            cands = data.get("candidates", [])
            if cands:
                parts = cands[0].get("content", {}).get("parts", [])
                return "\n".join(p.get("text", "") for p in parts if "text" in p).strip()
            return json.dumps(data)
    except urllib.error.HTTPError as exc:
        return f"[HTTP {exc.code}] {exc.read().decode('utf-8', errors='replace')}"
    except Exception as exc:
        return f"[CLOUD ERROR] {exc}"


def run_repl() -> None:
    wmap = build_workspace_map()
    summary = (
        f"Python scripts ({wmap['python_count']}): {', '.join(Path(p).name for p in wmap['python_scripts'][:60])}\n"
        f"Shell scripts ({wmap['shell_count']}): {', '.join(Path(s).name for s in wmap['shell_scripts'][:40])}"
    )
    print("YAZ MAPPER READY | Commands: ls, map, py <name.py>, sh <name.sh>, <any question>, exit")
    while True:
        try:
            raw = input("YAZ-MAP> ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break
        if not raw:
            continue
        low = raw.lower()
        if low in ("exit", "quit", "/exit"):
            break
        if low in ("ls", "/ls", "map", "/map"):
            wmap = build_workspace_map()
            print(f"Mapped {wmap['python_count']} .py files and {wmap['shell_count']} .sh files -> {INDEX_FILE}")
            for item in wmap["python_scripts"][:35]:
                print(" ", item)
            continue
        if raw.startswith("py "):
            target = raw[3:].strip()
            match = next((p for p in wmap["python_scripts"] if Path(p).name == target or p == target), None)
            if not match:
                print(f"Script not found in map: {target}")
                continue
            subprocess.run([sys.executable, match], check=False)
            continue
        if raw.startswith("sh "):
            target = raw[3:].strip()
            match = next((s for s in wmap["shell_scripts"] if Path(s).name == target or s == target), None)
            if not match:
                print(f"Script not found in map: {target}")
                continue
            subprocess.run(["bash", match], check=False)
            continue
        print(ask_cloud(raw, summary))


if __name__ == "__main__":
    if len(sys.argv) > 1:
        wmap = build_workspace_map()
        summary = f"Python scripts ({wmap['python_count']}): {', '.join(Path(p).name for p in wmap['python_scripts'][:60])}"
        print(ask_cloud(" ".join(sys.argv[1:]), summary))
    else:
        run_repl()
