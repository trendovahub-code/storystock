import yfinance as yf
from typing import Dict, Any, Optional
from .base import BaseProvider
import pandas as pd

class YFinanceProvider(BaseProvider):
    def get_stock_info(self, symbol: str) -> Dict[str, Any]:
        """
        Fetches stock profile and summary data using yfinance.
        """
        try:
            # For Indian stocks, append .NS if not present
            formatted_symbol = symbol if symbol.endswith(".NS") else f"{symbol}.NS"
            ticker = yf.Ticker(formatted_symbol)
            info = ticker.info
            
            return {
                "name": info.get("longName"),
                "sector": info.get("sector"),
                "industry": info.get("industry"),
                "description": info.get("longBusinessSummary"),
                "market_cap": info.get("marketCap"),
                "current_price": info.get("currentPrice"),
                "currency": info.get("currency"),
                "source": "yfinance"
            }
        except Exception as e:
            print(f"yfinance error (info): {e}")
            return {}

    def get_financials(self, symbol: str) -> Dict[str, Any]:
        """
        Fetches core financial statements.
        """
        try:
            formatted_symbol = symbol if symbol.endswith(".NS") else f"{symbol}.NS"
            ticker = yf.Ticker(formatted_symbol)
            
            return {
                "income_statement": ticker.income_stmt.to_dict() if not ticker.income_stmt.empty else {},
                "balance_sheet": ticker.balance_sheet.to_dict() if not ticker.balance_sheet.empty else {},
                "cashflow": ticker.cashflow.to_dict() if not ticker.cashflow.empty else {},
                "source": "yfinance"
            }
        except Exception as e:
            print(f"yfinance error (financials): {e}")
            return {}

    def get_price_history(self, symbol: str, period: str = "1y") -> Dict[str, Any]:
        """
        Fetches historical price trends.
        """
        try:
            formatted_symbol = symbol if symbol.endswith(".NS") else f"{symbol}.NS"
            ticker = yf.Ticker(formatted_symbol)
            hist = ticker.history(period=period)
            
            if hist.empty:
                return {}
            
            # Format history for easy plotting
            history_list = []
            for date, row in hist.iterrows():
                history_list.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "close": round(float(row["Close"]), 2),
                    "volume": int(row["Volume"])
                })
            
            return {
                "history": history_list,
                "source": "yfinance"
            }
        except Exception as e:
            print(f"yfinance error (history): {e}")
            return {}
