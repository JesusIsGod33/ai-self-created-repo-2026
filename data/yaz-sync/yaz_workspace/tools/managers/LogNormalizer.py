#!/usr/bin/env python3
import sys
from core_engine import CoreEngine

class LogNormalizer(CoreEngine):
    def __init__(self):
        self.context = "data"
    def run(self, target="localhost"):
        print(f"[HYDRA] Initializing LogNormalizer on {target}")
        return self.execute_payload(target, "LogNormalizer", {"status": "initialized"})

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else "localhost"
    LogNormalizer().run(target)
