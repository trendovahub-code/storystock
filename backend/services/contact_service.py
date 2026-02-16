import os
from datetime import datetime, timezone
from typing import Any, Dict, Tuple

import requests


def append_contact_submission(
    *,
    name: str,
    email: str,
    message: str,
    source: str = "website",
    ip: str | None = None,
    user_agent: str | None = None,
) -> Tuple[bool, str]:
    """
    Sends contact form data to a Google Apps Script webhook that appends to a sheet.
    """
    webhook_url = os.getenv("CONTACT_WEBHOOK_URL", "").strip()
    if not webhook_url:
        return False, "CONTACT_WEBHOOK_URL is not configured."

    payload: Dict[str, Any] = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "name": name,
        "email": email,
        "message": message,
        "source": source,
        "ip": ip,
        "user_agent": user_agent,
    }

    shared_secret = os.getenv("CONTACT_WEBHOOK_SECRET", "").strip()
    if shared_secret:
        payload["secret"] = shared_secret

    timeout = float(os.getenv("CONTACT_WEBHOOK_TIMEOUT_SECONDS", "8"))
    try:
        response = requests.post(webhook_url, json=payload, timeout=timeout)
    except Exception as exc:
        return False, f"Webhook request failed: {exc}"

    if 200 <= response.status_code < 300:
        return True, "ok"

    body = response.text.strip()
    detail = f"Webhook returned HTTP {response.status_code}"
    if body:
        detail = f"{detail}: {body[:300]}"
    return False, detail

