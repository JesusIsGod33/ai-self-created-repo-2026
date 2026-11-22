#!/home/infuselink/yaz_env/bin/python3
import os
import sys
import subprocess

# ==============================================================================
# YAZ SYSTEM SENTINEL: PROCESS AUDITOR & MEMORY GUARDIAN
# ==============================================================================

class SysSentinel:
    def __init__(self):
        self.mem_threshold_pct = 15.0  # Alert threshold if a process hogs >15% of RAM

    def get_total_memory(self):
        """Natively parses /proc/meminfo to retrieve total system memory in KB."""
        try:
            with open("/proc/meminfo", "r") as f:
                for line in f:
                    if "MemTotal" in line:
                        return int(line.split()[1])
        except Exception:
            return 2048000  # Fallback assumption: 2GB

    def audit_processes(self):
        print("[SYS_SENTINEL] Auditing active process table via native /proc parsing...")
        total_mem = self.get_total_memory()
        page_size = os.sysconf("SC_PAGE_SIZE") // 1024  # Convert to KB
        
        pids = [pid for pid in os.listdir("/proc") if pid.isdigit()]
        high_consumers = []

        for pid in pids:
            try:
                # Read process resident set size (RSS) from /proc/[pid]/stat
                # Field 24 is RSS in pages
                with open(f"/proc/{pid}/stat", "r") as f:
                    stat_fields = f.read().split()
                
                # Check for command name
                with open(f"/proc/{pid}/cmdline", "r") as f:
                    cmd = f.read().replace("\x00", " ").strip()
                if not cmd:
                    with open(f"/proc/{pid}/comm", "r") as f:
                        cmd = f.read().strip()
                
                rss_kb = int(stat_fields[23]) * page_size
                mem_pct = (rss_kb / total_mem) * 100
                
                if mem_pct > self.mem_threshold_pct and int(pid) != os.getpid():
                    high_consumers.append({
                        "pid": int(pid),
                        "cmd": cmd,
                        "mem_kb": rss_kb,
                        "mem_pct": mem_pct
                    })
            except Exception:
                continue

        if high_consumers:
            print(f"[ALERT] Identified {len(high_consumers)} high-consumption processes:")
            for p in high_consumers:
                print(f" - PID: {p['pid']} | Memory: {p['mem_pct']:.2f}% ({p['mem_kb']//1024}MB) | Command: {p['cmd']}")
                # Safely terminate excessive resource leaks (like crashed Java servers)
                if any(leak in p['cmd'] for leak in ["java", "neo4j", "containerd"]):
                    print(f"   [ACTION] Attempting safe SIGTERM on PID {p['pid']}...")
                    try:
                        os.kill(p['pid'], 15)  # SIGTERM
                        print("   [SUCCESS] Signal sent.")
                    except Exception as e:
                        print(f"   [ERROR] Failed to signal process: {e}")
        else:
            print("[SYS_SENTINEL] All system resource usage patterns are within nominal parameters.")

if __name__ == "__main__":
    SysSentinel().audit_processes()
