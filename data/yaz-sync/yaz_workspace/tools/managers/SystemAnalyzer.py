import os
import subprocess

class SystemAnalyzer:
    def __init__(self):
        self.analyzers = {
            "package_update": self.package_update,
            "disk_usage": self.disk_usage,
            "memory_usage": self.memory_usage,
            "cpu_usage": self.cpu_usage,
            "network_usage": self.network_usage,
            "security_scan": self.security_scan,
            "configuration_analysis": self.configuration_analysis
        }

    def package_update(self):
        subprocess.run(["sudo", "apt", "update"])

    def disk_usage(self):
        subprocess.run(["df", "-h"])

    def memory_usage(self):
        subprocess.run(["free", "-m"])

    def cpu_usage(self):
        subprocess.run(["top"])

    def network_usage(self):
        subprocess.run(["netstat", "-an"])

    def security_scan(self):
        subprocess.run(["sudo", "debsecan"])

    def configuration_analysis(self):
        subprocess.run(["sudo", "sysdig"])

    def analyze(self, analyzer_type):
        if analyzer_type in self.analyzers:
            self.analyzers[analyzer_type]()
        else:
            print("Invalid analyzer type")

# Create an instance of the SystemAnalyzer
system_analyzer = SystemAnalyzer()

while True:
    print("\n1. Package update")
    print("2. Disk usage")
    print("3. Memory usage")
    print("4. CPU usage")
    print("5. Network usage")
    print("6. Security scan")
    print("7. Configuration analysis")
    print("8. Exit")
    choice = input("Enter your choice: ")

    if choice == "1":
        system_analyzer.analyze("package_update")
    elif choice == "2":
        system_analyzer.analyze("disk_usage")
    elif choice == "3":
        system_analyzer.analyze("memory_usage")
    elif choice == "4":
        system_analyzer.analyze("cpu_usage")
    elif choice == "5":
        system_analyzer.analyze("network_usage")
    elif choice == "6":
        system_analyzer.analyze("security_scan")
    elif choice == "7":
        system_analyzer.analyze("configuration_analysis")
    elif choice == "8":
        break
    else:
        print("Invalid choice")