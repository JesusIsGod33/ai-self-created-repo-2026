#!/home/infuselink/yaz_env/bin/python3
import os
import sys
import subprocess
import re
from rich.console import Console
from rich.panel import Panel

class YazGitSync:
    def __init__(self):
        self.console = Console()
        self.repo_dir = os.path.expanduser("~/ai-memory-bank")
        self.github_token = os.getenv("GITHUB_TOKEN")
        
        # Fallback to loading the token securely from the vault if not in environment
        if not self.github_token:
            vault_path = os.path.expanduser("~/vault/keys.env")
            if os.path.exists(vault_path):
                with open(vault_path, "r") as f:
                    for line in f:
                        if "GITHUB_TOKEN" in line:
                            try:
                                self.github_token = line.strip().split("=", 1)[1].strip("'\"")
                            except: pass

    def run_sync(self):
        self.console.print("[bold blue]Initializing GitHubOps Sync Cycle...[/]")
        
        try:
            # Force global git config to prefer HTTPS over SSH
            subprocess.run(["git", "config", "--global", "url.https://github.com/.insteadOf", "git@github.com:"], check=True)
            
            if not os.path.exists(os.path.join(self.repo_dir, ".git")):
                subprocess.run(["git", "-C", self.repo_dir, "init"], check=True)

            self.console.print("[bold blue]Staging environment artifacts...[/]")
            subprocess.run(["git", "-C", self.repo_dir, "add", "-A"], check=True)

            status_res = subprocess.run(["git", "-C", self.repo_dir, "status", "--porcelain"], capture_output=True, text=True, check=True)
            if not status_res.stdout.strip():
                self.console.print(Panel("No modifications detected. Repository state matches local workspace.", border_style="green"))
                return

            subprocess.run(["git", "-C", self.repo_dir, "commit", "-m", "YAZ-Sync: Automated state-parity commit"], check=True)

            active_branch = subprocess.run(["git", "-C", self.repo_dir, "rev-parse", "--abbrev-ref", "HEAD"], capture_output=True, text=True, check=True).stdout.strip()

            if self.github_token:
                # DYNAMICALLY read the remote origin instead of hardcoding it
                remote_res = subprocess.run(["git", "-C", self.repo_dir, "remote", "get-url", "origin"], capture_output=True, text=True)
                if remote_res.returncode == 0:
                    raw_url = remote_res.stdout.strip()
                    # Strip any existing broken credentials
                    clean_url = re.sub(r"https://.*?@github.com/", "https://github.com/", raw_url)
                    # Inject the secure, live GITHUB_TOKEN
                    secure_url = clean_url.replace("https://github.com/", f"https://x-access-token:{self.github_token}@github.com/")
                    subprocess.run(["git", "-C", self.repo_dir, "remote", "set-url", "origin", secure_url], check=True)

            self.console.print(f"[bold blue]Pushing local delta to branch: {active_branch} via HTTPS...[/]")
            push_res = subprocess.run(["git", "-C", self.repo_dir, "push", "origin", active_branch], capture_output=True, text=True)

            if push_res.returncode == 0:
                self.console.print(Panel(f"State successfully synchronized with remote repository: {active_branch}.", border_style="green"))
            else:
                self.console.print(f"[bold red]Sync push failed:[/] {push_res.stderr.strip()}")
                
        except Exception as e:
            self.console.print(f"[bold red]Unexpected Error during Sync Cycle:[/] {str(e)}")

if __name__ == "__main__":
    YazGitSync().run_sync()
