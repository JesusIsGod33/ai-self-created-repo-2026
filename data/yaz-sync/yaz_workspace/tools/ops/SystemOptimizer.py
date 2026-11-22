#!/home/infuselink/yaz_env/bin/python3
import subprocess
import os
import sys
from rich.console import Console
from rich.panel import Panel

class SystemOptimizer:
    def __init__(self):
        self.console = Console()
        self.interpreter = os.path.expanduser("~/yaz_env/bin/python3")
        if not os.path.exists(self.interpreter):
            self.interpreter = sys.executable
            
        self.pipeline = [
            ("AST Parse & Reconcile", "~/yaz_workspace/tools/ops/SystemEvolutionEngine.py"),
            ("Semantic Context Indexing", "~/yaz_workspace/tools/ops/ContextCacheManager.py"),
            ("GitHub Parity Sync", "~/yaz_workspace/tools/ops/sync_engine.py")
        ]

    def execute_phase(self, name, path):
        expanded_path = os.path.expanduser(path)
        if not os.path.exists(expanded_path):
            self.console.print(f"[bold yellow]Skip:[/] {name} not found at {path}")
            return True
            
        self.console.print(Panel(f"Starting Phase: [bold cyan]{name}[/]\nTarget: [dim]{expanded_path}[/]", border_style="blue"))
        try:
            subprocess.run([self.interpreter, expanded_path], check=True)
            return True
        except subprocess.CalledProcessError:
            self.console.print(f"[bold red]Failed during Phase:[/] {name}")
            return False

    def run(self):
        self.console.print(Panel("[bold yellow]YAZ System Optimization Loop Triggered[/]", expand=False))
        for name, path in self.pipeline:
            if not self.execute_phase(name, path):
                self.console.print("[bold red]Optimization aborted due to phase failure.[/]")
                return
        self.console.print(Panel("[bold green]System Optimization Cycle Completed Successfully[/]", border_style="green", expand=False))

if __name__ == "__main__":
    SystemOptimizer().run()
