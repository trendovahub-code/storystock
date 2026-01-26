from datetime import datetime
from typing import Dict, Any, List
from providers.yfinance_provider import YFinanceProvider
from providers.nse_provider import NSEPythonProvider

class DataMerger:
    def __init__(self):
        self.yf_provider = YFinanceProvider()
        self.nse_provider = NSEPythonProvider()

    def merge_stock_data(self, symbol: str) -> Dict[str, Any]:
        """
        Fetches data from all providers and merges it into a unified context.
        """
        # Concurrent fetching could be added later for performance
        yf_info = self.yf_provider.get_stock_info(symbol)
        nse_info = self.nse_provider.get_stock_info(symbol)
        
        yf_financials = self.yf_provider.get_financials(symbol)
        yf_history = self.yf_provider.get_price_history(symbol)
        nse_price = self.nse_provider.get_price_history(symbol)

        # Merge Logic: NSE info takes priority for name/industry if available
        # yfinance financials are the primary source
        merged_context = {
            "symbol": symbol.upper(),
            "profile": {
                "name": nse_info.get("name") or yf_info.get("name"),
                "sector": yf_info.get("sector"),
                "industry": nse_info.get("industry") or yf_info.get("industry"),
                "description": yf_info.get("description"),
                "isin": nse_info.get("isin"),
                "listing_date": nse_info.get("listing_date")
            },
            "price": {
                "current": nse_price.get("last_price") or yf_info.get("current_price"),
                "date": datetime.now().strftime("%d %b %Y"),
                "history": yf_history.get("history", []),
                "currency": yf_info.get("currency") or "INR"
            },
            "financials": yf_financials,
            "quality_audit": {
                "yf_available": bool(yf_info),
                "nse_available": bool(nse_info)
            }
        }

        return merged_context
