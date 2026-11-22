import psutil
import platform
from datetime import datetime

class SystemMonitor:
    def __init__(self):
        self.system_info = {
            'platform': platform.system(),
            'platform-release': platform.release(),
            'platform-version': platform.version(),
            'architecture': platform.machine(),
            'hostname': platform.node(),
            'processor': platform.processor(),
            'ram': str(round(psutil.virtual_memory().total / (1024.0 **3)))+" GB"
        }

    def get_system_info(self):
        return self.system_info

    def get_cpu_info(self):
        return {
            'physical cores': psutil.cpu_count(logical=False),
            'total cores': psutil.cpu_count(logical=True),
            'max frequency': f"{psutil.cpu_freq().max / 1000} GHz",
            'min frequency': f"{psutil.cpu_freq().min / 1000} GHz",
            'current frequency': f"{psutil.cpu_freq().current / 1000} GHz",
            'cpu usage per core': {f"Core {i}": f"{psutil.cpu_percent(interval=1, percpu=True)[i]}%" for i in range(psutil.cpu_count())}
        }

    def get_memory_info(self):
        svmem = psutil.virtual_memory()
        return {
            'total': f"{svmem.total / (1024.0 **3):.2f} GB",
            'available': f"{svmem.available / (1024.0 **3):.2f} GB",
            'used': f"{svmem.used / (1024.0 **3):.2f} GB",
            'percentage': f"{svmem.percent}%"
        }

    def get_disk_info(self):
        return {
            'total read': f"{psutil.disk_io_counters().read_bytes / (1024.0 **3):.2f} GB",
            'total write': f"{psutil.disk_io_counters().write_bytes / (1024.0 **3):.2f} GB"
        }

    def get_network_info(self):
        return {
            'bytes sent': f"{psutil.net_io_counters().bytes_sent / (1024.0 **3):.2f} GB",
            'bytes recv': f"{psutil.net_io_counters().bytes_recv / (1024.0 **3):.2f} GB"
        }

# Example usage:
if __name__ == "__main__":
    monitor = SystemMonitor()
    print("System Information:")
    for key, value in monitor.get_system_info().items():
        print(f"{key}: {value}")
    print("\nCPU Information:")
    for key, value in monitor.get_cpu_info().items():
        print(f"{key}: {value}")
    print("\nMemory Information:")
    for key, value in monitor.get_memory_info().items():
        print(f"{key}: {value}")
    print("\nDisk Information:")
    for key, value in monitor.get_disk_info().items():
        print(f"{key}: {value}")
    print("\nNetwork Information:")
    for key, value in monitor.get_network_info().items():
        print(f"{key}: {value}")