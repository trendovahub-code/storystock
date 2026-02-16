import time
import threading
from collections import defaultdict, deque
from typing import Any, Dict, Optional


class MetricsStore:
    def __init__(self, max_events: int = 5000, max_timings: int = 500):
        self._lock = threading.Lock()
        self._counters = defaultdict(int)
        self._events = defaultdict(lambda: deque(maxlen=max_events))
        self._timings = defaultdict(lambda: deque(maxlen=max_timings))
        self._gauges: Dict[str, Any] = {}

    def inc(self, key: str, amount: int = 1, record_event: bool = False) -> None:
        now = time.time()
        with self._lock:
            self._counters[key] += amount
            if record_event:
                self._events[key].append(now)

    def observe(self, key: str, value: float) -> None:
        with self._lock:
            self._timings[key].append(value)

    def set_gauge(self, key: str, value: Any) -> None:
        with self._lock:
            self._gauges[key] = value

    def _rate(self, key: str, window: int) -> int:
        now = time.time()
        dq = self._events.get(key)
        if not dq:
            return 0
        return sum(1 for ts in dq if (now - ts) <= window)

    def snapshot(self) -> Dict[str, Any]:
        with self._lock:
            counters = dict(self._counters)
            gauges = dict(self._gauges)
            timings = {k: list(v) for k, v in self._timings.items()}
            events = {k: list(v) for k, v in self._events.items()}

        timing_stats: Dict[str, Dict[str, Optional[float]]] = {}
        for key, values in timings.items():
            if not values:
                timing_stats[key] = {"avg": None, "p95": None, "max": None}
                continue
            sorted_vals = sorted(values)
            count = len(sorted_vals)
            p95_index = int(round(0.95 * (count - 1)))
            timing_stats[key] = {
                "avg": round(sum(sorted_vals) / count, 2),
                "p95": round(sorted_vals[p95_index], 2),
                "max": round(sorted_vals[-1], 2),
            }

        rates = {
            "requests_per_min": self._rate("requests_total", 60),
            "requests_per_hour": self._rate("requests_total", 3600),
            "screener_calls_per_min": self._rate("screener_calls_total", 60),
            "screener_calls_per_hour": self._rate("screener_calls_total", 3600),
        }

        return {
            "counters": counters,
            "gauges": gauges,
            "timings": timing_stats,
            "rates": rates,
            "events_tracked": list(events.keys()),
        }


_metrics = MetricsStore()


def inc_counter(key: str, amount: int = 1, record_event: bool = False) -> None:
    _metrics.inc(key, amount=amount, record_event=record_event)


def observe_timing(key: str, value_ms: float) -> None:
    _metrics.observe(key, value_ms)


def set_gauge(key: str, value: Any) -> None:
    _metrics.set_gauge(key, value)


def record_request(endpoint: str, status: int, duration_ms: float) -> None:
    inc_counter("requests_total", record_event=True)
    inc_counter(f"requests_{endpoint}_total", record_event=True)
    observe_timing(f"latency_{endpoint}_ms", duration_ms)
    if status >= 500:
        inc_counter("requests_error_total")
        inc_counter(f"requests_{endpoint}_error_total")


def record_screener_call() -> None:
    inc_counter("screener_calls_total", record_event=True)


def record_rate_limit() -> None:
    inc_counter("rate_limit_total", record_event=True)


def record_circuit_open(name: str) -> None:
    inc_counter("circuit_open_total")
    inc_counter(f"circuit_open_{name}_total")


def snapshot_metrics() -> Dict[str, Any]:
    return _metrics.snapshot()
