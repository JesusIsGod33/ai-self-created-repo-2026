#!/home/infuselink/yaz_env/bin/python3
import sys
from core_engine import CoreEngine

class CredentialManager(CoreEngine):
    def run(self, target="localhost", params={}):
        return self.execute_payload(target, "Credential", params)

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else "localhost"
    print(f"[MANAGER] CredentialManager initialized on {target}")
    CredentialManager().run(target)
