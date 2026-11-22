#!/home/infuselink/yaz_env/bin/python3
import os
import sys

# ==============================================================================
# YAZ SYSTEM CHRONOLOGICAL LOG AUDITOR
# ==============================================================================

class LogAuditor:
    def __init__(self):
        self.target_log = "/var/log/dpkg.log"
        self.report_path = os.path.expanduser("~/yaz_workspace/SYSTEM_AUDIT.md")

    def audit_system_logs(self):
        print(f"[LOG_AUDITOR] Accessing system package transactions from {self.target_log}...")
        if not os.path.exists(self.target_log):
            print(f"[ERROR] Log file {self.target_log} is not readable or does not exist.")
            return

        try:
            with open(self.target_log, "r", errors="ignore") as f:
                log_lines = f.readlines()

            # Parse for key indicators of configuration modifications and installations
            anomalies = []
            for line in log_lines[-100:]:  # Scan the last 100 entries for changes
                if any(indicator in line for idx, indicator in enumerate(["install", "configure", "remove"])):
                    anomalies.append(line.strip())

            # Compile into structured Markdown report
            report = "# YAZ CHRONOLOGICAL SYSTEM AUDIT REPORT\n\n"
            report += "## Local Package Transactions (Recent Changes)\n\n"
            report += "| Timestamp | Transaction Details |\n"
            report += "| --- | --- |\n"
            
            for entry in anomalies:
                parts = entry.split(" ", 2)
                if len(parts) >= 3:
                    timestamp = f"{parts[0]} {parts[1]}"
                    details = parts[2]
                    report += f"| {timestamp} | {details} |\n"
                else:
                    report += f"| - | {entry} |\n"

            with open(self.report_path, "w", encoding="utf-8") as rf:
                rf.write(report)
            
            print(f"[SUCCESS] Audit Report successfully generated at {self.report_path}")
        except Exception as e:
            print(f"[ERROR] Failed to compile audit report: {e}")

if __name__ == "__main__":
    LogAuditor().audit_system_logs()
