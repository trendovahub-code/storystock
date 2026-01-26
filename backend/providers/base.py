from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class BaseProvider(ABC):
    @abstractmethod
    def get_stock_info(self, symbol: str) -> Dict[str, Any]:
        """
        Fetches general company info (profile, sector, etc.)
        """
        pass

    @abstractmethod
    def get_financials(self, symbol: str) -> Dict[str, Any]:
        """
        Fetches financial statements (Income, Balance, Cashflow)
        """
        pass

    @abstractmethod
    def get_price_history(self, symbol: str, period: str = "1y") -> Dict[str, Any]:
        """
        Fetches historical price data.
        """
        pass
