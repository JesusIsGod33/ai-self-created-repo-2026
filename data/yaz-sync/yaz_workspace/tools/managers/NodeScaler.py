#!/usr/bin/env python3
import sys
from core_engine import CoreEngine

class NodeScaler(CoreEngine):
    def __init__(self):
        self.context = "ops"
    def run(self, target="localhost"):
        print(f"[HYDRA] Initializing NodeScaler on {target}")
        return self.execute_payload(target, "NodeScaler", {"status": "initialized"})

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else "localhost"
    NodeScaler().run(target)
