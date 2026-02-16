"""
Comprehensive screener.in scraper.
Extracts company profile, key ratios, and full financial tables
(Profit & Loss, Balance Sheet, Cash Flow) from screener.in/company/{code}/consolidated/.

Follows the validation-first methodology described in scrapingskill.md:
  Raw Extraction → Structural Validation → Semantic Labeling → Normalization
"""

import json
import re
import time
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import requests
from bs4 import BeautifulSoup, Tag

from .base import BaseProvider
from utils.api_resilience import RateLimiter, CircuitBreaker, robust_api_call

try:
    from utils.monitoring import record_screener_call
except ImportError:
    def record_screener_call():
        pass

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Scraper version – bump when extraction logic changes
# ---------------------------------------------------------------------------
SCRAPER_VERSION = "3.0.0"

# ---------------------------------------------------------------------------
# Field-name mapping from screener.in table rows → ratio_engine expected keys
# ---------------------------------------------------------------------------

# Profit & Loss row labels → income_statement field names
PL_FIELD_MAP = {
    "sales": "Total Revenue",
    "revenue": "Total Revenue",
    "revenue from operations": "Total Revenue",
    "net sales": "Total Revenue",
    "total income": "Total Revenue",
    "expenses": "Total Expenses",
    "operating profit": "EBIT",
    "ebit": "EBIT",
    "opm %": "OPM_Percent",
    "other income": "Other Income",
    "interest": "Interest Expense",
    "depreciation": "Depreciation",
    "profit before tax": "Profit Before Tax",
    "tax %": "Tax_Percent",
    "net profit": "Net Income",
    "profit after tax": "Net Income",
    "pat": "Net Income",
    "eps in rs": "Basic EPS",
    "eps": "Basic EPS",
    "basic eps": "Basic EPS",
    "eps (rs)": "Basic EPS",
    "dividend payout %": "Dividend Payout Percent",
}

# Balance Sheet row labels → balance_sheet field names
BS_FIELD_MAP = {
    "equity capital": "Equity Capital",
    "share capital": "Equity Capital",
    "reserves": "Reserves",
    "borrowings": "Total Debt",
    "total debt": "Total Debt",
    "other liabilities": "Other Liabilities",
    "total liabilities": "Total Liabilities",
    "fixed assets": "Fixed Assets",
    "cwip": "CWIP",
    "investments": "Investments",
    "other assets": "Other Assets",
    "total assets": "Total Assets",
}

# Cash-flow row labels → cashflow field names
CF_FIELD_MAP = {
    "cash from operating activity": "Operating Cash Flow",
    "cash from operating activities": "Operating Cash Flow",
    "operating activity": "Operating Cash Flow",
    "cash from investing activity": "Investing Cash Flow",
    "cash from investing activities": "Investing Cash Flow",
    "cash from financing activity": "Financing Cash Flow",
    "cash from financing activities": "Financing Cash Flow",
    "net cash flow": "Net Cash Flow",
}

# Ratios table row labels → ratios field names
RATIOS_FIELD_MAP = {
    "debtor days": "Debtor Days",
    "inventory days": "Inventory Days",
    "days payable": "Days Payable",
    "cash conversion cycle": "Cash Conversion Cycle",
    "working capital days": "Working Capital Days",
    "roce %": "ROCE_Percent",
}

# Key-ratio card labels → flat ratio dict keys
RATIO_CARD_MAP = {
    "market cap": "market_cap",
    "current price": "current_price",
    "stock p/e": "pe_ratio",
    "p/e": "pe_ratio",
    "book value": "book_value",
    "dividend yield": "dividend_yield",
    "roce": "roce",
    "roe": "roe",
    "face value": "face_value",
    "high / low": "high_low",
    "debt to equity": "debt_to_equity",
    "promoter holding": "promoter_holding",
}


def _normalise_number(raw: str) -> Optional[float]:
    """Parse a number string like '1,23,456.78' or '₹ 2,450' into a float."""
    if not raw:
        return None
    cleaned = raw.replace("₹", "").replace(",", "").replace("%", "").strip()
    if not cleaned or cleaned == "--":
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


def _normalise_high_low(raw: str) -> Optional[str]:
    """
    Parse 52W high/low text like '1,847 / 1,307' into a canonical '1,847 / 1,307'.
    Returns None when no numeric tokens are found.
    """
    if not raw:
        return None
    cleaned = raw.replace("₹", "").strip()
    if not cleaned or cleaned == "--":
        return None

    nums = re.findall(r"\d[\d,]*(?:\.\d+)?", cleaned)
    if len(nums) >= 2:
        return f"{nums[0]} / {nums[1]}"
    if len(nums) == 1:
        return nums[0]
    return cleaned


def _clean_label(text: str) -> str:
    """Lowercase, collapse whitespace, strip trailing +/- signs."""
    t = re.sub(r"\s+", " ", text).strip().lower()
    t = re.sub(r"[+\-]+$", "", t).strip()
    return t


class ScreenerProvider(BaseProvider):
    """Single-source data provider that scrapes screener.in."""

    _rate_limiter = RateLimiter(min_interval=1.5, jitter=0.25)
    _circuit = CircuitBreaker(
        "screener", failure_threshold=3, window_seconds=300, recovery_timeout=300
    )

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            "Referer": "https://www.screener.in/",
        })
        self.base_url = "https://www.screener.in/company/{code}/consolidated/"

    # ------------------------------------------------------------------
    # Page fetching
    # ------------------------------------------------------------------

    @staticmethod
    def _format_symbol(symbol: str) -> str:
        return symbol.strip().replace(".NS", "")

    def _fetch_page(self, symbol: str) -> Tuple[str, str]:
        """Fetch the HTML page. Returns (html_text, url)."""
        code = self._format_symbol(symbol)
        url = self.base_url.format(code=code)
        resp = self.session.get(url, timeout=15)
        resp.raise_for_status()
        return resp.text, url

    # ------------------------------------------------------------------
    # Section-aware table extraction
    # ------------------------------------------------------------------

    @staticmethod
    def _find_section_tables(soup: BeautifulSoup) -> Dict[str, List[List[List[str]]]]:
        """
        Walk all tables and group them under their nearest preceding heading.
        Returns {section_title: [table_rows, ...]} where each table_rows
        is a list of rows, each row a list of cell strings.
        """
        sections: Dict[str, List[List[List[str]]]] = {}
        for table in soup.find_all("table"):
            heading = table.find_previous(["h2", "h3", "h4"])
            section_name = heading.get_text(strip=True) if heading else "Unknown"

            rows: List[List[str]] = []
            for tr in table.find_all("tr"):
                cells = [c.get_text(strip=True) for c in tr.find_all(["th", "td"])]
                if cells:
                    rows.append(cells)

            if rows:
                sections.setdefault(section_name, []).append(rows)
        return sections

    @staticmethod
    def _table_to_dated_dict(
        rows: List[List[str]], field_map: Dict[str, str]
    ) -> Dict[str, Dict[str, Optional[float]]]:
        """
        Convert a screener table (first row = header with years, subsequent
        rows = label + values) into {date_key: {field: value}} matching the
        format ratio_engine expects.

        The first column is always the row label; remaining columns correspond
        to the year headers.
        """
        if len(rows) < 2:
            return {}

        # First row is the header row with year labels
        header = rows[0]
        # Columns 1..N hold year strings like "Mar 2024", "Mar 2023", ...
        year_columns = header[1:]

        # Build date keys from year column headers (e.g. "Mar 2024" → "2024-03-31")
        date_keys: List[Optional[str]] = []
        for col_label in year_columns:
            dk = _parse_screener_date(col_label)
            date_keys.append(dk)

        result: Dict[str, Dict[str, Optional[float]]] = {}
        for dk in date_keys:
            if dk:
                result[dk] = {}

        for row in rows[1:]:
            if not row:
                continue
            label = _clean_label(row[0])
            mapped_field = field_map.get(label)
            if not mapped_field:
                continue

            for i, cell in enumerate(row[1:]):
                if i >= len(date_keys) or not date_keys[i]:
                    continue
                dk = date_keys[i]
                val = _normalise_number(cell)
                result[dk][mapped_field] = val

        return result

    # ------------------------------------------------------------------
    # Profile extraction helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_name(soup: BeautifulSoup) -> Optional[str]:
        h1 = soup.find("h1")
        if h1:
            return h1.get_text(strip=True)
        return None

    @staticmethod
    def _extract_description(soup: BeautifulSoup) -> Optional[str]:
        meta = soup.find("meta", {"name": "description"})
        if meta and meta.get("content"):
            return meta["content"].strip()
        desc_el = soup.select_one(".company-description p")
        if desc_el:
            return desc_el.get_text(strip=True)
        return None

    def _extract_key_ratios(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """
        Extract summary ratio cards from .company-ratios section.
        Returns a flat dict like {"market_cap": 123456, "pe_ratio": 25.0, ...}.
        """
        ratios: Dict[str, Any] = {}

        # Method 1: .company-ratios cards (h4 + p pairs)
        for card in soup.select(".company-ratios .card"):
            key_el = card.find("h4")
            val_el = card.find("p")
            if key_el and val_el:
                label = _clean_label(key_el.get_text(strip=True))
                mapped = RATIO_CARD_MAP.get(label)
                if mapped:
                    raw_val = val_el.get_text(" ", strip=True)
                    if mapped == "high_low":
                        parsed = _normalise_high_low(raw_val)
                    else:
                        parsed = _normalise_number(raw_val)
                    if parsed is not None:
                        ratios[mapped] = parsed

        # Method 2: li-based key-value pairs (.company-info li or #top-ratios li)
        for li in soup.select("li"):
            spans = li.find_all("span")
            if len(spans) >= 2:
                label = _clean_label(spans[0].get_text(strip=True).rstrip(":"))
                mapped = RATIO_CARD_MAP.get(label)
                if mapped and mapped not in ratios:
                    raw_val = " ".join(s.get_text(" ", strip=True) for s in spans[1:])
                    if mapped == "high_low":
                        parsed = _normalise_high_low(raw_val)
                    else:
                        parsed = _normalise_number(spans[-1].get_text(strip=True))
                    if parsed is not None:
                        ratios[mapped] = parsed

        return ratios

    def _extract_company_details(self, soup: BeautifulSoup) -> Dict[str, str]:
        """Extract key-value pairs from .company-bullets li elements."""
        details: Dict[str, str] = {}
        for li in soup.select(".company-bullets li"):
            text = li.get_text(" ", strip=True)
            if ":" in text:
                k, v = text.split(":", 1)
                details[k.strip()] = v.strip()
        return details

    def _extract_shareholding(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """
        Extract the latest shareholding pattern from the Shareholding Pattern
        table on screener.in.
        Returns {"Promoters": %, "FIIs": %, "DIIs": %, "Government": %,
                 "Public": %, "No. of Shareholders": int, "as_of": "Mar 2024"}.
        """
        shareholding: Dict[str, Any] = {}

        # The shareholding table lives under a heading containing "shareholding"
        for table in soup.find_all("table"):
            heading = table.find_previous(["h2", "h3", "h4"])
            if not heading:
                continue
            if "shareholding" not in heading.get_text(strip=True).lower():
                continue

            rows = []
            for tr in table.find_all("tr"):
                cells = [c.get_text(strip=True) for c in tr.find_all(["th", "td"])]
                if cells:
                    rows.append(cells)
            if len(rows) < 2:
                continue

            # Header row has date columns; use the latest (last) column
            header = rows[0]
            if len(header) < 2:
                continue
            latest_col_idx = len(header) - 1
            latest_date = header[latest_col_idx]

            label_map = {
                "promoters": "Promoters",
                "pledged": "Promoter Pledge",
                "fiis": "FIIs",
                "fii / fpi": "FIIs",
                "diis": "DIIs",
                "dii": "DIIs",
                "government": "Government",
                "public": "Public",
                "no. of shareholders": "No. of Shareholders",
                "others": "Others",
            }

            for row in rows[1:]:
                if not row:
                    continue
                label = _clean_label(row[0])
                mapped = label_map.get(label)
                if mapped and latest_col_idx < len(row):
                    val = _normalise_number(row[latest_col_idx])
                    if val is not None:
                        shareholding[mapped] = val

            if shareholding:
                shareholding["as_of"] = latest_date
            break  # Only need the first shareholding table

        return shareholding

    def _extract_price(self, soup: BeautifulSoup, raw_html: str) -> Optional[float]:
        """Extract current price from JSON-LD or page text."""
        for script in soup.select('script[type="application/ld+json"]'):
            text = script.string
            if not text:
                continue
            try:
                payload = json.loads(text)
            except json.JSONDecodeError:
                continue
            items = payload if isinstance(payload, list) else [payload]
            for entry in items:
                if isinstance(entry, dict):
                    offers = entry.get("offers")
                    if isinstance(offers, dict) and offers.get("price") is not None:
                        val = _normalise_number(str(offers["price"]))
                        if val is not None:
                            return val

        match = re.search(r"₹\s*([\d,]+(?:\.\d+)?)", raw_html)
        if match:
            return _normalise_number(match.group(1))
        return None

    # ------------------------------------------------------------------
    # Financial table extraction with field mapping
    # ------------------------------------------------------------------

    def _extract_financials_from_sections(
        self,
        sections: Dict[str, List[List[List[str]]]],
        key_ratios: Dict[str, Any],
    ) -> Dict[str, Dict[str, Dict[str, Optional[float]]]]:
        """
        Given the section-grouped tables, identify P&L, Balance Sheet,
        Cash Flow, and Ratios sections and convert them to the format
        ratio_engine expects.
        """
        income_statement: Dict[str, Dict[str, Optional[float]]] = {}
        balance_sheet: Dict[str, Dict[str, Optional[float]]] = {}
        cashflow: Dict[str, Dict[str, Optional[float]]] = {}
        ratios_table: Dict[str, Dict[str, Optional[float]]] = {}

        for section_name, tables in sections.items():
            sn = section_name.lower()
            for rows in tables:
                if ("profit" in sn and "loss" in sn) or sn == "income statement":
                    dated = self._table_to_dated_dict(rows, PL_FIELD_MAP)
                    _merge_dated(income_statement, dated)
                elif "balance" in sn and "sheet" in sn:
                    dated = self._table_to_dated_dict(rows, BS_FIELD_MAP)
                    _merge_dated(balance_sheet, dated)
                elif "cash" in sn and "flow" in sn:
                    dated = self._table_to_dated_dict(rows, CF_FIELD_MAP)
                    _merge_dated(cashflow, dated)
                elif "ratio" in sn:
                    dated = self._table_to_dated_dict(rows, RATIOS_FIELD_MAP)
                    _merge_dated(ratios_table, dated)

        # -- Post-process income statement: derive Gross Profit ----------------
        for dk, fields in income_statement.items():
            revenue = fields.get("Total Revenue")
            expenses = fields.get("Total Expenses")
            if revenue is not None and expenses is not None:
                fields.setdefault("Gross Profit", revenue - expenses)

        # -- Post-process balance sheet: derive composite fields ---------------
        face_value = key_ratios.get("face_value")

        for dk, fields in balance_sheet.items():
            eq_cap = fields.get("Equity Capital")
            reserves = fields.get("Reserves")

            # Stockholders Equity = Equity Capital + Reserves
            if eq_cap is not None or reserves is not None:
                fields.setdefault(
                    "Stockholders Equity",
                    (eq_cap or 0) + (reserves or 0),
                )

            # Retained Earnings ≈ Reserves (best approximation from screener)
            if reserves is not None:
                fields.setdefault("Retained Earnings", reserves)

            # Long Term Debt ≈ Total Debt (screener doesn't split ST/LT)
            if "Total Debt" in fields:
                fields.setdefault("Long Term Debt", fields["Total Debt"])

            # Current Assets ≈ Other Assets (screener's "Other Assets"
            # includes receivables, cash, inventories)
            if "Other Assets" in fields:
                fields.setdefault("Current Assets", fields["Other Assets"])

            # Current Liabilities ≈ Other Liabilities (screener's
            # "Other Liabilities" includes current payables)
            if "Other Liabilities" in fields:
                fields.setdefault("Current Liabilities", fields["Other Liabilities"])

            # Alias for engine compatibility
            if "Total Liabilities" in fields:
                fields.setdefault(
                    "Total Liabilities Net Minority Interest",
                    fields["Total Liabilities"],
                )

            # Ordinary Shares Number = Equity Capital (Cr) * 10^7 / Face Value (Rs)
            # Equity capital is in Crores; face value is per-share in Rs
            if eq_cap is not None and face_value and face_value > 0:
                shares = eq_cap * 1e7 / face_value
                fields.setdefault("Ordinary Shares Number", shares)

        return {
            "income_statement": income_statement,
            "balance_sheet": balance_sheet,
            "cashflow": cashflow,
            "ratios_table": ratios_table,
        }

    # ------------------------------------------------------------------
    # Confidence scoring
    # ------------------------------------------------------------------

    @staticmethod
    def _compute_confidence(
        financials: Dict[str, Any],
        name: Optional[str],
        price: Optional[float],
    ) -> int:
        """
        Score 0-100 reflecting data completeness.
        """
        score = 0
        if name:
            score += 10
        if price is not None:
            score += 10

        inc = financials.get("income_statement", {})
        bs = financials.get("balance_sheet", {})
        cf = financials.get("cashflow", {})

        if inc:
            score += 20
            latest_key = sorted(inc.keys(), reverse=True)[0] if inc else None
            if latest_key:
                latest = inc[latest_key]
                if latest.get("Total Revenue") is not None:
                    score += 5
                if latest.get("Net Income") is not None:
                    score += 5
                if latest.get("EBIT") is not None:
                    score += 5
            # Bonus: enough periods for growth trends
            if len(inc) >= 3:
                score += 5
        if bs:
            score += 15
            latest_key = sorted(bs.keys(), reverse=True)[0] if bs else None
            if latest_key:
                latest = bs[latest_key]
                if latest.get("Total Assets") is not None:
                    score += 5
                if latest.get("Stockholders Equity") is not None:
                    score += 5
                if latest.get("Ordinary Shares Number") is not None:
                    score += 5
        if cf:
            score += 10

        return min(score, 100)

    # ------------------------------------------------------------------
    # Public API (BaseProvider interface)
    # ------------------------------------------------------------------

    @robust_api_call(
        cache_key_prefix="screener_full",
        ttl=3600,
        max_retries=2,
        min_interval=1.5,
        rate_limiter=_rate_limiter,
        circuit_breaker=_circuit,
    )
    def get_full_data(self, symbol: str) -> Dict[str, Any]:
        """
        Single-call method that fetches and returns all available data
        for a company: profile, ratios, financials, confidence score.
        """
        record_screener_call()
        html, url = self._fetch_page(symbol)
        soup = BeautifulSoup(html, "html.parser")

        name = self._extract_name(soup)
        description = self._extract_description(soup)
        price = self._extract_price(soup, html)
        key_ratios = self._extract_key_ratios(soup)
        company_details = self._extract_company_details(soup)

        # Section-aware table extraction
        sections = self._find_section_tables(soup)
        financials = self._extract_financials_from_sections(sections, key_ratios)

        # Shareholding pattern
        shareholding = self._extract_shareholding(soup)

        # Use key_ratios price if page-level extraction failed
        if price is None and key_ratios.get("current_price") is not None:
            price = key_ratios["current_price"]

        confidence = self._compute_confidence(financials, name, price)

        # Log audit info
        section_names = list(sections.keys())
        inc_periods = len(financials.get("income_statement", {}))
        bs_periods = len(financials.get("balance_sheet", {}))
        cf_periods = len(financials.get("cashflow", {}))
        ratios_periods = len(financials.get("ratios_table", {}))
        logger.info(
            "[Screener] symbol=%s confidence=%d sections=%s "
            "inc_periods=%d bs_periods=%d cf_periods=%d "
            "ratios_periods=%d shareholding_fields=%d url=%s",
            symbol, confidence, section_names,
            inc_periods, bs_periods, cf_periods,
            ratios_periods, len(shareholding), url,
        )

        return {
            "name": name,
            "description": description,
            "current_price": price,
            "key_ratios": key_ratios,
            "company_details": company_details,
            "financials": financials,
            "shareholding": shareholding,
            "sections_found": section_names,
            "confidence": confidence,
            "source_url": url,
            "scraper_version": SCRAPER_VERSION,
            "scraped_at": datetime.utcnow().isoformat(),
        }

    def get_stock_info(self, symbol: str) -> Dict[str, Any]:
        data = self.get_full_data(symbol)
        return {
            "name": data.get("name"),
            "description": data.get("description"),
            "sector": None,
            "industry": None,
            "market_cap": (data.get("key_ratios") or {}).get("market_cap"),
            "current_price": data.get("current_price"),
            "currency": "INR",
            "source": "screener",
        }

    def get_financials(self, symbol: str) -> Dict[str, Any]:
        data = self.get_full_data(symbol)
        return data.get("financials", {})

    def get_price_history(self, symbol: str, period: str = "1y") -> Dict[str, Any]:
        # screener.in does not provide historical price series
        return {"history": [], "source": "screener"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_screener_date(col_label: str) -> Optional[str]:
    """
    Convert a screener column header like 'Mar 2024' or 'Dec 2023' into
    an approximate date string 'YYYY-MM-DD'.
    """
    col_label = col_label.strip()
    if not col_label:
        return None

    month_map = {
        "jan": "01", "feb": "02", "mar": "03", "apr": "04",
        "may": "05", "jun": "06", "jul": "07", "aug": "08",
        "sep": "09", "oct": "10", "nov": "11", "dec": "12",
    }

    # Pattern: "Mar 2024"
    m = re.match(r"([A-Za-z]{3})\s+(\d{4})", col_label)
    if m:
        month_str = m.group(1).lower()
        year = m.group(2)
        mm = month_map.get(month_str)
        if mm:
            # Use last day of month as approximate
            if mm in ("01", "03", "05", "07", "08", "10", "12"):
                dd = "31"
            elif mm == "02":
                dd = "28"
            else:
                dd = "30"
            return f"{year}-{mm}-{dd}"

    # Pattern: plain year "2024"
    m2 = re.match(r"^(\d{4})$", col_label)
    if m2:
        return f"{m2.group(1)}-03-31"

    # TTM or trailing
    if "ttm" in col_label.lower():
        return None

    return None


def _merge_dated(
    target: Dict[str, Dict[str, Optional[float]]],
    source: Dict[str, Dict[str, Optional[float]]],
):
    """Merge source dated dict into target, preferring existing values."""
    for dk, fields in source.items():
        if dk not in target:
            target[dk] = {}
        for field, val in fields.items():
            if field not in target[dk] or target[dk][field] is None:
                target[dk][field] = val
