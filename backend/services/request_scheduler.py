import threading
import time
import heapq
import random
from typing import Any, Callable, Optional, Tuple


class RequestScheduler:
    def __init__(self):
        self._lock = threading.Lock()
        self._condition = threading.Condition(self._lock)
        self._queue: list[Tuple[float, int, Callable, tuple, dict, Optional[str]]] = []
        self._inflight_keys = set()
        self._running = False
        self._thread: Optional[threading.Thread] = None

    def start(self) -> None:
        with self._lock:
            if self._running:
                return
            self._running = True
            self._thread = threading.Thread(target=self._worker, name="request-scheduler", daemon=True)
            self._thread.start()

    def stop(self) -> None:
        with self._lock:
            self._running = False
            self._condition.notify_all()

    def schedule(
        self,
        fn: Callable,
        *args: Any,
        priority: int = 1,
        delay_seconds: float = 0.0,
        jitter: float = 0.0,
        key: Optional[str] = None,
        **kwargs: Any,
    ) -> bool:
        self.start()
        with self._lock:
            if key and key in self._inflight_keys:
                return False
            run_at = time.time() + max(0.0, delay_seconds)
            if jitter:
                run_at += random.uniform(-jitter, jitter) * max(0.1, delay_seconds or 1.0)
            heapq.heappush(self._queue, (run_at, priority, fn, args, kwargs, key))
            if key:
                self._inflight_keys.add(key)
            self._condition.notify()
            return True

    def _worker(self) -> None:
        while True:
            with self._lock:
                if not self._running and not self._queue:
                    break
                if not self._queue:
                    self._condition.wait(timeout=1.0)
                    continue
                run_at, priority, fn, args, kwargs, key = self._queue[0]
                now = time.time()
                if run_at > now:
                    self._condition.wait(timeout=min(1.0, run_at - now))
                    continue
                heapq.heappop(self._queue)

            try:
                fn(*args, **kwargs)
            except Exception as e:
                print(f"Background task error in {getattr(fn, '__name__', 'task')}: {e}")
            finally:
                if key:
                    with self._lock:
                        self._inflight_keys.discard(key)


_scheduler = RequestScheduler()


def schedule_task(
    fn: Callable,
    *args: Any,
    priority: int = 1,
    delay_seconds: float = 0.0,
    jitter: float = 0.2,
    key: Optional[str] = None,
    **kwargs: Any,
) -> bool:
    return _scheduler.schedule(
        fn,
        *args,
        priority=priority,
        delay_seconds=delay_seconds,
        jitter=jitter,
        key=key,
        **kwargs,
    )
