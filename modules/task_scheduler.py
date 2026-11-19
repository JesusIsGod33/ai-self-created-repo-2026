import hashlib
import json
import os
import sqlite3
import threading
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

GENESIS_HASH = "0" * 64
VALID_STATES = {"QUEUED", "DISPATCHED", "PHASE_LOCKED", "COMPLETED", "FAILED"}


def _emit_log(level: str, msg: str, **fields: Any) -> None:
    payload = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "level": level,
        "module": "task_scheduler",
        "msg": msg,
        **fields,
    }
    print(json.dumps(payload), flush=True)


class MicroTaskLedgerAndQueue:
    def __init__(self, db_path: str, ledger_path: str) -> None:
        self.db_path = db_path
        self.ledger_path = ledger_path
        self._lock = threading.Lock()
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        os.makedirs(os.path.dirname(self.ledger_path), exist_ok=True)
        self._init_db()
        if not os.path.exists(self.ledger_path):
            self._write_ledger([])

    @staticmethod
    def _canonical(obj: Any) -> str:
        return json.dumps(obj, sort_keys=True, separators=(",", ":"))

    @classmethod
    def sha256_data(cls, obj: Any) -> str:
        return hashlib.sha256(cls._canonical(obj).encode("utf-8")).hexdigest()

    @classmethod
    def compute_block_hash(cls, index: int, timestamp: str, payload_hash: str, previous_hash: str) -> str:
        raw = f"{index}|{timestamp}|{payload_hash}|{previous_hash}".encode("utf-8")
        return hashlib.sha256(raw).hexdigest()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, timeout=20.0)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        with self._connect() as conn:
            conn.execute("PRAGMA journal_mode=WAL;")
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS micro_tasks (
                    task_id TEXT PRIMARY KEY,
                    repo_name TEXT NOT NULL,
                    operation TEXT NOT NULL,
                    payload_json TEXT NOT NULL,
                    state TEXT NOT NULL,
                    wave_id INTEGER,
                    payload_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    result_json TEXT,
                    error_text TEXT
                );
                """
            )
            conn.execute(
                """
                UPDATE micro_tasks
                SET state = 'QUEUED', updated_at = ?
                WHERE state IN ('DISPATCHED', 'PHASE_LOCKED');
                """,
                (datetime.now(timezone.utc).isoformat(),),
            )
            conn.commit()

    def _read_ledger_unlocked(self) -> List[Dict[str, Any]]:
        if not os.path.exists(self.ledger_path):
            return []
        with open(self.ledger_path, "r", encoding="utf-8") as f:
            raw = f.read().strip()
        if not raw:
            return []
        parsed = json.loads(raw)
        if not isinstance(parsed, list):
            raise ValueError("Ledger file must contain a JSON list.")
        return parsed

    def _write_ledger(self, blocks: List[Dict[str, Any]]) -> None:
        tmp = f"{self.ledger_path}.tmp.{os.getpid()}"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(blocks, f, indent=2)
            f.write("\n")
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, self.ledger_path)

    def _append_ledger_block_unlocked(self, event_payload: Dict[str, Any]) -> Dict[str, Any]:
        blocks = self._read_ledger_unlocked()
        idx = (blocks[-1]["index"] + 1) if blocks else 0
        prev_hash = blocks[-1]["block_hash"] if blocks else GENESIS_HASH
        ts = datetime.now(timezone.utc).isoformat()
        p_hash = self.sha256_data(event_payload)
        b_hash = self.compute_block_hash(idx, ts, p_hash, prev_hash)
        block = {
            "index": idx,
            "timestamp": ts,
            "payload_hash": p_hash,
            "previous_hash": prev_hash,
            "block_hash": b_hash,
            "event": event_payload,
        }
        blocks.append(block)
        self._write_ledger(blocks)
        return block

    def enqueue_task(self, repo_name: str, operation: str, payload: Dict[str, Any]) -> str:
        task_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()
        p_hash = self.sha256_data(payload)
        payload_str = self._canonical(payload)

        with self._lock:
            with self._connect() as conn:
                conn.execute(
                    """
                    INSERT INTO micro_tasks (
                        task_id, repo_name, operation, payload_json, state,
                        wave_id, payload_hash, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, 'QUEUED', NULL, ?, ?, ?);
                    """,
                    (task_id, repo_name, operation, payload_str, p_hash, now_iso, now_iso),
                )
                conn.commit()
            block = self._append_ledger_block_unlocked(
                {
                    "task_id": task_id,
                    "repo_name": repo_name,
                    "operation": operation,
                    "state": "QUEUED",
                    "payload_hash": p_hash,
                }
            )
        _emit_log("INFO", "Micro-task queued", task_id=task_id, state="QUEUED", ledger_index=block["index"])
        return task_id

    def transition_state(
        self,
        task_id: str,
        new_state: str,
        wave_id: Optional[int] = None,
        result: Optional[Dict[str, Any]] = None,
        error_text: Optional[str] = None,
    ) -> Dict[str, Any]:
        if new_state not in VALID_STATES:
            raise ValueError(f"Invalid task state '{new_state}'.")
        now_iso = datetime.now(timezone.utc).isoformat()

        with self._lock:
            with self._connect() as conn:
                row = conn.execute("SELECT * FROM micro_tasks WHERE task_id = ?;", (task_id,)).fetchone()
                if not row:
                    raise KeyError(f"Task '{task_id}' not found.")
                effective_wave = wave_id if wave_id is not None else row["wave_id"]
                conn.execute(
                    """
                    UPDATE micro_tasks
                    SET state = ?, wave_id = ?, updated_at = ?, result_json = ?, error_text = ?
                    WHERE task_id = ?;
                    """,
                    (
                        new_state,
                        effective_wave,
                        now_iso,
                        self._canonical(result) if result is not None else row["result_json"],
                        error_text if error_text is not None else row["error_text"],
                        task_id,
                    ),
                )
                conn.commit()

            event_data: Dict[str, Any] = {
                "task_id": task_id,
                "repo_name": row["repo_name"],
                "operation": row["operation"],
                "state": new_state,
                "wave_id": effective_wave,
                "payload_hash": row["payload_hash"],
            }
            if result is not None:
                event_data["result_hash"] = self.sha256_data(result)
            if error_text is not None:
                event_data["error"] = error_text

            block = self._append_ledger_block_unlocked(event_data)

        _emit_log(
            "INFO" if new_state != "FAILED" else "WARN",
            "Micro-task state transition",
            task_id=task_id,
            state=new_state,
            wave_id=effective_wave,
            ledger_index=block["index"],
        )
        return block

    def fetch_batch(self, limit: int) -> List[Dict[str, Any]]:
        with self._lock:
            with self._connect() as conn:
                rows = conn.execute(
                    "SELECT * FROM micro_tasks WHERE state = 'QUEUED' ORDER BY created_at ASC LIMIT ?;",
                    (limit,),
                ).fetchall()
        return [dict(r) for r in rows]

    def verify_chain(self) -> Dict[str, Any]:
        with self._lock:
            blocks = self._read_ledger_unlocked()
        prev = GENESIS_HASH
        for i, blk in enumerate(blocks):
            if blk.get("index") != i:
                return {"valid": False, "index": i, "reason": "index_mismatch"}
            if blk.get("previous_hash") != prev:
                return {"valid": False, "index": i, "reason": "previous_hash_mismatch"}
            ts = blk.get("timestamp", "")
            p_hash = blk.get("payload_hash", "")
            ev = blk.get("event")
            if self.sha256_data(ev) != p_hash:
                return {"valid": False, "index": i, "reason": "payload_hash_mismatch"}
            if self.compute_block_hash(i, ts, p_hash, prev) != blk.get("block_hash"):
                return {"valid": False, "index": i, "reason": "block_hash_mismatch"}
            prev = blk["block_hash"]
        return {"valid": True, "blocks": len(blocks), "tip_hash": prev}
