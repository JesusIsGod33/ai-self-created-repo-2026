#!/home/infuselink/yaz_env/bin/python3
import sys
from core_engine import CoreEngine

class XSSManager(CoreEngine):
    def run(self, target="localhost", params={}):
        return self.execute_payload(target, "XSS", params)

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else "localhost"
    print(f"[MANAGER] XSSManager initialized on {target}")
    XSSManager().run(target)
