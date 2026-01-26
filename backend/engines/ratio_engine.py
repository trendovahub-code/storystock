from typing import Dict, Any, Optional

class RatioEngine:
    def compute_ratios(self, data_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates core financial ratios from the merged data context.
        """
        financials = data_context.get("financials", {})
        income_stmt = financials.get("income_statement", {})
        balance_sheet = financials.get("balance_sheet", {})
        cashflow = financials.get("cashflow", {})
        
        # Extract latest values (handling yfinance dict structure)
        def get_value(stmt: Dict[str, Any], field: str, periods_ago: int = 0) -> Optional[float]:
            try:
                dates = sorted(stmt.keys(), reverse=True)
                if len(dates) <= periods_ago: return None
                target_date = dates[periods_ago]
                return stmt[target_date].get(field)
            except:
                return None

        # Basic Profitability Ratios
        net_income = get_value(income_stmt, "Net Income")
        revenue = get_value(income_stmt, "Total Revenue")
        equity = get_value(balance_sheet, "Stockholders Equity")
        assets = get_value(balance_sheet, "Total Assets")
        
        roe = (net_income / equity * 100) if (net_income is not None and equity and equity != 0) else None
        roa = (net_income / assets * 100) if (net_income is not None and assets and assets != 0) else None
        net_margin = (net_income / revenue * 100) if (net_income is not None and revenue and revenue != 0) else None
        
        # Leverage Ratios
        total_debt = get_value(balance_sheet, "Total Debt")
        debt_to_equity = (total_debt / equity) if (total_debt is not None and equity and equity != 0) else None
        
        # Valuation Ratios
        price = data_context.get("price", {}).get("current")
        eps = get_value(income_stmt, "Basic EPS")
        pe_ratio = (price / eps) if (price and eps and eps != 0) else None

        # Advanced Scores
        f_score = self._compute_piotroski_f_score(income_stmt, balance_sheet, cashflow, get_value)
        z_score = self._compute_altman_z_score(income_stmt, balance_sheet, price, get_value)

        return {
            "profitability": {
                "roe": roe,
                "roa": roa,
                "net_margin": net_margin
            },
            "leverage": {
                "debt_to_equity": debt_to_equity
            },
            "valuation": {
                "pe_ratio": pe_ratio,
                "price": price
            },
            "quality_scores": {
                "piotroski_f_score": f_score,
                "altman_z_score": z_score
            },
            "growth_trends": self._compute_growth_trends(income_stmt, get_value)
        }

    def _compute_growth_trends(self, income_stmt, get_value) -> Dict[str, Any]:
        """
        Calculates 3-year CAGR for Revenue and Net Income, and margin stability.
        """
        try:
            # Revenue CAGR (3Y)
            rev_latest = get_value(income_stmt, "Total Revenue", 0)
            rev_3y_ago = get_value(income_stmt, "Total Revenue", 2)
            
            rev_cagr = None
            if rev_latest and rev_3y_ago and rev_latest > 0 and rev_3y_ago > 0:
                # CAGR calculation: ((EV/BV)^(1/n)) - 1
                rev_cagr = round(((rev_latest / rev_3y_ago) ** (1/2) - 1) * 100, 2)
            
            # Net Income Stability (Margin Volatility)
            margins = []
            for i in range(3):
                ni = get_value(income_stmt, "Net Income", i)
                rev = get_value(income_stmt, "Total Revenue", i)
                if ni is not None and rev and rev != 0:
                    margins.append(ni / rev)
            
            margin_stability = "Stable"
            if len(margins) >= 2:
                avg_margin = sum(margins) / len(margins)
                variance = sum((m - avg_margin) ** 2 for m in margins) / len(margins)
                std_dev = variance ** 0.5
                if std_dev > 0.05: margin_stability = "Volatile"
            
            return {
                "revenue_cagr_3y": rev_cagr,
                "margin_stability": margin_stability,
                "data_points": len(margins)
            }
        except:
            return {}

    def _compute_piotroski_f_score(self, income_stmt, balance_sheet, cashflow, get_value) -> Optional[int]:
        """
        Calculates Piotroski F-Score (0-9).
        """
        try:
            score = 0
            
            # 1. Profitability (4 points)
            net_income = get_value(income_stmt, "Net Income")
            if net_income and net_income > 0: score += 1
            
            assets = get_value(balance_sheet, "Total Assets")
            roa = net_income / assets if (net_income is not None and assets and assets != 0) else None
            if roa and roa > 0: score += 1
            
            ocf = get_value(cashflow, "Operating Cash Flow")
            if ocf and ocf > 0: score += 1
            
            if ocf and net_income and ocf > net_income: score += 1
            
            # 2. Leverage & Liquidity (3 points)
            prev_assets = get_value(balance_sheet, "Total Assets", 1)
            lt_debt = get_value(balance_sheet, "Long Term Debt")
            prev_lt_debt = get_value(balance_sheet, "Long Term Debt", 1)
            
            # Lower debt ratio
            if (lt_debt is not None and assets and assets != 0 and 
                prev_lt_debt is not None and prev_assets and prev_assets != 0):
                if (lt_debt / assets) < (prev_lt_debt / prev_assets): score += 1
            
            # Higher liquidity (Current Ratio)
            curr_assets = get_value(balance_sheet, "Current Assets")
            curr_liab = get_value(balance_sheet, "Current Liabilities")
            prev_curr_assets = get_value(balance_sheet, "Current Assets", 1)
            prev_curr_liab = get_value(balance_sheet, "Current Liabilities", 1)
            
            if (curr_assets and curr_liab and curr_liab != 0 and 
                prev_curr_assets and prev_curr_liab and prev_curr_liab != 0):
                if (curr_assets / curr_liab) > (prev_curr_assets / prev_curr_liab): score += 1
            
            # Dilution check
            shares = get_value(balance_sheet, "Ordinary Shares Number")
            prev_shares = get_value(balance_sheet, "Ordinary Shares Number", 1)
            if shares and prev_shares and shares <= prev_shares: score += 1
            
            # 3. Operating Efficiency (2 points)
            gross_profit = get_value(income_stmt, "Gross Profit")
            revenue = get_value(income_stmt, "Total Revenue")
            prev_gross_profit = get_value(income_stmt, "Gross Profit", 1)
            prev_revenue = get_value(income_stmt, "Total Revenue", 1)
            
            if (gross_profit and revenue and revenue != 0 and 
                prev_gross_profit and prev_revenue and prev_revenue != 0):
                if (gross_profit / revenue) > (prev_gross_profit / prev_revenue): score += 1
            
            if (revenue and assets and assets != 0 and 
                prev_revenue and prev_assets and prev_assets != 0):
                if (revenue / assets) > (prev_revenue / prev_assets): score += 1
                
            return score
        except:
            return None

    def _compute_altman_z_score(self, income_stmt, balance_sheet, price, get_value) -> Optional[float]:
        """
        Calculates Altman Z-Score for manufacturing companies.
        Z > 3.0: Safe, Z < 1.8: Distress
        """
        try:
            assets = get_value(balance_sheet, "Total Assets")
            if not assets or assets == 0: return None

            # A = Working Capital / Total Assets
            curr_assets = get_value(balance_sheet, "Current Assets")
            curr_liab = get_value(balance_sheet, "Current Liabilities")
            if curr_assets is None or curr_liab is None: return None
            A = (curr_assets - curr_liab) / assets
            
            # B = Retained Earnings / Total Assets
            retained_earnings = get_value(balance_sheet, "Retained Earnings")
            if retained_earnings is None: return None
            B = retained_earnings / assets
            
            # C = EBIT / Total Assets
            ebit = get_value(income_stmt, "EBIT")
            if ebit is None: return None
            C = ebit / assets
            
            # D = Market Value of Equity / Total Liabilities
            shares = get_value(balance_sheet, "Ordinary Shares Number")
            total_liab = get_value(balance_sheet, "Total Liabilities Net Minority Interest")
            if not (price and shares and total_liab and total_liab != 0): return None
            D = (price * shares) / total_liab
            
            # E = Sales / Total Assets
            revenue = get_value(income_stmt, "Total Revenue")
            if revenue is None: return None
            E = revenue / assets
            
            z = 1.2*A + 1.4*B + 3.3*C + 0.6*D + 1.0*E
            return round(z, 2)
        except:
            return None
