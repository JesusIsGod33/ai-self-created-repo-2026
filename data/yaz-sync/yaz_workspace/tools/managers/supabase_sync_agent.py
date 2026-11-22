import os
import sys
import json
import socket
import requests
import psutil
from datetime import datetime

def run_sync():
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_ACCESS_TOKEN")
    
    if not supabase_url or not supabase_key:
        print("[ERROR] Cloud Sync Credentials missing from active environment variables.")
        return

    print("--- [YAZ CLOUD BRIDGE] Packaging local system intelligence... ---")
    
    # 1. Package live system hardware diagnostics
    virtual_mem = psutil.virtual_memory()
    metrics = {
        "timestamp": datetime.now().isoformat(),
        "cpu_usage_pct": psutil.cpu_percent(),
        "ram_used_pct": virtual_mem.percent,
        "disk_free_gb": psutil.disk_usage("/").free / (1024**3)
    }
    
    # 2. Package active daemon PID allocations
    registry_path = os.path.expanduser("~/.yaz_node_registry.json")
    active_daemons = {}
    if os.path.exists(registry_path):
        try:
            with open(registry_path, "r") as f:
                active_daemons = json.load(f)
        except Exception:
            pass
            
    payload = {
        "node_id": socket.gethostname(),
        "last_sync": datetime.now().isoformat(),
        "system_metrics": metrics,
        "active_daemons": active_daemons
    }
    
    backup_path = os.path.expanduser("~/yaz_workspace/backups/last_sync_payload.json")
    
    # Supabase REST header payload requirements
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    try:
        # Route state directly to the "yaz_sync" table on Supabase
        url = f"{supabase_url}/rest/v1/yaz_sync"
        r = requests.post(url, json=payload, headers=headers, timeout=10)
        
        if r.status_code in [200, 201]:
            print("[SUCCESS] Cloud State Synchronization complete.")
        else:
            print(f"[WARNING] Supabase API returned status {r.status_code}. State logged locally.")
            os.makedirs(os.path.dirname(backup_path), exist_ok=True)
            with open(backup_path, "w") as f:
                json.dump(payload, f, indent=4)
            print(f"Incremental fallback payload preserved at: {backup_path}")
            
    except Exception as e:
        print(f"[ERROR] Connection to cloud endpoint failed: {e}")
        # Secure the fallback payload even when the connection fails entirely
        try:
            os.makedirs(os.path.dirname(backup_path), exist_ok=True)
            with open(backup_path, "w") as f:
                json.dump(payload, f, indent=4)
            print(f"[OFFLINE RECOVERY] Successfully saved fallback snapshot to: {backup_path}")
        except Exception as write_err:
            print(f"[ERROR] Failed to write local fallback: {write_err}")

if __name__ == "__main__":
    run_sync()
