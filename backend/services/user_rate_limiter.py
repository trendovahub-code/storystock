import time
import threading
from collections import defaultdict, deque
from typing import Dict


class UserRateLimiter:
    def __init__(self):
        self._lock = threading.Lock()
        self._events: Dict[str, deque] = defaultdict(deque)

    def allow(self, key: str, limit: int, window_seconds: int) -> bool:
        now = time.time()
        with self._lock:
            dq = self._events[key]
            while dq and (now - dq[0]) > window_seconds:
                dq.popleft()
            if len(dq) >= limit:
                return False
            dq.append(now)
            return True


_limiter = UserRateLimiter()


def check_rate_limit(key: str, limit: int, window_seconds: int) -> bool:
    return _limiter.allow(key, limit, window_seconds)
