#!/usr/bin/env python3
import sys
from core_engine import CoreEngine

class ContextCompressor(CoreEngine):
    def __init__(self):
        self.context = "neural"
    def run(self, target="localhost"):
        print(f"[HYDRA] Initializing ContextCompressor on {target}")
        return self.execute_payload(target, "ContextCompressor", {"status": "initialized"})

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else "localhost"
    ContextCompressor().run(target)
