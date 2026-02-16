"""
Data Merger – single-source architecture.

Fetches all company data from the ScreenerProvider (screener.in) and
assembles it into the unified data_context consumed by the analysis
engines (RatioEngine, StanceEngine, BenchmarkingEngine, LLMOrchestrator).
"""

from datetime import datetime
from typing import Dict, Any, Optional, Set
import threading
import time
import logging

from providers.screener_provider import ScreenerProvider

logger = logging.getLogger(__name__)


class DataMerger:
    _pending_lock = threading.Lock()
    _pending_requests: Dict[str, Dict[str, Any]] = {}
    _coalesce_window = 0.05

    def __init__(self):
        self.screener = ScreenerProvider()

    def merge_stock_data(self, symbol: str, include: Optional[Set[str]] = None) -> Dict[str, Any]:
        """
        Fetches data from screener.in and assembles a unified context.
        Request coalescing prevents duplicate concurrent requests for the same symbol.
        """
        symbol_key = symbol.upper()
        is_owner = False
        with self._pending_lock:
            entry = self._pending_requests.get(symbol_key)
            if entry:
                event = entry["event"]
            else:
                event = threading.Event()
                entry = {"event": event, "result": None, "error": None}
                self._pending_requests[symbol_key] = entry
                is_owner = True

        if not is_owner:
            event.wait()
            if entry["error"]:
                raise entry["error"]
            return entry["result"]

        try:
            time.sleep(self._coalesce_window)
            result = self._build_context(symbol, include)
            entry["result"] = result
            return result
        except Exception as e:
            entry["error"] = e
            raise
        finally:
            entry["event"].set()
            with self._pending_lock:
                self._pending_requests.pop(symbol_key, None)

    def _build_context(self, symbol: str, include: Optional[Set[str]]) -> Dict[str, Any]:
        include_set = {item.lower() for item in include} if include else {
            "profile", "financials", "history", "price"
        }

        need_full = (
            "financials" in include_set
            or "profile" in include_set
            or "basic" in include_set
            or "price" in include_set
        )

        raw: Dict[str, Any] = {}
        if need_full:
            try:
                raw = self.screener.get_full_data(symbol)
            except Exception as e:
                logger.error("[Merger] Screener fetch failed for %s: %s", symbol, e)
                raw = {}

        financials = raw.get("financials", {})
        key_ratios = raw.get("key_ratios", {})
        shareholding = raw.get("shareholding", {})
        price = raw.get("current_price")
        name = raw.get("name")
        description = raw.get("description")
        confidence = raw.get("confidence", 0)

        merged_context: Dict[str, Any] = {
            "symbol": symbol.upper(),
            "profile": {
                "name": name,
                "sector": None,
                "industry": None,
                "description": description,
                "isin": None,
                "listing_date": None,
            },
            "price": {
                "current": price,
                "date": datetime.now().strftime("%d %b %Y"),
                "history": [],
                "currency": "INR",
            },
            "financials": financials,
            "shareholding": shareholding,
            "quality_audit": {
                "screener_available": bool(raw),
                "confidence": confidence,
                "sections_found": raw.get("sections_found", []),
                "scraper_version": raw.get("scraper_version"),
                "scraped_at": raw.get("scraped_at"),
                "source_url": raw.get("source_url"),
            },
            "key_ratios": key_ratios,
        }

        return merged_context
