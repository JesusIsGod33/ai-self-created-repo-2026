#!/home/infuselink/yaz_env/bin/python3
import sys
from core_engine import CoreEngine

class GeneticManager(CoreEngine):
    def run(self, target="localhost", params={}):
        return self.execute_payload(target, "Genetic", params)

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else "localhost"
    print(f"[MANAGER] GeneticManager initialized on {target}")
    GeneticManager().run(target)
