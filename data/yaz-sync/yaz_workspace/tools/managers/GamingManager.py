#!/home/infuselink/yaz_env/bin/python3
import os
import subprocess
import sys

class GamingManager:
    def __init__(self):
        self.launch_env = {
            "PROTON_FSR4_UPGRADE": "1",
            "PROTON_FSR4_RDNA3_UPGRADE": "1",
            "WINEDLLOVERRIDES": "amdxcffx64=n,b"
        }

    def run(self, target_app_id, params={}):
        print(f"[MANAGER] Initializing Steam launch for App ID: {target_app_id}")
        env = os.environ.copy()
        env.update(self.launch_env)
        
        try:
            # Launch via Steam URL protocol to trigger native runtime with overrides
            subprocess.run(["steam", f"steam://rungameid/{target_app_id}"], env=env, check=True)
            print("[SUCCESS] Application successfully dispatched.")
        except Exception as e:
            print(f"[ERROR] Dispatch failed: {e}")

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else "1361210"
    GamingManager().run(target)
