import os
import json
import sqlite3
import threading
import time
from typing import Any, Optional, Tuple


class PersistentCache:
    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
            os.makedirs(base_dir, exist_ok=True)
            db_path = os.path.join(base_dir, "cache.sqlite")
        self.db_path = db_path
        self._lock = threading.Lock()
        self._init_db()

    def _init_db(self) -> None:
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS cache_entries (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    cached_at REAL NOT NULL,
                    expires_at REAL NOT NULL
                )
                """
            )
            conn.commit()

    def get(self, key: str) -> Optional[Tuple[Any, float, float]]:
        with self._lock, sqlite3.connect(self.db_path) as conn:
            row = conn.execute(
                "SELECT value, cached_at, expires_at FROM cache_entries WHERE key = ?",
                (key,),
            ).fetchone()
        if not row:
            return None
        value_json, cached_at, expires_at = row
        try:
            value = json.loads(value_json)
        except Exception:
            value = None
        return value, cached_at, expires_at

    def set(self, key: str, value: Any, ttl: int) -> None:
        now = time.time()
        expires_at = now + ttl
        payload = json.dumps(value)
        with self._lock, sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                INSERT INTO cache_entries (key, value, cached_at, expires_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(key) DO UPDATE SET
                    value=excluded.value,
                    cached_at=excluded.cached_at,
                    expires_at=excluded.expires_at
                """,
                (key, payload, now, expires_at),
            )
            conn.commit()

    def cleanup(self) -> int:
        now = time.time()
        with self._lock, sqlite3.connect(self.db_path) as conn:
            cur = conn.execute("DELETE FROM cache_entries WHERE expires_at < ?", (now,))
            conn.commit()
            return cur.rowcount
