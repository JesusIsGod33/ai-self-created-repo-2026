#!/home/infuselink/yaz_env/bin/python3
import sys
from core_engine import CoreEngine

class StaticAnalysisManager(CoreEngine):
    def run(self, target="localhost", params={}):
        return self.execute_payload(target, "StaticAnalysis", params)

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else "localhost"
    print(f"[MANAGER] StaticAnalysisManager initialized on {target}")
    StaticAnalysisManager().run(target)
