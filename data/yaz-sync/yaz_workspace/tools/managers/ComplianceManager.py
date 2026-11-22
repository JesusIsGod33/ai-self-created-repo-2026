#!/home/infuselink/yaz_env/bin/python3
import sys
from core_engine import CoreEngine

class ComplianceManager(CoreEngine):
    def run(self, target="localhost", params={}):
        return self.execute_payload(target, "Compliance", params)

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else "localhost"
    print(f"[MANAGER] ComplianceManager initialized on {target}")
    ComplianceManager().run(target)
