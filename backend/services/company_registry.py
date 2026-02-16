import csv
import os
from typing import Dict, List, Optional


class CompanyRegistry:
    """
    In-memory company registry loaded from screener_company_symbols.csv.
    Provides fast search across 5,281+ companies by name or symbol.
    """

    _instance: Optional["CompanyRegistry"] = None
    _companies: List[Dict[str, str]] = []
    _symbol_index: Dict[str, Dict[str, str]] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load()
        return cls._instance

    def _load(self):
        csv_path = os.path.join(
            os.path.dirname(__file__), "..", "screener_company_symbols.csv"
        )
        csv_path = os.path.normpath(csv_path)
        if not os.path.exists(csv_path):
            print(f"[CompanyRegistry] CSV not found at {csv_path}")
            return

        companies = []
        symbol_index = {}
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = (row.get("Name") or "").strip()
                symbol = (row.get("Symbol") or "").strip()
                exchange = (row.get("Exchange") or "").strip()
                if not symbol:
                    continue
                entry = {
                    "name": name,
                    "symbol": symbol,
                    "exchange": exchange,
                    "name_upper": name.upper(),
                    "symbol_upper": symbol.upper(),
                }
                companies.append(entry)
                symbol_index[symbol.upper()] = entry

        self.__class__._companies = companies
        self.__class__._symbol_index = symbol_index
        print(f"[CompanyRegistry] Loaded {len(companies)} companies")

    def search(self, query: str, limit: int = 10) -> List[Dict[str, str]]:
        """
        Search companies by name or symbol. Returns up to `limit` results.
        Exact symbol matches are prioritised, then prefix matches on symbol,
        then substring matches on name.
        """
        if not query:
            return []

        q = query.upper().strip()
        exact = []
        prefix_symbol = []
        contains_symbol = []
        contains_name = []

        for entry in self._companies:
            if entry["symbol_upper"] == q:
                exact.append(entry)
            elif entry["symbol_upper"].startswith(q):
                prefix_symbol.append(entry)
            elif q in entry["symbol_upper"]:
                contains_symbol.append(entry)
            elif q in entry["name_upper"]:
                contains_name.append(entry)

        results = exact + prefix_symbol + contains_symbol + contains_name
        seen = set()
        deduped = []
        for r in results:
            key = r["symbol_upper"]
            if key not in seen:
                seen.add(key)
                deduped.append({
                    "symbol": r["symbol"],
                    "name": r["name"],
                    "exchange": r["exchange"],
                })
            if len(deduped) >= limit:
                break
        return deduped

    def get_by_symbol(self, symbol: str) -> Optional[Dict[str, str]]:
        """Lookup a single company by exact symbol."""
        entry = self._symbol_index.get(symbol.upper().strip())
        if entry:
            return {
                "symbol": entry["symbol"],
                "name": entry["name"],
                "exchange": entry["exchange"],
            }
        return None

    @property
    def count(self) -> int:
        return len(self._companies)
