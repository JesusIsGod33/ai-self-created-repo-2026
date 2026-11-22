#!/home/infuselink/yaz_env/bin/python3
import sys
from core_engine import CoreEngine

class FirmwareManager(CoreEngine):
    def run(self, target="localhost", params={}):
        return self.execute_payload(target, "Firmware", params)

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else "localhost"
    print(f"[MANAGER] FirmwareManager initialized on {target}")
    FirmwareManager().run(target)
