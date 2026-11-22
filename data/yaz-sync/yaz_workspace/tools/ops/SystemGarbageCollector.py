#!/home/infuselink/yaz_env/bin/python3
import os
import sys
import subprocess
import psutil
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

# ==============================================================================
# YAZ SYSTEM GARBAGE COLLECTOR & PROCESS REAPER
# ==============================================================================

class SystemGarbageCollector:
    def __init__(self):
        self.console = Console()

    def find_and_reap_zombies(self):
        """Locates and attempts to reap processes in the zombie (Z) state."""
        self.console.print("[bold yellow]Scanning process table for zombie processes...[/]")
        zombies = []
        for proc in psutil.process_iter(['pid', 'name', 'status', 'ppid']):
            try:
                # 'zombie' status matches state 'Z' in Linux top
                if proc.info['status'] == psutil.STATUS_ZOMBIE:
                    zombies.append(proc.info)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

        if zombies:
            table = Table(title="Zombie Processes Detected", border_style="red")
            table.add_column("PID", style="cyan")
            table.add_column("Parent PID (PPID)", style="yellow")
            table.add_column("Command Name", style="green")
            for z in zombies:
                table.add_row(str(z['pid']), str(z['ppid']), z['name'])
            self.console.print(table)
            
            self.console.print("[bold red]Instructing parents to reap zombie children...[/]")
            for z in zombies:
                try:
                    # Sending SIGCHLD to the parent process forces it to read the child's status and clear the zombie
                    os.kill(z['ppid'], 17)  # SIGCHLD
                    self.console.print(f"[green]✓ Sent SIGCHLD to parent {z['ppid']} of zombie {z['pid']}[/]")
                except Exception as e:
                    self.console.print(f"[red]✗ Failed to signal parent {z['ppid']}: {e}[/]")
        else:
            self.console.print("[bold green]Zero zombie processes currently active in the process table.[/]")

    def stop_container_engines(self):
        """Stops containerd and docker backends which consume heavy CPU/RAM silently."""
        self.console.print("[bold yellow]Inspecting containerization services...[/]")
        try:
            # Check if containerd is running
            res = subprocess.run(["systemctl", "is-active", "containerd"], capture_output=True, text=True)
            if "active" in res.stdout:
                self.console.print("[bold red]Action Required:[/] containerd is running in the background, consuming CPU.")
                self.console.print("[bold yellow]Stopping containerd and docker services to reclaim RAM...[/]")
                subprocess.run(["sudo", "systemctl", "stop", "docker", "containerd"], check=True)
                subprocess.run(["sudo", "systemctl", "disable", "docker", "containerd"], check=True)
                self.console.print("[bold green]✓ Container engines successfully stopped and disabled.[/]")
            else:
                self.console.print("[bold green]Container services are currently inactive.[/]")
        except Exception as e:
            self.console.print(f"[dim]Service check bypassed: {e}[/]")

    def flush_memory(self):
        """Flushes system pages and releases kernel-level RAM caches."""
        self.console.print("[bold yellow]Flushing system cache and dropping memory page tables...[/]")
        try:
            # Sync filesystem buffers to disk
            os.sync()
            # Instruct the Linux kernel to release page caches, dentries, and inodes
            with open("/proc/sys/vm/drop_caches", "w") as f:
                f.write("3")
            self.console.print("[bold green]✓ Memory caches successfully released. RAM reclaimed.[/]")
        except PermissionError:
            self.console.print("[bold red]Permission Error:[/] Dropping kernel caches requires sudo privileges.")
            self.console.print("Running fallback: [bold yellow]sudo sysctl -w vm.drop_caches=3[/]")
            subprocess.run(["sudo", "sysctl", "-w", "vm.drop_caches=3"], capture_output=True)

    def run(self):
        self.console.print(Panel("[bold yellow]YAZ System-Wide Performance Optimization Cycle Initiated[/]", expand=False))
        self.stop_container_engines()
        self.find_and_reap_zombies()
        self.flush_memory()
        self.console.print(Panel("[bold green]System Optimization Complete. Local Latency Cleared.[/]", expand=False))

if __name__ == "__main__":
    SystemGarbageCollector().run()
