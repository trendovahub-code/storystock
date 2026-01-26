from nsepython import nse_eq, nse_quote_ltp
from typing import Dict, Any, Optional
from .base import BaseProvider
import json

class NSEPythonProvider(BaseProvider):
    def get_stock_info(self, symbol: str) -> Dict[str, Any]:
        """
        Fetches NSE-specific info like delivery percentage, market lot, etc.
        """
        try:
            # nsepython works with clean symbols (RELIANCE instead of RELIANCE.NS)
            clean_symbol = symbol.replace(".NS", "")
            quote = nse_eq(clean_symbol)
            
            # Actual structure is { "info": { ... } }
            info = quote.get("info", {})
            
            return {
                "name": info.get("companyName"),
                "industry": info.get("industry"),
                "listing_date": info.get("listingDate"),
                "isin": info.get("isin"),
                "source": "nsepython"
            }
        except Exception as e:
            print(f"nsepython error (info): {e}")
            return {}

    def get_financials(self, symbol: str) -> Dict[str, Any]:
        """
        nsepython's financial support is limited/unreliable compared to yf.
        Keeping as placeholder for now or specific NSE filings if needed.
        """
        return {}

    def get_price_history(self, symbol: str, period: str = "1y") -> Dict[str, Any]:
        """
        Fetches current price and high/lows.
        """
        try:
            clean_symbol = symbol.replace(".NS", "")
            ltp = nse_quote_ltp(clean_symbol)
            return {
                "last_price": ltp,
                "source": "nsepython"
            }
        except Exception as e:
            print(f"nsepython error (price): {e}")
            return {}
