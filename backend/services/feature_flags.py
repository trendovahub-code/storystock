import hashlib
import os


def _flag_value(name: str) -> str:
    return os.getenv(name, "").strip().lower()


def is_enabled(flag: str, key: str | None = None) -> bool:
    """
    Feature flags support:
    - FLAG=true/false
    - FLAG_PERCENT=0-100 with optional key for deterministic rollout
    """
    value = _flag_value(flag)
    if value in ("1", "true", "yes", "on"):
        return True
    if value in ("0", "false", "no", "off"):
        return False

    percent_key = f"{flag}_PERCENT"
    percent_raw = _flag_value(percent_key)
    if not percent_raw:
        return False
    try:
        percent = max(0, min(100, int(percent_raw)))
    except ValueError:
        return False
    if percent == 0:
        return False
    if percent == 100:
        return True
    if not key:
        return False
    digest = hashlib.md5(key.encode("utf-8")).hexdigest()
    bucket = int(digest[:2], 16) % 100
    return bucket < percent
