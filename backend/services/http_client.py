import json
import os
import random
import time
import urllib.request
from typing import Dict, Optional


_DEFAULT_USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]


def _get_user_agents() -> list[str]:
    raw = os.getenv("HTTP_USER_AGENTS", "").strip()
    if not raw:
        return _DEFAULT_USER_AGENTS
    return [ua.strip() for ua in raw.split("||") if ua.strip()]


def _build_proxy_handler() -> urllib.request.ProxyHandler | None:
    proxies: dict[str, str] = {}
    for key in ("HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy"):
        value = os.getenv(key)
        if value:
            proto = key.split("_", 1)[0].lower()
            proxies[proto] = value

    if not proxies:
        return None

    no_proxy = os.getenv("NO_PROXY") or os.getenv("no_proxy")
    if no_proxy:
        os.environ["no_proxy"] = no_proxy

    return urllib.request.ProxyHandler(proxies)


def _get_proxies() -> list[str]:
    raw = os.getenv("HTTP_PROXIES", "").strip()
    if not raw:
        return []
    return [proxy.strip() for proxy in raw.split(",") if proxy.strip()]


def fetch_json(url: str, timeout: int = 20, delay_range: Optional[tuple[float, float]] = None) -> Dict:
    if delay_range:
        time.sleep(random.uniform(delay_range[0], delay_range[1]))

    headers = {
        "User-Agent": random.choice(_get_user_agents()),
        "Accept": "application/json,text/plain,*/*",
    }
    request = urllib.request.Request(url, headers=headers)

    proxies = _get_proxies()
    handler = _build_proxy_handler()
    if handler:
        opener = urllib.request.build_opener(handler)
    else:
        opener = urllib.request.build_opener()

    if proxies:
        proxy = random.choice(proxies)
        opener = urllib.request.build_opener(
            urllib.request.ProxyHandler({"http": proxy, "https": proxy})
        )

    with opener.open(request, timeout=timeout) as resp:
        data = resp.read().decode("utf-8")
    return json.loads(data)
