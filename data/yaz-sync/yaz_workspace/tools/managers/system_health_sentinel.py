import os
import sys
import time
import json
import logging
import psutil
import subprocess
from datetime import datetime

# Setup logging
log_dir = os.path.expanduser("~/yaz_workspace/logs")
os.makedirs(log_dir, exist_ok=True)
logging.basicConfig(
    filename=os.path.join(log_dir, "system_sentinel.log"),
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

class SystemSentinel:
    def __init__(self):
        self.output_path = os.path.expanduser("~/yaz_workspace/diagnostics/system_report.json")
        os.makedirs(os.path.dirname(self.output_path), exist_ok=True)

    def check_docker(self):
        try:
            res = subprocess.run(
                ["docker", "ps", "--format", "{{.ID}}|{{.Names}}|{{.Status}}"],
                capture_output=True,
                text=True,
                timeout=10
            )
            if res.returncode != 0:
                return []
            containers = []
            for line in res.stdout.strip().split("\n"):
                if line:
                    parts = line.split("|")
                    containers.append({"id": parts[0], "name": parts[1], "status": parts[2]})
            return containers
        except Exception as e:
            logging.error(f"Docker health check failed: {e}")
            return []

    def scan_system_metrics(self):
        virtual_mem = psutil.virtual_memory()
        disk_usage = psutil.disk_usage("/")
        
        # Pull process statuses
        process_stats = []
        for proc in psutil.process_iter(["pid", "name", "cpu_percent", "memory_percent"]):
            try:
                # Capture only high-intensity tasks to keep logs clean
                if proc.info["cpu_percent"] > 5.0 or proc.info["memory_percent"] > 5.0:
                    process_stats.append(proc.info)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass

        report = {
            "timestamp": datetime.now().isoformat(),
            "cpu": {
                "overall_percent": psutil.cpu_percent(interval=1),
                "per_core_percent": psutil.cpu_percent(percpu=True)
            },
            "memory": {
                "total_gb": virtual_mem.total / (1024**3),
                "available_gb": virtual_mem.available / (1024**3),
                "percent_used": virtual_mem.percent
            },
            "disk": {
                "total_gb": disk_usage.total / (1024**3),
                "free_gb": disk_usage.free / (1024**3),
                "percent_used": disk_usage.percent
            },
            "containers": self.check_docker(),
            "intensive_processes": process_stats
        }
        return report

    def run(self):
        print(f"--- System Health Sentinel Initiated {datetime.now()} ---")
        while True:
            try:
                report = self.scan_system_metrics()
                
                # Persist state snapshot to disk
                with open(self.output_path, "w") as f:
                    json.dump(report, f, indent=4)
                
                # Check for critical alerts
                if report["memory"]["percent_used"] > 90.0:
                    logging.warning(f"HIGH MEMORY ALERT: {report['memory']['percent_used']}%")
                if report["disk"]["percent_used"] > 90.0:
                    logging.critical(f"CRITICAL DISK ALERT: {report['disk']['percent_used']}%")
                
                logging.info("System health audit snapshot recorded successfully.")
            except Exception as e:
                logging.error(f"Sentinel execution fault: {e}")

            time.sleep(30)

if __name__ == "__main__":
    sentinel = SystemSentinel()
    sentinel.run()
