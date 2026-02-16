import json
import os
import time
import urllib.request
from typing import Any, Dict, List
from utils.logging import log


def _webhook_url() -> str:
    return os.getenv("ALERT_WEBHOOK_URL", "").strip()


def _post_webhook(payload: Dict[str, Any]) -> None:
    url = _webhook_url()
    if not url:
        return
    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=10) as _resp:
            pass
    except Exception as e:
        log(f"Alert webhook failed: {e}")


def emit_alert(level: str, message: str, details: Dict[str, Any]) -> None:
    payload = {
        "level": level,
        "message": message,
        "details": details,
        "timestamp": time.time(),
    }
    log(f"[ALERT][{level}] {message} :: {details}")
    _post_webhook(payload)


def evaluate_alerts(metrics: Dict[str, Any], cache_stats: Dict[str, Any]) -> List[Dict[str, Any]]:
    alerts: List[Dict[str, Any]] = []
    cache_hit_warn = float(os.getenv("ALERT_CACHE_HIT_WARN", "0.7"))
    req_rate_warn = int(os.getenv("ALERT_REQUEST_RATE_WARN", "40"))
    error_rate_crit = float(os.getenv("ALERT_ERROR_RATE_CRIT", "0.1"))

    hit_rate = cache_stats.get("memory", {}).get("hit_rate", 1.0)
    if hit_rate < cache_hit_warn:
        alerts.append({
            "level": "warning",
            "message": "Cache hit rate below threshold",
            "details": {"hit_rate": hit_rate, "threshold": cache_hit_warn},
        })

    req_per_min = metrics.get("rates", {}).get("requests_per_min", 0)
    if req_per_min > req_rate_warn:
        alerts.append({
            "level": "warning",
            "message": "High request rate detected",
            "details": {"requests_per_min": req_per_min, "threshold": req_rate_warn},
        })

    total = metrics.get("counters", {}).get("requests_total", 0)
    errors = metrics.get("counters", {}).get("requests_error_total", 0)
    error_rate = (errors / total) if total else 0.0
    if error_rate > error_rate_crit:
        alerts.append({
            "level": "critical",
            "message": "High error rate detected",
            "details": {"error_rate": round(error_rate, 3), "threshold": error_rate_crit},
        })

    return alerts
