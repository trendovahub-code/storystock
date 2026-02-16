import redis
import json
import os
import time
from typing import Any, Dict, Optional, Tuple
from functools import wraps
from flask import request, jsonify
from utils.api_resilience import APICache
from utils.monitoring import record_request
from services.analysis_include import parse_include_param
from services.request_scheduler import schedule_task
from services.persistent_cache import PersistentCache
from services.usage_analytics import (
    record_analysis_request_with_client,
    maybe_get_prefetch_symbols,
    popularity_score,
    predict_next_symbols,
)
from services.feature_flags import is_enabled
from utils.logging import log

_MEMORY_TTL_SECONDS = int(os.getenv("MEMORY_CACHE_TTL_SECONDS", "300"))
_MEMORY_CACHE_MAX_ENTRIES = int(os.getenv("MEMORY_CACHE_MAX_ENTRIES", "1000"))
_memory_cache = APICache(
    default_ttl=_MEMORY_TTL_SECONDS,
    enable_disk=False,
    enable_memory=True,
    max_entries=_MEMORY_CACHE_MAX_ENTRIES,
)
_persistent_cache = PersistentCache()

class CacheService:
    _redis_hits = 0
    _redis_misses = 0

    def __init__(self):
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
        try:
            self.client = redis.from_url(redis_url)
            self.client.ping()
            self.enabled = True
        except Exception as e:
            print(f"Redis not available: {e}. Caching disabled.")
            self.enabled = False

    def get(self, key: str):
        data, _cached_at, _ttl = self.get_with_metadata(key)
        return data

    def get_with_metadata(self, key: str) -> Tuple[Optional[Any], Optional[float], Optional[int]]:
        # Layer 1: in-memory cache
        value = _memory_cache.get(key)
        if value is not None:
            return self._unwrap(value)

        # Layer 2: Redis cache
        if not self.enabled:
            return self._get_persistent(key)
        data = self.client.get(key)
        if data:
            CacheService._redis_hits += 1
            return self._unwrap(json.loads(data))
        CacheService._redis_misses += 1
        return self._get_persistent(key)

    def set(self, key: str, value: Any, timeout: int = 3600):
        memory_ttl = min(_MEMORY_TTL_SECONDS, timeout)
        wrapped = self._wrap(value, timeout)
        _memory_cache.set(key, wrapped, ttl=memory_ttl)
        if not self.enabled:
            _persistent_cache.set(key, wrapped, timeout)
            return
        self.client.setex(key, timeout, json.dumps(wrapped))
        _persistent_cache.set(key, wrapped, timeout)

    def get_stats(self) -> Dict[str, Any]:
        memory_stats = _memory_cache.get_stats()
        return {
            "memory": memory_stats,
            "redis_enabled": self.enabled,
            "redis_hits": CacheService._redis_hits,
            "redis_misses": CacheService._redis_misses,
        }

    def _wrap(self, value: Any, ttl: int) -> Dict[str, Any]:
        return {"_cached_at": time.time(), "_ttl": ttl, "_data": value}

    def _unwrap(self, value: Any) -> Tuple[Optional[Any], Optional[float], Optional[int]]:
        if isinstance(value, dict) and "_data" in value and "_cached_at" in value:
            return value.get("_data"), value.get("_cached_at"), value.get("_ttl")
        return value, None, None

    def _get_persistent(self, key: str) -> Tuple[Optional[Any], Optional[float], Optional[int]]:
        persisted = _persistent_cache.get(key)
        if not persisted:
            return None, None, None
        value, cached_at, _expires_at = persisted
        data, wrapped_at, ttl = self._unwrap(value)
        return data, wrapped_at or cached_at, ttl

def cached_stock_data(timeout=3600):
    cache = CacheService()
    stale_ttl = int(os.getenv("ANALYSIS_STALE_TTL_SECONDS", "604800"))
    prefetch_interval = int(os.getenv("PREFETCH_INTERVAL_SECONDS", "3600"))
    prefetch_window = int(os.getenv("PREFETCH_WINDOW_SECONDS", "86400"))
    prefetch_top_n = int(os.getenv("PREFETCH_TOP_N", "5"))
    prefetch_min_requests = int(os.getenv("PREFETCH_MIN_REQUESTS", "3"))
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            start = time.time()
            # Use symbol as cache key
            symbol = kwargs.get('symbol', '').upper()
            if not symbol:
                return f(*args, **kwargs)

            # Check for nocache bypass (admin only)
            if request.args.get('nocache') == 'true':
                admin_token = os.getenv("ADMIN_TOKEN")
                provided_token = request.headers.get("X-Admin-Token")
                if admin_token and provided_token == admin_token:
                    return f(*args, **kwargs)

            # Determine dynamic timeout based on request path
            current_timeout = timeout
            if "benchmarks" in request.path:
                current_timeout = 86400  # 24 hours

            include_param = request.args.get("include", "full").strip().lower()
            include_set = parse_include_param(include_param)
            client_id = request.headers.get("X-Client-Id") or request.remote_addr or ""
            if is_enabled("FEATURE_USAGE_ANALYTICS", key=client_id):
                record_analysis_request_with_client(symbol, include_param, client_id)
            dynamic_timeout = _dynamic_timeout(symbol, include_set, current_timeout)
            cache_key = f"stock_analysis:{symbol}:{include_param}:{current_timeout}"
            cached_val, cached_at, cached_ttl = cache.get_with_metadata(cache_key)
            
            if cached_val:
                if cached_at:
                    age = time.time() - cached_at
                    effective_ttl = cached_ttl or current_timeout
                    if age <= effective_ttl:
                        duration_ms = (time.time() - start) * 1000
                        record_request("analysis", 200, duration_ms)
                        return jsonify(cached_val), 200
                    if age <= stale_ttl and is_enabled("FEATURE_SWR", key=client_id):
                        schedule_task(
                            _refresh_analysis,
                            symbol,
                            include_set,
                            cache_key,
                            dynamic_timeout,
                            priority=2,
                            delay_seconds=5.0,
                            key=f"refresh:{cache_key}",
                        )
                        duration_ms = (time.time() - start) * 1000
                        record_request("analysis", 200, duration_ms)
                        _maybe_schedule_prefetch(
                            prefetch_interval,
                            prefetch_window,
                            prefetch_top_n,
                            prefetch_min_requests,
                            dynamic_timeout,
                            symbol,
                        )
                        return jsonify(cached_val), 200
                else:
                    duration_ms = (time.time() - start) * 1000
                    record_request("analysis", 200, duration_ms)
                    _maybe_schedule_prefetch(
                        prefetch_interval,
                        prefetch_window,
                        prefetch_top_n,
                        prefetch_min_requests,
                        dynamic_timeout,
                        symbol,
                    )
                    return jsonify(cached_val), 200
            
            response = f(*args, **kwargs)
            
            if isinstance(response, tuple):
                data, status = response
                if status == 200:
                    cache.set(cache_key, data, dynamic_timeout)

            duration_ms = (time.time() - start) * 1000
            record_request("analysis", status if isinstance(response, tuple) else 200, duration_ms)
            _maybe_schedule_prefetch(
                prefetch_interval,
                prefetch_window,
                prefetch_top_n,
                prefetch_min_requests,
                dynamic_timeout,
                symbol,
            )
            return response
        return decorated_function
    return decorator


def _refresh_analysis(symbol: str, include_set, cache_key: str, timeout: int) -> None:
    try:
        from engines.merger import DataMerger
        from services.analysis_service import AnalysisService
        merger = DataMerger()
        analysis_service = AnalysisService()
        data_context = merger.merge_stock_data(symbol, include_set)
        include_ai = os.getenv("REFRESH_INCLUDE_AI", "false").strip().lower() in ("1", "true", "yes")
        full_report = analysis_service.perform_full_analysis(data_context, include_ai=include_ai)
        CacheService().set(cache_key, full_report, timeout)
    except Exception as e:
        log(f"Background refresh failed for {symbol}: {e}")


def schedule_analysis_refresh(
    symbol: str,
    include_param: str,
    timeout: int,
    delay_seconds: float = 2.0,
    priority: int = 2,
) -> bool:
    include_set = parse_include_param(include_param)
    cache_key = f"stock_analysis:{symbol}:{include_param}:{timeout}"
    return schedule_task(
        _refresh_analysis,
        symbol,
        include_set,
        cache_key,
        timeout,
        priority=priority,
        delay_seconds=delay_seconds,
        key=f"refresh:{cache_key}",
    )


def _maybe_schedule_prefetch(
    interval_seconds: int,
    window_seconds: int,
    top_n: int,
    min_requests: int,
    timeout: int,
    current_symbol: str,
) -> None:
    if not is_enabled("FEATURE_PREFETCH", key=current_symbol):
        return
    symbols = maybe_get_prefetch_symbols(
        top_n=top_n,
        window_seconds=window_seconds,
        min_requests=min_requests,
        interval_seconds=interval_seconds,
    )
    if not symbols:
        symbols = []
    predictions = predict_next_symbols(current_symbol, top_n=3)
    candidates = list(dict.fromkeys(symbols + predictions))
    if not candidates:
        return
    for symbol in candidates:
        schedule_analysis_refresh(symbol, "basic", timeout, delay_seconds=30.0, priority=3)


def _dynamic_timeout(symbol: str, include_set, base_timeout: int) -> int:
    if not include_set:
        return base_timeout
    score_1h = popularity_score(symbol, 3600)
    score_24h = popularity_score(symbol, 86400)
    if "history" in include_set:
        # More requests => fresher cache for volatile data.
        multiplier = 1.0 - min(score_1h / 20.0, 0.3)
        return max(300, int(base_timeout * multiplier))
    # Stable data can be cached longer for popular symbols.
    multiplier = 1.0 + min(score_24h / 20.0, 0.5)
    return int(base_timeout * multiplier)
