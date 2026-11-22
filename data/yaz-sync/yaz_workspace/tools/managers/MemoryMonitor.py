import psutil
import time

def monitor_memory_usage():
    while True:
        memory = psutil.virtual_memory()
        available = round(memory.available / (1024.0 ** 3), 1)
        total = round(memory.total / (1024.0 ** 3), 1)
        percent = memory.percent
        print(f"Available memory: {available} GB")
        print(f"Total memory: {total} GB")
        print(f"Memory usage: {percent}%")
        time.sleep(60)

monitor_memory_usage()