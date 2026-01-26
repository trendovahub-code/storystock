import json
import os
from typing import Dict, Any

class BenchmarkingEngine:
    def __init__(self):
        data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'sector_benchmarks.json')
        try:
            with open(data_path, 'r') as f:
                self.benchmarks = json.load(f)
        except Exception as e:
            print(f"Error loading benchmarks: {e}")
            self.benchmarks = {}

    def get_benchmark_comparison(self, sector: str, ratios: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compares stock ratios against sector averages.
        """
        # Fallback to Default if sector not found
        sector_bench = self.benchmarks.get(sector, self.benchmarks.get("Default", {}))
        
        profitability = ratios.get("profitability", {})
        valuation = ratios.get("valuation", {})
        leverage = ratios.get("leverage", {})
        
        comparisons = {
            "roe": self._compare(profitability.get("roe"), sector_bench.get("avg_roe")),
            "pe": self._compare(valuation.get("pe_ratio"), sector_bench.get("avg_pe"), invert=True),
            "debt_to_equity": self._compare(leverage.get("debt_to_equity"), sector_bench.get("avg_debt_equity"), invert=True)
        }
        
        return {
            "sector": sector,
            "averages": sector_bench,
            "comparisons": comparisons
        }

    def _compare(self, value: float, benchmark: float, invert: bool = False) -> Dict[str, Any]:
        if value is None or benchmark is None:
            return {"status": "neutral", "diff_pct": 0}
        
        diff_pct = ((value - benchmark) / benchmark) * 100
        
        # Determine status (better/worse)
        # For ROE: higher is better. For PE/Debt: lower is better (if invert=True)
        is_better = diff_pct > 0 if not invert else diff_pct < 0
        
        status = "better" if is_better else "worse"
        if abs(diff_pct) < 5: status = "inline"
        
        return {
            "status": status,
            "diff_pct": round(diff_pct, 1)
        }
