#!/usr/bin/env python3
import sys
from core_engine import CoreEngine

class FlowGrapher(CoreEngine):
    def __init__(self):
        self.context = "engineering"
    def run(self, target="localhost"):
        print(f"[HYDRA] Initializing FlowGrapher on {target}")
        return self.execute_payload(target, "FlowGrapher", {"status": "initialized"})

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else "localhost"
    FlowGrapher().run(target)
