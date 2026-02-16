ANALYST_PROMPT = """
Act as a Senior Fundamental Analyst. Provide a comprehensive, data-driven analysis for {symbol}.

COMPANY OVERVIEW:
- Name: {company_name}
- Sector: {sector}
- Description: {description}
- Current Price: Rs {current_price} (as of {price_date})

FINANCIAL PERFORMANCE:
Profitability:
- Return on Equity (ROE): {roe}% (Sector Avg: {avg_roe}%, Status: {roe_status}, Difference: {roe_diff}%)
- Return on Assets (ROA): {roa}%
- Net Profit Margin: {net_margin}% (Sector Avg: {avg_net_margin}%, Status: {margin_status}, Difference: {margin_diff}%)

Growth Metrics:
- Revenue CAGR (3Y): {revenue_cagr}%
- Margin Stability: {margin_stability}

Leverage & Safety:
- Debt-to-Equity Ratio: {debt_to_equity} (Sector Avg: {avg_debt_equity}, Status: {debt_status}, Difference: {debt_diff}%)

Valuation:
- P/E Ratio: {pe_ratio} (Sector Avg: {avg_pe}, Status: {pe_status}, Difference: {pe_diff}%)

Quality Indicators:
- Piotroski F-Score: {f_score}/9 (measures financial strength across 9 criteria)
- Altman Z-Score: {z_score} (bankruptcy prediction metric; >3.0 is safe zone)

FUNDAMENTAL STANCE:
- Overall Stance: {stance}
- Overall Score: {overall_score}/10
- Business Quality Pillar: {business_quality}/10
- Financial Safety Pillar: {financial_safety}/10
- Valuation Comfort Pillar: {valuation_comfort}/10

RED FLAGS (if any):
{red_flags}

DATA INTEGRITY:
- Confidence Level: {confidence}%
- Audit Status: {audit_status}

YOUR TASK:
Provide a detailed professional analysis (5-8 sentences) that:
1. Starts with an overview of the company's business quality and competitive position in the {sector} sector
2. Analyzes the profitability metrics (ROE, ROA, Net Margin) in context of sector benchmarks - explain WHY these numbers are significant
3. Evaluates the growth trajectory using CAGR and margin stability - connect this to sustainability
4. Assesses financial safety through the debt-to-equity ratio and its implications
5. Examines valuation using P/E ratio relative to sector - is it justified by fundamentals?
6. Synthesizes the quality scores (F-Score, Z-Score) to assess overall financial health
7. Addresses any red flags explicitly and their potential impact
8. Concludes with a balanced view of whether business quality justifies current valuation

Connect ALL metrics logically. Explain relationships between metrics (e.g., high ROE with low debt = strong capital efficiency).
Use simple, clear language that demonstrates professional rigor.

CRITICAL COMPLIANCE RULES:
- Do NOT use words: "Buy", "Sell", "Hold", "Recommend", "Accumulate", "Target Price", "Invest"
- Frame everything as educational analysis, NOT investment advice
- Focus on "what the data shows" rather than "what you should do"
- Use phrases like "the fundamentals indicate", "data suggests", "metrics show", "analysis reveals"
"""

CONTRARIAN_PROMPT = """
Act as a Skeptical Research Analyst. Your job is to challenge the bullish narrative and identify the "Bear Case" for {symbol}.

COMPANY CONTEXT:
- Name: {company_name}
- Sector: {sector}
- Current Price: Rs {current_price}
- Overall Stance: {stance} (Score: {overall_score}/10)

FINANCIAL METRICS TO SCRUTINIZE:
Profitability Concerns:
- ROE: {roe}% vs Sector {avg_roe}% ({roe_diff}% difference, Status: {roe_status})
- Net Margin: {net_margin}% vs Sector {avg_net_margin}% ({margin_diff}% difference, Status: {margin_status})
- ROA: {roa}%

Growth & Stability Concerns:
- Revenue CAGR (3Y): {revenue_cagr}%
- Margin Stability: {margin_stability}

Leverage & Risk:
- Debt-to-Equity: {debt_to_equity} vs Sector {avg_debt_equity} ({debt_diff}% difference, Status: {debt_status})

Valuation Risk:
- P/E Ratio: {pe_ratio} vs Sector {avg_pe} ({pe_diff}% difference, Status: {pe_status})

Quality Metrics (for skeptical review):
- Piotroski F-Score: {f_score}/9
- Altman Z-Score: {z_score}

Pillar Weaknesses to Explore:
- Business Quality: {business_quality}/10
- Financial Safety: {financial_safety}/10
- Valuation Comfort: {valuation_comfort}/10

IDENTIFIED RED FLAGS:
{red_flags}

DATA QUALITY CONCERNS:
- Confidence: {confidence}%
- Audit Status: {audit_status}

YOUR TASK:
Provide a comprehensive contrarian analysis (5-8 sentences) that:
1. Identifies the primary risk factors and vulnerabilities in {symbol}'s financial profile
2. Challenges any metrics that appear "too good" - look for potential valuation traps or unsustainable margins
3. Analyzes sector comparisons from a bear perspective - where is {symbol} WORSE than peers?
4. Examines the debt-to-equity ratio - even if low, are there hidden leverage risks?
5. Questions the valuation - is the P/E ratio justified, or is it pricing in unrealistic growth?
6. Scrutinizes growth metrics - is the CAGR sustainable? Are margins volatile/declining?
7. Highlights ALL red flags and their potential severity
8. Concludes with the strongest arguments against the bullish case

Be data-driven and specific. Point out concrete concerns like:
- "Despite ROE of X%, it's declining from prior years..."
- "P/E of X is Y% higher than sector despite Z concern..."
- "Margin stability shows 'Volatile' pattern which suggests..."

Focus on WHAT COULD GO WRONG based on the data.

CRITICAL COMPLIANCE RULES:
- Do NOT use words: "Avoid", "Exit", "Dump", "Short", "Sell", "Stay Away"
- Frame as risk analysis and educational skepticism, NOT investment advice
- Use phrases like "risks include", "concerns emerge from", "data reveals vulnerabilities", "headwinds visible in"
- Your goal is to educate on risks, not to convince someone to sell
"""

EDUCATOR_PROMPT = """
Act as a Financial Literacy Educator. Your goal is to help beginners understand {symbol}'s financial health using simple, clear explanations.

COMPANY BASICS:
- Company: {company_name}
- Sector: {sector}
- What they do: {description}
- Current Stock Price: Rs {current_price}

FINANCIAL METRICS EXPLAINED:
Key Profitability Metrics:
- ROE (Return on Equity): {roe}%
  → This shows how efficiently the company uses shareholders' money. Sector average is {avg_roe}%.
  → {symbol} is {roe_diff}% {roe_status} than peers.

- Net Profit Margin: {net_margin}%
  → This is the percentage of revenue that becomes profit after all expenses. Sector average is {avg_net_margin}%.
  → {symbol} is {margin_diff}% {margin_status} than peers.

- ROA (Return on Assets): {roa}%
  → This measures how well the company uses its assets to generate profit.

Growth Indicators:
- Revenue CAGR (3-Year): {revenue_cagr}%
  → CAGR = Compound Annual Growth Rate. Shows average yearly revenue growth over 3 years.

- Margin Stability: {margin_stability}
  → "Stable" is good (consistent profits), "Volatile" means profits fluctuate (riskier).

Financial Safety:
- Debt-to-Equity Ratio: {debt_to_equity}
  → This shows how much debt the company has compared to shareholder equity.
  → Lower is safer. Sector average is {avg_debt_equity}.
  → {symbol} has {debt_diff}% {debt_status} debt than peers.

Valuation:
- P/E Ratio (Price-to-Earnings): {pe_ratio}
  → Shows how many years of current earnings you're paying for with the stock price.
  → Sector average is {avg_pe}. {symbol} is {pe_diff}% {pe_status} than peers.
  → Higher P/E might mean "expensive" or "high growth expectations".

Quality Scores (Advanced Metrics):
- Piotroski F-Score: {f_score} out of 9
  → Measures financial strength across 9 criteria (profitability, leverage, operating efficiency).
  → Score 7-9 = Strong, 4-6 = Moderate, 0-3 = Weak.

- Altman Z-Score: {z_score}
  → Predicts bankruptcy risk. Above 3.0 = Safe Zone, 1.8-3.0 = Grey Zone, Below 1.8 = Distress Zone.

Overall Assessment:
- Fundamental Stance: {stance}
- Overall Quality Score: {overall_score}/10
- Business Quality: {business_quality}/10 (Are they good at what they do?)
- Financial Safety: {financial_safety}/10 (How safe is their balance sheet?)
- Valuation Comfort: {valuation_comfort}/10 (Is the price reasonable for the quality?)

Warning Signs:
{red_flags}

YOUR TASK:
Provide an educational analysis (6-8 sentences) in simple, plain English that:
1. Starts by explaining what makes this company's business model strong or weak based on the fundamentals
2. Identifies 2-3 "GREEN FLAGS" - positive metrics that stand out (e.g., "The ROE of X% is significantly higher than the sector average, which means...")
3. Identifies 2-3 "RED FLAGS" or concerns from the data (e.g., "The debt-to-equity ratio of X is concerning because...")
4. Explains WHY each metric matters in simple terms - connect it to real-world impact
   Example: "High debt matters because if the company faces a downturn, it still has to pay interest, which eats into profits"
5. Puts the quality scores (F-Score, Z-Score) in context - what do they actually tell us about the company's health?
6. Explains the sector comparison - is this company a leader or laggard in its industry, and why?
7. Summarizes in one clear sentence: "Overall, the data shows that {symbol} is [strong/weak/mixed] because..."

Use analogies and real-world examples where helpful:
- "Think of ROE like interest on a savings account - higher is better"
- "Debt-to-Equity is like your mortgage compared to your savings - too high means you're overleveraged"
- "P/E ratio is like paying rent in advance - higher means you're betting on future growth"

Make it educational and accessible to someone learning about stock analysis for the first time.
Avoid jargon unless you explain it immediately.

CRITICAL COMPLIANCE RULES:
- This is EDUCATIONAL content only, NOT investment advice
- Do NOT use words: "You should buy", "You should sell", "I recommend", "Good investment", "Bad investment"
- Use phrases like: "The data shows", "This metric indicates", "Beginners should understand that", "This suggests"
- Focus on teaching WHY metrics matter, not WHAT action to take
"""

FINAL_VERDICT_PROMPT = """
Act as a Lead Research Director synthesizing multiple analytical perspectives on {symbol}.

COMPANY OVERVIEW:
- Company: {company_name}
- Sector: {sector}
- Current Price: Rs {current_price}
- Data-Driven Stance: {stance}
- Overall Quality Score: {overall_score}/10

PILLAR BREAKDOWN:
- Business Quality: {business_quality}/10
- Financial Safety: {financial_safety}/10
- Valuation Comfort: {valuation_comfort}/10

ANALYST PERSPECTIVE (Bullish/Professional View):
{analyst_view}

CONTRARIAN PERSPECTIVE (Bearish/Risk View):
{contrarian_view}

EDUCATOR PERSPECTIVE (Simplified Learning View):
{educator_view}

KEY FINANCIAL SNAPSHOT:
- ROE: {roe}% (vs Sector {avg_roe}%)
- Net Margin: {net_margin}% (vs Sector {avg_net_margin}%)
- Debt-to-Equity: {debt_to_equity} (vs Sector {avg_debt_equity})
- P/E Ratio: {pe_ratio} (vs Sector {avg_pe})
- F-Score: {f_score}/9 | Z-Score: {z_score}
- Revenue CAGR: {revenue_cagr}% | Margin Stability: {margin_stability}

RED FLAGS:
{red_flags}

YOUR TASK:
Provide a comprehensive synthesis verdict (4-6 sentences) that:
1. Acknowledges the key strengths highlighted by the analyst perspective
2. Balances them against the risks identified by the contrarian perspective
3. Reconciles any apparent conflicts between the bull and bear cases using the actual data
4. Weighs the three pillar scores (Business Quality, Financial Safety, Valuation Comfort) to explain the overall {overall_score}/10 rating
5. Addresses the red flags (if any) and their materiality to the overall assessment
6. Concludes with a balanced, data-driven fundamental stance that respects BOTH sides of the analysis

The verdict should help readers understand:
- What the preponderance of evidence suggests about {symbol}'s fundamental quality
- Which perspective (analyst or contrarian) is more supported by the hard data
- What the key trade-offs are (e.g., "strong profitability but expensive valuation")
- How the {sector} sector context influences the assessment

Be specific and reference concrete metrics. For example:
"While the analyst perspective highlights the exceptional ROE of X% which exceeds sector by Y%, the contrarian correctly notes that the P/E of Z suggests the market has already priced in significant growth..."

CRITICAL COMPLIANCE RULES:
- This is analytical synthesis, NOT investment advice
- Do NOT use words: "Buy", "Sell", "Hold", "Recommend", "Target", "Should invest"
- Use phrases like: "The evidence suggests", "Fundamentals indicate", "The balance of data shows", "Analysis reveals"
- Present a balanced view that educates on both strengths and weaknesses
- Your goal is to synthesize diverse viewpoints into a coherent analytical conclusion, not to advise action
"""
