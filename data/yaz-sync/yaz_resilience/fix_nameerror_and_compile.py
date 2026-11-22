from pathlib import Path
import py_compile

TARGET = Path("/home/infuselink/yaz_master.py")

HELPER_BLOCK = """
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
    import time
    last_err = None
    for attempt in range(retries):
        try:
            return fn()
        except Exception as exc:
            last_err = exc
            if attempt < retries - 1:
                time.sleep(base_delay * (2 ** attempt))
    raise last_err
"""

def repair_yaz_master() -> None:
    if not TARGET.exists():
        raise FileNotFoundError(f"Missing {TARGET}")

    src = TARGET.read_text(encoding="utf-8")

    # Remove any out-of-order appended guard block so we can place it before chat_query/run
    marker = "# --- RESILIENT CHAT & MEMORY GUARD ---"
    if marker in src:
        idx = src.find(marker)
        end_idx = src.find("\n\n", idx)
        if end_idx == -1:
            src = src[:idx].rstrip() + "\n"
        else:
            # Trim from marker through the helper definitions if placed after chat_query
            after_retry = src.find("raise last_err", idx)
            if after_retry != -1:
                line_end = src.find("\n", after_retry)
                if line_end != -1:
                    src = src[:idx] + src[line_end + 1:]

    # Insert helper block right before `def chat_query` so it is always defined before use
    target_def = "def chat_query("
    def_pos = src.find(target_def)
    if def_pos != -1 and "_ensure_memory_context_method" not in src[:def_pos]:
        line_start = src.rfind("\n", 0, def_pos)
        insert_at = 0 if line_start == -1 else line_start + 1
        src = src[:insert_at] + HELPER_BLOCK.lstrip("\n") + "\n" + src[insert_at:]
    elif "_ensure_memory_context_method" not in src:
        src = HELPER_BLOCK.lstrip("\n") + "\n" + src

    TARGET.write_text(src, encoding="utf-8")
    py_compile.compile(str(TARGET), doraise=True)
    print("Repaired _ensure_memory_context_method placement and verified py_compile.")

if __name__ == "__main__":
    repair_yaz_master()
