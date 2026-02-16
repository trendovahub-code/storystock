from services.request_scheduler import schedule_task
from services.health_monitor import start_health_monitor
from services.maintenance import start_maintenance
from services.feature_flags import is_enabled


_started = False


def start_background_jobs() -> None:
    global _started
    if _started:
        return
    _started = True
    # Ensure scheduler thread is initialized
    schedule_task(lambda: None, delay_seconds=0.0, key="noop")
    if is_enabled("FEATURE_ALERTS"):
        start_health_monitor()
    if is_enabled("FEATURE_MAINTENANCE"):
        start_maintenance()
