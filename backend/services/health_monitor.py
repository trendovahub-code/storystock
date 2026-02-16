import os
import threading
import time
from services.alerting import evaluate_alerts, emit_alert
from services.cache_service import CacheService
from utils.monitoring import snapshot_metrics
from services.feature_flags import is_enabled
from utils.logging import log


_thread = None
_running = False


def _monitor_loop(interval_seconds: int) -> None:
    global _running
    while _running:
        try:
            metrics = snapshot_metrics()
            cache_stats = CacheService().get_stats()
            alerts = evaluate_alerts(metrics, cache_stats)
            for alert in alerts:
                emit_alert(alert["level"], alert["message"], alert["details"])
        except Exception as e:
            log(f"Health monitor error: {e}")
        time.sleep(interval_seconds)


def start_health_monitor() -> None:
    global _thread, _running
    if _running or not is_enabled("FEATURE_ALERTS"):
        return
    interval = int(os.getenv("ALERT_CHECK_INTERVAL_SECONDS", "60"))
    _running = True
    _thread = threading.Thread(target=_monitor_loop, args=(interval,), daemon=True)
    _thread.start()


def stop_health_monitor() -> None:
    global _running
    _running = False
