"""
Advanced caching and retry mechanism for API calls
Handles rate limiting, transient failures, and reduces redundant requests
"""

import time
import functools
import threading
import random
import contextvars
from collections import deque, OrderedDict
from contextlib import contextmanager
from typing import Any, Callable, Dict, Optional, Tuple
from datetime import datetime, timedelta
import json
import os
from utils.logging import log

try:
    from utils.monitoring import record_rate_limit, record_circuit_open
except Exception:
    def record_rate_limit() -> None:
        return None

    def record_circuit_open(name: str) -> None:
        return None


class RateLimitError(Exception):
    """Raised when a request is blocked due to rate limiting/cooldown."""


class CircuitOpenError(Exception):
    """Raised when circuit breaker is open and no cached data is available."""


class RetryBudgetExceeded(Exception):
    """Raised when a request-level retry budget is exhausted."""


def is_rate_limit_error(exc: Exception) -> bool:
    """Best-effort detection for HTTP 429 or rate limiting errors."""
    try:
        status = getattr(getattr(exc, "response", None), "status_code", None)
        if status == 429:
            return True
    except Exception:
        pass
    message = str(exc).lower()
    return "429" in message or "too many requests" in message or "rate limit" in message


class RateLimiter:
    """
    Thread-safe limiter enforcing a minimum interval between calls.
    Shared instances serialize access across multiple functions.
    """

    def __init__(self, min_interval: float = 1.0, jitter: float = 0.0):
        self.min_interval = min_interval
        self.jitter = jitter  # fraction of min_interval
        self._lock = threading.Lock()
        self._last_call = 0.0

    def wait(self) -> None:
        with self._lock:
            now = time.time()
            elapsed = now - self._last_call
            wait_time = self.min_interval - elapsed
            if wait_time > 0:
                jitter_delta = 0.0
                if self.jitter > 0:
                    jitter_delta = random.uniform(-self.jitter, self.jitter) * self.min_interval
                sleep_for = max(0.0, wait_time + jitter_delta)
                time.sleep(sleep_for)
            self._last_call = time.time()


class RetryCoordinator:
    """
    Tracks cooldowns and retry budgets per key to avoid retry amplification.
    """

    def __init__(self, max_retries: int = 3, window_seconds: int = 300):
        self.max_retries = max_retries
        self.window_seconds = window_seconds
        self._retry_timestamps: Dict[str, deque] = {}
        self._cooldowns: Dict[str, float] = {}
        self._lock = threading.Lock()

    def _prune(self, key: str, now: float) -> None:
        dq = self._retry_timestamps.get(key)
        if not dq:
            return
        while dq and (now - dq[0]) > self.window_seconds:
            dq.popleft()

    def can_retry(self, key: str) -> bool:
        now = time.time()
        with self._lock:
            self._prune(key, now)
            dq = self._retry_timestamps.setdefault(key, deque())
            return len(dq) < self.max_retries

    def record_retry(self, key: str) -> None:
        now = time.time()
        with self._lock:
            dq = self._retry_timestamps.setdefault(key, deque())
            dq.append(now)
            self._prune(key, now)

    def set_cooldown(self, key: str, seconds: float) -> None:
        now = time.time()
        with self._lock:
            until = now + seconds
            current = self._cooldowns.get(key, 0.0)
            if until > current:
                self._cooldowns[key] = until

    def in_cooldown(self, key: str) -> bool:
        now = time.time()
        with self._lock:
            until = self._cooldowns.get(key, 0.0)
        return now < until


_retry_coordinator = RetryCoordinator(max_retries=2, window_seconds=300)


class RequestBudget:
    """
    Tracks total attempts across multiple provider calls in a single request.
    """

    def __init__(self, max_attempts: int = 3):
        self.max_attempts = max_attempts
        self.attempts = 0

    def consume(self) -> bool:
        if self.attempts >= self.max_attempts:
            return False
        self.attempts += 1
        return True


_request_budget_var = contextvars.ContextVar("request_budget", default=None)


@contextmanager
def request_budget(max_attempts: int = 3):
    budget = RequestBudget(max_attempts=max_attempts)
    token = _request_budget_var.set(budget)
    try:
        yield budget
    finally:
        _request_budget_var.reset(token)


class CircuitBreaker:
    """
    Simple circuit breaker to short-circuit requests after repeated failures.
    """

    def __init__(
        self,
        name: str,
        failure_threshold: int = 3,
        window_seconds: int = 300,
        recovery_timeout: int = 300,
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.window_seconds = window_seconds
        self.recovery_timeout = recovery_timeout
        self._failures = deque()
        self._state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
        self._opened_until = 0.0
        self._lock = threading.Lock()

    def _prune(self, now: float) -> None:
        while self._failures and (now - self._failures[0]) > self.window_seconds:
            self._failures.popleft()

    def allow_request(self) -> bool:
        now = time.time()
        with self._lock:
            if self._state == "OPEN":
                if now >= self._opened_until:
                    self._state = "HALF_OPEN"
                    return True
                return False
            return True

    def record_success(self) -> None:
        with self._lock:
            self._failures.clear()
            self._state = "CLOSED"

    def record_failure(self, exc: Exception) -> None:
        if not is_rate_limit_error(exc):
            return
        now = time.time()
        with self._lock:
            self._prune(now)
            self._failures.append(now)
            if len(self._failures) >= self.failure_threshold:
                self._state = "OPEN"
                self._opened_until = now + self.recovery_timeout
                log(f"🚫 Circuit OPEN for {self.name} ({self.failure_threshold} rate-limit errors)")
                record_circuit_open(self.name)

    @property
    def state(self) -> str:
        return self._state

    def reset(self) -> None:
        with self._lock:
            self._failures.clear()
            self._state = "CLOSED"
            self._opened_until = 0.0

    def status(self) -> Dict[str, Any]:
        now = time.time()
        with self._lock:
            remaining = max(0.0, self._opened_until - now) if self._state == "OPEN" else 0.0
            return {
                "state": self._state,
                "opened_until": self._opened_until,
                "cooldown_remaining": round(remaining, 2),
            }

class APICache:
    """
    In-memory cache with TTL (time-to-live) for API responses.
    Automatically expires old entries.
    """
    
    def __init__(
        self,
        cache_dir: str = "/tmp/asset_analysis_cache",
        default_ttl: int = 3600,
        enable_disk: bool = True,
        enable_memory: bool = True,
        max_entries: int = 5000,
    ):
        self.memory_cache: "OrderedDict[str, tuple]" = OrderedDict()  # (value, cached_at, ttl)
        self.cache_dir = cache_dir
        self.default_ttl = default_ttl
        self.enable_disk = enable_disk
        self.enable_memory = enable_memory
        self.max_entries = max_entries
        self._lock = threading.Lock()
        self.stats = {
            "hits": 0,
            "misses": 0,
            "stale_hits": 0,
            "sets": 0,
            "disk_hits": 0,
            "disk_misses": 0,
        }

        if self.enable_disk:
            os.makedirs(cache_dir, exist_ok=True)
    
    def get(self, key: str, allow_stale: bool = False) -> Optional[Any]:
        """Get value from cache if it exists and hasn't expired."""
        now = time.time()

        if self.enable_memory:
            with self._lock:
                if key in self.memory_cache:
                    value, cached_at, ttl = self.memory_cache[key]
                    if (now - cached_at) < ttl:
                        self.stats["hits"] += 1
                        self.memory_cache.move_to_end(key)
                        return value
                    if allow_stale:
                        self.stats["stale_hits"] += 1
                        self.memory_cache.move_to_end(key)
                        return value
                    # Expired, remove it
                    del self.memory_cache[key]

        # Try to load from disk cache as fallback
        if self.enable_disk:
            loaded = self._load_from_disk(key, allow_stale=allow_stale)
            if loaded is not None:
                value, cached_at, ttl, is_fresh = loaded
                if is_fresh:
                    self.stats["disk_hits"] += 1
                else:
                    self.stats["stale_hits"] += 1
                if self.enable_memory:
                    self.memory_cache[key] = (value, cached_at, ttl)
                return value

        self.stats["misses"] += 1
        if self.enable_disk:
            self.stats["disk_misses"] += 1
        return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Store value in cache with optional TTL override"""
        effective_ttl = ttl if ttl is not None else self.default_ttl
        cached_at = time.time()
        if self.enable_memory:
            with self._lock:
                self.memory_cache[key] = (value, cached_at, effective_ttl)
                self.memory_cache.move_to_end(key)
                while len(self.memory_cache) > self.max_entries:
                    self.memory_cache.popitem(last=False)
        if self.enable_disk:
            self._save_to_disk(key, value, cached_at, effective_ttl)
        self.stats["sets"] += 1
    
    def _load_from_disk(self, key: str, allow_stale: bool = False) -> Optional[Tuple[Any, float, int, bool]]:
        """Load from disk cache if available"""
        try:
            cache_file = os.path.join(self.cache_dir, f"{key}.json")
            if os.path.exists(cache_file):
                with open(cache_file, 'r') as f:
                    payload = json.load(f)

                # Backward compatibility: old format stored raw value
                if isinstance(payload, dict) and "value" in payload and "cached_at" in payload:
                    value = payload.get("value")
                    cached_at = float(payload.get("cached_at"))
                    ttl = int(payload.get("ttl", self.default_ttl))
                else:
                    value = payload
                    cached_at = os.path.getmtime(cache_file)
                    ttl = self.default_ttl

                is_fresh = (time.time() - cached_at) < ttl
                if is_fresh or allow_stale:
                    return value, cached_at, ttl, is_fresh
        except Exception as e:
            log(f"Disk cache read error: {e}")
        return None
    
    def _save_to_disk(self, key: str, value: Any, cached_at: float, ttl: int) -> None:
        """Persist cache to disk"""
        try:
            cache_file = os.path.join(self.cache_dir, f"{key}.json")
            with open(cache_file, 'w') as f:
                json.dump(
                    {
                        "value": value,
                        "cached_at": cached_at,
                        "ttl": ttl,
                    },
                    f,
                    default=str,
                )
        except Exception as e:
            log(f"Disk cache write error: {e}")
    
    def clear(self) -> None:
        """Clear all caches"""
        with self._lock:
            self.memory_cache.clear()
        if self.enable_disk:
            try:
                for f in os.listdir(self.cache_dir):
                    os.remove(os.path.join(self.cache_dir, f))
            except Exception as e:
                log(f"Cache clear error: {e}")

    def get_stats(self) -> Dict[str, Any]:
        total = self.stats["hits"] + self.stats["misses"]
        hit_rate = (self.stats["hits"] / total) if total else 0.0
        return {
            **self.stats,
            "hit_rate": round(hit_rate, 3),
            "entries": len(self.memory_cache),
            "max_entries": self.max_entries,
        }


# Global cache instance
_api_cache = APICache(max_entries=int(os.getenv("API_CACHE_MAX_ENTRIES", "5000")))


def retry_with_backoff(
    max_attempts: int = 2,
    initial_delay: float = 2.0,
    backoff_factor: float = 2.0,
    exceptions: tuple = (Exception,),
    jitter: float = 0.2,
    retry_key_fn: Optional[Callable[..., Optional[str]]] = None,
    retry_state: RetryCoordinator = _retry_coordinator,
    rate_limit_cooldown_range: Tuple[int, int] = (60, 120),
    retry_on_rate_limit: bool = False,
) -> Callable:
    """
    Decorator for retrying failed API calls with exponential backoff.
    
    Args:
        max_attempts: Maximum number of retry attempts
        initial_delay: Starting delay in seconds (default 1.0)
        backoff_factor: Multiplier for delay between retries (default 2.0)
        exceptions: Tuple of exceptions to catch and retry
    
    Example:
        @retry_with_backoff(max_attempts=3, initial_delay=0.5)
        def fetch_data():
            ...
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            delay = initial_delay
            last_exception = None
            retry_key = retry_key_fn(*args, **kwargs) if retry_key_fn else None

            if retry_key and retry_state.in_cooldown(retry_key):
                raise RateLimitError(f"Cooldown active for {retry_key}")
            
            for attempt in range(1, max_attempts + 1):
                try:
                    budget = _request_budget_var.get()
                    if budget and not budget.consume():
                        raise RetryBudgetExceeded("Request retry budget exhausted")
                    result = func(*args, **kwargs)
                    if attempt > 1:
                        log(f"✅ {func.__name__} succeeded on attempt {attempt}")
                    return result
                except exceptions as e:
                    last_exception = e
                    if is_rate_limit_error(e):
                        cooldown = random.uniform(*rate_limit_cooldown_range)
                        if retry_key:
                            retry_state.set_cooldown(retry_key, cooldown)
                        log(f"⛔ Rate limited {func.__name__}: cooldown {cooldown:.0f}s")
                        record_rate_limit()
                        if retry_on_rate_limit and attempt < max_attempts:
                            time.sleep(cooldown)
                            continue
                        raise RateLimitError(str(e))

                    if attempt < max_attempts:
                        if retry_key and not retry_state.can_retry(retry_key):
                            raise RetryBudgetExceeded(f"Retry budget exceeded for {retry_key}")
                        if retry_key:
                            retry_state.record_retry(retry_key)

                        log(f"⚠️  {func.__name__} attempt {attempt} failed: {e}")
                        jitter_delta = random.uniform(0, delay * jitter) if delay > 0 else 0
                        sleep_for = delay + jitter_delta
                        log(f"   Retrying in {sleep_for:.1f}s...")
                        time.sleep(sleep_for)
                        # Smarter backoff schedule
                        if attempt == 1:
                            delay = 2.0
                        elif attempt == 2:
                            delay = 5.0
                        else:
                            delay *= backoff_factor
                    else:
                        log(f"❌ {func.__name__} failed after {max_attempts} attempts")
            
            # All attempts failed, raise last exception
            raise last_exception
        
        return wrapper
    return decorator


def cached_api_call(
    cache_key_prefix: str = "",
    ttl: int = 3600,
    allow_stale_on_error: bool = True,
    circuit_breaker: Optional[CircuitBreaker] = None,
) -> Callable:
    """
    Decorator for caching API call results with TTL.
    Optionally returns stale cache on error.
    
    Args:
        cache_key_prefix: Prefix for cache key
        ttl: Time-to-live in seconds
        allow_stale_on_error: Return stale cache if API fails
    
    Example:
        @cached_api_call(cache_key_prefix="stock_info", ttl=7200)
        def get_stock_info(symbol):
            ...
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            # Generate cache key from function name and arguments
            cache_key = f"{cache_key_prefix}:{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Check cache first
            cached_value = _api_cache.get(cache_key)
            if cached_value is not None:
                log(f"💾 Cache hit for {func.__name__}")
                return cached_value

            if circuit_breaker and not circuit_breaker.allow_request():
                stale_value = _api_cache.get(cache_key, allow_stale=True)
                if stale_value is not None:
                    log(f"⚠️  Circuit OPEN for {func.__name__}, serving stale cache")
                    return stale_value
                raise CircuitOpenError(f"Circuit open for {func.__name__}")
            
            # Not in cache, call function
            try:
                result = func(*args, **kwargs)
                if circuit_breaker:
                    circuit_breaker.record_success()
                if result:  # Only cache non-empty results
                    _api_cache.set(cache_key, result, ttl)
                return result
            except Exception as e:
                if circuit_breaker:
                    circuit_breaker.record_failure(e)
                log(f"❌ API call failed: {e}")
                # Try to return stale cache if allowed
                if allow_stale_on_error:
                    # Bypass TTL check for stale data
                    stale_value = _api_cache.get(cache_key, allow_stale=True)
                    if stale_value is not None:
                        log(f"⚠️  Returning stale cache for {func.__name__}")
                        return stale_value
                raise
        
        return wrapper
    return decorator


def rate_limited(min_interval: float = 0.5, limiter: Optional[RateLimiter] = None) -> Callable:
    """
    Decorator to enforce minimum interval between function calls.
    Prevents rate limiting by throttling requests.
    
    Args:
        min_interval: Minimum seconds between calls (default 0.5)
    
    Example:
        @rate_limited(min_interval=1.0)
        def fetch_from_api():
            ...
    """
    local_limiter = limiter or RateLimiter(min_interval=min_interval)
    
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            local_limiter.wait()
            return func(*args, **kwargs)
        
        return wrapper
    return decorator


# Combined decorator for comprehensive protection
def robust_api_call(
    cache_key_prefix: str = "",
    ttl: int = 3600,
    max_retries: int = 2,
    min_interval: float = 0.5,
    allow_stale_on_error: bool = True,
    rate_limiter: Optional[RateLimiter] = None,
    retry_key_fn: Optional[Callable[..., Optional[str]]] = None,
    circuit_breaker: Optional[CircuitBreaker] = None,
    retry_on_rate_limit: bool = False,
) -> Callable:
    """
    Combined decorator applying caching, retry logic, and rate limiting.
    
    Example:
        @robust_api_call(
            cache_key_prefix="yf",
            ttl=3600,
            max_retries=3,
            min_interval=1.0
        )
        def get_stock_data(symbol):
            ...
    """
    def decorator(func: Callable) -> Callable:
        # Apply in order: rate_limited -> retry -> cached
        @cached_api_call(cache_key_prefix, ttl, allow_stale_on_error, circuit_breaker=circuit_breaker)
        @retry_with_backoff(
            max_attempts=max_retries,
            initial_delay=2.0,
            backoff_factor=2.0,
            retry_key_fn=retry_key_fn,
            retry_on_rate_limit=retry_on_rate_limit,
        )
        @rate_limited(min_interval, limiter=rate_limiter)
        def wrapped(*args, **kwargs) -> Any:
            return func(*args, **kwargs)
        
        return wrapped
    
    return decorator
