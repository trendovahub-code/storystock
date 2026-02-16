import time
import threading
from collections import defaultdict, deque
from typing import Any, Dict, List, Optional, Tuple


class UsageAnalytics:
    def __init__(self, max_events: int = 10000):
        self._lock = threading.Lock()
        self._events = deque(maxlen=max_events)  # (ts, symbol, include_param)
        self._symbol_counts = defaultdict(int)
        self._include_counts = defaultdict(int)
        self._hour_counts = defaultdict(int)
        self._last_prefetch_at = 0.0
        self._last_seen: Dict[str, str] = {}
        self._transitions = defaultdict(lambda: defaultdict(int))

    def record(self, symbol: str, include_param: str, client_id: str | None = None) -> None:
        now = time.time()
        symbol = symbol.upper().strip()
        include_param = include_param.strip().lower() if include_param else "full"
        with self._lock:
            self._events.append((now, symbol, include_param))
            self._symbol_counts[symbol] += 1
            self._include_counts[include_param] += 1
            hour = time.localtime(now).tm_hour
            self._hour_counts[hour] += 1
            if client_id:
                prev = self._last_seen.get(client_id)
                if prev and prev != symbol:
                    self._transitions[prev][symbol] += 1
                self._last_seen[client_id] = symbol

    def _top_symbols(self, window_seconds: int, limit: int) -> List[Tuple[str, int]]:
        now = time.time()
        counts = defaultdict(int)
        with self._lock:
            for ts, symbol, _include in self._events:
                if (now - ts) <= window_seconds:
                    counts[symbol] += 1
        ranked = sorted(counts.items(), key=lambda item: item[1], reverse=True)
        return ranked[:limit]

    def popularity_score(self, symbol: str, window_seconds: int = 86400) -> int:
        symbol = symbol.upper().strip()
        now = time.time()
        score = 0
        with self._lock:
            for ts, sym, _include in self._events:
                if sym != symbol:
                    continue
                if (now - ts) <= window_seconds:
                    score += 1
        return score

    def ranked_by_score(self, limit: int = 10) -> List[Tuple[str, float]]:
        now = time.time()
        scores = defaultdict(float)
        with self._lock:
            for ts, symbol, _include in self._events:
                age = now - ts
                if age <= 3600:
                    weight = 3.0
                elif age <= 6 * 3600:
                    weight = 2.0
                elif age <= 24 * 3600:
                    weight = 1.0
                else:
                    continue
                scores[symbol] += weight
        ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
        return ranked[:limit]

    def predict_next(self, symbol: str, top_n: int = 3) -> List[Tuple[str, int]]:
        symbol = symbol.upper().strip()
        with self._lock:
            options = self._transitions.get(symbol, {})
            ranked = sorted(options.items(), key=lambda item: item[1], reverse=True)
            return ranked[:top_n]

    def summary(self, window_seconds: int = 86400, top_n: int = 10) -> Dict[str, Any]:
        with self._lock:
            include_counts = dict(self._include_counts)
            hour_counts = {str(k): v for k, v in self._hour_counts.items()}
            total_requests = sum(self._symbol_counts.values())
        top_symbols = self._top_symbols(window_seconds, top_n)
        scored = self.ranked_by_score(top_n)
        return {
            "total_requests": total_requests,
            "top_symbols": top_symbols,
            "top_symbols_weighted": scored,
            "include_usage": include_counts,
            "hourly_distribution": hour_counts,
            "window_seconds": window_seconds,
        }

    def maybe_get_prefetch_symbols(
        self,
        top_n: int,
        window_seconds: int,
        min_requests: int,
        interval_seconds: int,
    ) -> List[str]:
        now = time.time()
        with self._lock:
            if (now - self._last_prefetch_at) < interval_seconds:
                return []
            self._last_prefetch_at = now
        ranked = self.ranked_by_score(top_n)
        return [symbol for symbol, score in ranked if score >= min_requests]


_analytics = UsageAnalytics()


def record_analysis_request(symbol: str, include_param: str) -> None:
    _analytics.record(symbol, include_param)


def record_analysis_request_with_client(symbol: str, include_param: str, client_id: str | None) -> None:
    _analytics.record(symbol, include_param, client_id=client_id)


def usage_summary(window_seconds: int = 86400, top_n: int = 10) -> Dict[str, Any]:
    return _analytics.summary(window_seconds=window_seconds, top_n=top_n)


def maybe_get_prefetch_symbols(
    top_n: int,
    window_seconds: int,
    min_requests: int,
    interval_seconds: int,
) -> List[str]:
    return _analytics.maybe_get_prefetch_symbols(top_n, window_seconds, min_requests, interval_seconds)


def popularity_score(symbol: str, window_seconds: int = 86400) -> int:
    return _analytics.popularity_score(symbol, window_seconds)


def predict_next_symbols(symbol: str, top_n: int = 3) -> List[str]:
    ranked = _analytics.predict_next(symbol, top_n)
    return [sym for sym, _count in ranked]
