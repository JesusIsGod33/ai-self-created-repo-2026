#!/usr/bin/env python3
import sys
from core_engine import CoreEngine

class MetricAggregator(CoreEngine):
    def __init__(self):
        self.context = "data"
    def run(self, target="localhost"):
        print(f"[HYDRA] Initializing MetricAggregator on {target}")
        return self.execute_payload(target, "MetricAggregator", {"status": "initialized"})

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else "localhost"
    MetricAggregator().run(target)
