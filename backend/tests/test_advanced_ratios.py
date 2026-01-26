import pytest
from engines.ratio_engine import RatioEngine

def test_f_score_calculation():
    engine = RatioEngine()
    # Mock data context with 100% positive signals
    data_context = {
        "symbol": "TEST",
        "price": {"current": 100},
        "financials": {
            "income_statement": {
                "2023-12-31": {"Net Income": 100, "Total Revenue": 1000, "Basic EPS": 10, "Gross Profit": 400},
                "2022-12-31": {"Net Income": 50, "Total Revenue": 900, "Gross Profit": 300}
            },
            "balance_sheet": {
                "2023-12-31": {
                    "Total Assets": 1000, "Stockholders Equity": 500, "Total Debt": 100,
                    "Current Assets": 400, "Current Liabilities": 200, "Long Term Debt": 50,
                    "Ordinary Shares Number": 100
                },
                "2022-12-31": {
                    "Total Assets": 1100, "Long Term Debt": 100, "Current Assets": 300,
                    "Current Liabilities": 200, "Ordinary Shares Number": 100
                }
            },
            "cashflow": {
                "2023-12-31": {"Operating Cash Flow": 150}
            }
        }
    }
    
    ratios = engine.compute_ratios(data_context)
    f_score = ratios["quality_scores"]["piotroski_f_score"]
    
    # Expected points:
    # 1. NI > 0 (1)
    # 2. ROA > 0 (1)
    # 3. OCF > 0 (1)
    # 4. OCF > NI (1)
    # 5. Debt ratio down (1) - 50/1000 < 100/1100
    # 6. Curr ratio up (1) - 400/200 > 300/200
    # 7. Shares not up (1)
    # 8. Gross margin up (1) - 400/1000 > 300/900
    # 9. Turnover up (1) - 1000/1000 > 900/1100
    assert f_score == 9

def test_z_score_calculation():
    engine = RatioEngine()
    data_context = {
        "symbol": "TEST",
        "price": {"current": 100},
        "financials": {
            "income_statement": {
                "2023-12-31": {"Total Revenue": 1000, "EBIT": 200, "Basic EPS": 10}
            },
            "balance_sheet": {
                "2023-12-31": {
                    "Total Assets": 1000, "Current Assets": 500, "Current Liabilities": 300,
                    "Retained Earnings": 200, "Ordinary Shares Number": 10,
                    "Total Liabilities Net Minority Interest": 400
                }
            },
            "cashflow": {}
        }
    }
    
    ratios = engine.compute_ratios(data_context)
    z_score = ratios["quality_scores"]["altman_z_score"]
    
    # A = (500-300)/1000 = 0.2
    # B = 200/1000 = 0.2
    # C = 200/1000 = 0.2
    # D = (100*10)/400 = 2.5
    # E = 1000/1000 = 1.0
    # Z = 1.2(0.2) + 1.4(0.2) + 3.3(0.2) + 0.6(2.5) + 1.0(1.0)
    # Z = 0.24 + 0.28 + 0.66 + 1.5 + 1.0 = 3.68
    assert z_score == 3.68

def test_growth_trends():
    engine = RatioEngine()
    data_context = {
        "symbol": "TEST",
        "financials": {
            "income_statement": {
                "2023-12-31": {"Total Revenue": 144, "Net Income": 14.4}, # 10% margin
                "2022-12-31": {"Total Revenue": 121, "Net Income": 12.1}, # 10% margin
                "2021-12-31": {"Total Revenue": 100, "Net Income": 10}    # 10% margin
            },
            "balance_sheet": {},
            "cashflow": {}
        }
    }
    
    ratios = engine.compute_ratios(data_context)
    trends = ratios["growth_trends"]
    
    # Revenue CAGR (3Y) from 100 to 144 over 2 intervals (n=3)
    # CAGR = (144/100)^(1/2) - 1 = 1.2 - 1 = 20%
    assert trends["revenue_cagr_3y"] == 20.0
    assert trends["margin_stability"] == "Stable"
