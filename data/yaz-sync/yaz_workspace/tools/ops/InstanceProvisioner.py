#!/home/infuselink/yaz_env/bin/python3
import os
import sys
import subprocess
import requests
import json
from rich.console import Console
from rich.panel import Panel

class InstanceProvisioner:
    def __init__(self):
        self.console = Console()
        self.token = os.getenv("GITHUB_TOKEN")
        self.workspace_root = os.path.expanduser("~/yaz_workspace")
        self.repo = "x1xhlol/system-projects"
        self.branch = "orchestrator/multi-platform"

    def get_remote_tree(self):
        url = f"https://api.github.com/repos/{self.repo}/git/trees/{self.branch}?recursive=1"
        headers = {"Accept": "application/vnd.github.v3+json"}
        if self.token:
            headers["Authorization"] = f"token {self.token}"
        try:
            res = requests.get(url, headers=headers, timeout=15)
            if res.status_code == 200:
                return res.json().get("tree", [])
        except Exception as e:
            self.console.print(f"[bold red]Error fetching remote tree:[/] {e}")
        return []

    def provision(self):
        self.console.print(Panel(f"Starting Multi-Instance Provisioning\nSource: [bold yellow]{self.repo}/{self.branch}[/]", border_style="blue"))
        tree = self.get_remote_tree()
        if not tree:
            self.console.print("[bold red]Failed to acquire remote registry. Aborting provisioning.[/]")
            return

        download_count = 0
        headers = {"Accept": "application/vnd.github.v3.raw"}
        if self.token:
            headers["Authorization"] = f"token {self.token}"

        for item in tree:
            path = item.get("path", "")
            # Filter for Python scripts in the remote workspace
            if path.startswith("yaz_workspace/") and path.endswith(".py") and "yaz_env" not in path:
                local_path = os.path.join(os.path.expanduser("~"), path)
                if not os.path.exists(local_path):
                    self.console.print(f"[bold yellow]Provisioning missing asset locally:[/] {path}")
                    os.makedirs(os.path.dirname(local_path), exist_ok=True)
                    
                    # Fetch from GitHub Contents API
                    url = f"https://api.github.com/repos/{self.repo}/contents/{path}?ref={self.branch}"
                    try:
                        res = requests.get(url, headers=headers, timeout=10)
                        if res.status_code == 200:
                            with open(local_path, "w", encoding="utf-8") as f:
                                f.write(res.text)
                            os.chmod(local_path, 0o755)
                            download_count += 1
                        else:
                            self.console.print(f"[bold red]Failed to download {path}:[/] Status {res.status_code}")
                    except Exception as e:
                        self.console.print(f"[bold red]Error downloading {path}:[/] {e}")

        self.console.print(f"[bold green]Provisioning Complete.[/] Ingested [cyan]{download_count}[/] missing local modules.")
        
        # Trigger the semantic cache indexer once at the end of provisioning
        interpreter = os.path.expanduser("~/yaz_env/bin/python3")
        subprocess.run([interpreter, os.path.expanduser("~/yaz_workspace/tools/ops/ContextCacheManager.py")])

if __name__ == "__main__":
    InstanceProvisioner().provision()
