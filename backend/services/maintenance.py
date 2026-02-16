import os
import threading
import time
from services.persistent_cache import PersistentCache
from services.cache_service import schedule_analysis_refresh
from services.usage_analytics import maybe_get_prefetch_symbols
from services.feature_flags import is_enabled
from utils.logging import log


_thread = None
_running = False


def _loop() -> None:
    cleanup_interval = int(os.getenv("CACHE_CLEANUP_INTERVAL_SECONDS", "21600"))  # 6 hours
    prefetch_interval = int(os.getenv("PREFETCH_INTERVAL_SECONDS", "3600"))
    prefetch_window = int(os.getenv("PREFETCH_WINDOW_SECONDS", "86400"))
    prefetch_top_n = int(os.getenv("PREFETCH_TOP_N", "5"))
    prefetch_min_requests = int(os.getenv("PREFETCH_MIN_REQUESTS", "3"))
    cache = PersistentCache()
    last_cleanup = 0.0

    while _running:
        now = time.time()
        if now - last_cleanup >= cleanup_interval:
            try:
                removed = cache.cleanup()
                if removed:
                    log(f"Cache cleanup removed {removed} entries")
            except Exception as e:
                log(f"Cache cleanup failed: {e}")
            last_cleanup = now

        if is_enabled("FEATURE_PREFETCH"):
            symbols = maybe_get_prefetch_symbols(
                top_n=prefetch_top_n,
                window_seconds=prefetch_window,
                min_requests=prefetch_min_requests,
                interval_seconds=prefetch_interval,
            )
            for symbol in symbols:
                schedule_analysis_refresh(symbol, "basic", 3600, delay_seconds=30.0)

        time.sleep(30)


def start_maintenance() -> None:
    global _thread, _running
    if _running:
        return
    _running = True
    _thread = threading.Thread(target=_loop, daemon=True, name="maintenance-loop")
    _thread.start()


def stop_maintenance() -> None:
    global _running
    _running = False
