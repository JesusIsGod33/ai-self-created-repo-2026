#!/home/infuselink/yaz_env/bin/python3
import os
import sys
import subprocess
from rich.console import Console
from rich.panel import Panel

# Ensure YAZ core libraries and the home directory are in the system path
sys.path.append(os.path.expanduser("~"))
sys.path.append(os.path.expanduser("~/ai-memory-bank"))
sys.path.append(os.path.expanduser("~/yaz_workspace"))

try:
    from yaz_master import YazInterface
except ImportError:
    print("[ERROR] YazInterface class could not be resolved from path mapping.")
    sys.exit(1)

class MassUpgrader:
    def __init__(self):
        self.console = Console()
        self.yaz = YazInterface()
        
        # Manifest of 5 highly complex, safe, and productive system automation modules to build
        self.upgrades = [
            ("optimizer", "DbQueryOptimizer"),         # Database Optimization Matrix
            ("monitoring", "ServiceObserver"),         # DevOps Systems Monitoring Matrix
            ("refactor", "AstRefactorPlanner"),        # Advanced Software Engineering Matrix
            ("compiler", "LlmPromptCompiler"),         # Neural Prompts Compilation Matrix
            ("normalization", "SyslogNormalizer")      # Data Ingestion & Normalization Matrix
        ]

    def execute_mass_upgrade(self):
        self.console.print(Panel("[bold yellow]YAZ Mass Ingestion & Cognitive Self-Upgrade Loop Initialized[/]", expand=False))
        self.yaz.auto_execute = True  # Enable autostart to bypass manual confirmation prompts safely
        
        total_runs = len(self.upgrades)
        successful_runs = 0
        
        for i, (archetype, filename) in enumerate(self.upgrades, 1):
            self.console.print(f"\n[bold cyan]Processing Upgrade {i}/{total_runs}: [yellow]{archetype.upper()}[/] -> [green]{filename}.py[/]")
            try:
                # Execute the autonomous self-healing upgrade loop directly in-process
                self.yaz.execute_autonomous_upgrade(archetype, filename)
                successful_runs += 1
            except Exception as e:
                self.console.print(f"[bold red]Unexpected Failure during {archetype} upgrade:[/] {e}")
                continue

        # Re-run ContextCacheManager once at the end of the entire batch to conserve CPU cycles
        self.console.print("\n[bold yellow]Compiling final system-wide RAG context index...[/]")
        interpreter = os.path.expanduser("~/yaz_env/bin/python3")
        subprocess.run([interpreter, os.path.expanduser("~/yaz_workspace/tools/ops/ContextCacheManager.py")])
        
        # Execute GitOps Sync Engine to commit and push all newly generated certified tools to GitHub
        self.console.print("[bold yellow]Executing global state-parity sync to remote repository...[/]")
        subprocess.run([interpreter, os.path.expanduser("~/yaz_workspace/tools/ops/sync_engine.py")])

        self.console.print(Panel(f"[bold green]Mass Upgrade Cycle Complete![/]\nSuccessfully compiled, verified, and deployed [cyan]{successful_runs}/{total_runs}[/] advanced tools.", border_style="green", expand=False))

if __name__ == "__main__":
    MassUpgrader().execute_mass_upgrade()
