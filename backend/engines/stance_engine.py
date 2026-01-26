from typing import Dict, Any, List

class StanceEngine:
    def determine_stance(self, ratios: Dict[str, Any]) -> Dict[str, Any]:
        """
        Determines the overall fundamental stance based on computed ratios.
        """
        profitability = ratios.get("profitability", {})
        leverage = ratios.get("leverage", {})
        valuation = ratios.get("valuation", {})
        
        roe = profitability.get("roe")
        debt_to_equity = leverage.get("debt_to_equity")
        pe_ratio = valuation.get("pe_ratio")
        
        scores = {}
        
        # Business Quality / Profitability Score (0-10)
        if roe:
            if roe > 25: scores["business_quality"] = 9
            elif roe > 15: scores["business_quality"] = 7
            else: scores["business_quality"] = 4
        else:
            scores["business_quality"] = 5 # Neutral if missing
            
        # Financial Safety Score (0-10)
        if debt_to_equity is not None:
            if debt_to_equity < 0.5: scores["financial_safety"] = 9
            elif debt_to_equity < 1.0: scores["financial_safety"] = 6
            else: scores["financial_safety"] = 3
        else:
            scores["financial_safety"] = 5
            
        # Valuation Comfort (0-10)
        if pe_ratio:
            if pe_ratio < 15: scores["valuation_comfort"] = 8
            elif pe_ratio < 30: scores["valuation_comfort"] = 6
            elif pe_ratio < 50: scores["valuation_comfort"] = 4
            else: scores["valuation_comfort"] = 2
        else:
            scores["valuation_comfort"] = 5

        # Calculate Overall Sentiment
        avg_score = sum(scores.values()) / len(scores)
        
        stance = "Mixed Signals"
        if avg_score >= 7.5: stance = "Fundamentally Strong"
        elif avg_score >= 6.0: stance = "Improving Fundamentals"
        elif avg_score < 4.0: stance = "Risky Profile"
        
        # Red Flag detection
        red_flags = []
        if debt_to_equity and debt_to_equity > 2.0:
            red_flags.append("High Debt-to-Equity ratio")
        if roe and roe < 5:
            red_flags.append("Low Return on Equity")
            
        return {
            "overall_stance": stance,
            "pillar_scores": scores,
            "overall_score": round(avg_score, 1),
            "red_flags": red_flags
        }
