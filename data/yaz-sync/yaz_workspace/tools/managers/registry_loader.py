import os
import re

# DYNAMIC_REGISTRY_AUTO_LOADER
def sync_registry():
    path = "/home/infuselink/ai-memory-bank/yaz_workspace/tools/managers/"
    registry_file = "/home/infuselink/ai-memory-bank/yaz_workspace/tools/manager_factory.py"
    
    with open(registry_file, "r") as f:
        content = f.read()

    new_entries = []
    for f_name in os.listdir(path):
        if f_name.endswith("Manager.py"):
            domain = f_name.replace("Manager.py", "")
            if domain not in content:
                new_entries.append(f'class {domain}Manager(BaseManager):\n    def execute(self):\n        return f"[{domain}Manager] Active on {{self.target}}"\n')
                
    with open(registry_file, "a") as f:
        f.write("\n".join(new_entries))
    print("[+] Registry Auto-Load Complete")