from pathlib import Path
import time

TARGET = Path("/home/infuselink/yaz_master.py")
BACKUP = Path("/home/infuselink/yaz_master.py.bak")

MARKER = "# --- RESILIENT CHAT & MEMORY GUARD ---"

PATCH_CODE = '''
# --- RESILIENT CHAT & MEMORY GUARD ---
def _ensure_memory_context_method(memory_obj):
    if memory_obj is not None and not hasattr(memory_obj, "get_context_window"):
        def get_context_window(limit: int = 5):
            for attr in ("recent_turns", "history", "messages", "buffer"):
                val = getattr(memory_obj, attr, None)
                if isinstance(val, list):
                    return val[-limit:] if limit > 0 else []
            return []
        setattr(memory_obj, "get_context_window", get_context_window)

def _bounded_retry(fn, retries: int = 3, base_delay: float = 0.75):
    last_err = None
    for attempt in range(retries):
        try:
            return fn()
        except Exception as exc:
            last_err = exc
            if attempt < retries - 1:
                time.sleep(base_delay * (2 ** attempt))
    raise last_err
'''

def apply_patch() -> None:
    if not TARGET.exists():
        raise FileNotFoundError(f"Missing target file: {TARGET}")

    src = TARGET.read_text(encoding="utf-8")
    if not BACKUP.exists():
        BACKUP.write_text(src, encoding="utf-8")

    if MARKER not in src:
        src = src + "\n" + PATCH_CODE

    src = src.replace(
        "recent = self.memory.get_context_window(limit=5)",
        "_ensure_memory_context_method(self.memory)\n        recent = self.memory.get_context_window(limit=5)",
    )

    TARGET.write_text(src, encoding="utf-8")
    print(f"Patched {TARGET} successfully (backup at {BACKUP}).")

if __name__ == "__main__":
    apply_patch()
