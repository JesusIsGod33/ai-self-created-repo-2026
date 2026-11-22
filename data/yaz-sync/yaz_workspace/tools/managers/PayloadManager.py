#!/home/infuselink/yaz_env/bin/python3
import sys
from core_engine import CoreEngine

class PayloadManager(CoreEngine):
    def run(self, target="localhost", params={}):
        return self.execute_payload(target, "Payload", params)

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else "localhost"
    print(f"[MANAGER] PayloadManager initialized on {target}")
    PayloadManager().run(target)
