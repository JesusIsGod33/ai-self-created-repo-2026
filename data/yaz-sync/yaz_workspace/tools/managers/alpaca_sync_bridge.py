import os
import sys
import json
import sqlite3
import requests
from datetime import datetime

def sync_broker_state():
    alpaca_key = os.getenv("ALPACA_API_KEY_ID")
    alpaca_secret = os.getenv("ALPACA_API_SECRET_KEY")
    alpaca_url = os.getenv("ALPACA_BASE_URL", "https://paper-api.alpaca.markets")
    
    if not alpaca_key or not alpaca_secret:
        print("[ERROR] Alpaca credentials missing from environment.")
        return

    print("--- [YAZ ALGEBRAIC BRIDGE] Querying shared Alpaca account... ---")
    
    headers = {
        "APCA-API-KEY-ID": alpaca_key,
        "APCA-API-SECRET-KEY": alpaca_secret,
        "Content-Type": "application/json"
    }
    
    try:
        # 1. Fetch active positions from shared Alpaca broker
        pos_res = requests.get(f"{alpaca_url}/v2/positions", headers=headers, timeout=10)
        pos_res.raise_for_status()
        active_positions = pos_res.json()
        
        # 2. Fetch recent orders
        ord_res = requests.get(f"{alpaca_url}/v2/orders?status=all&limit=10", headers=headers, timeout=10)
        ord_res.raise_for_status()
        recent_orders = ord_res.json()
        
        # 3. Log current broker state to local WAL SQLite database
        db_path = os.path.expanduser("~/.yaz_omni_v52.db")
        conn = sqlite3.connect(db_path)
        
        # Write a state snapshot of the active portfolio
        payload = {
            "sync_timestamp": datetime.now().isoformat(),
            "positions_count": len(active_positions),
            "active_positions": active_positions,
            "recent_orders": recent_orders
        }
        
        conn.execute(
            "INSERT INTO memory_stream (role, content, semantic_tags) VALUES (?, ?, ?)",
            ("broker_sync", json.dumps(payload), "alpaca_broker_state")
        )
        conn.commit()
        conn.close()
        
        print(f"[SUCCESS] Local state synchronized with shared Alpaca broker account.")
        print(f"Captured {len(active_positions)} active position(s) and {len(recent_orders)} recent order(s).")
        
    except Exception as e:
        print(f"[ERROR] Sync failure with Alpaca REST endpoint: {e}")

if __name__ == "__main__":
    sync_broker_state()
