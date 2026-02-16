"use client"

import { Modal, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/Modal"
import { Badge } from "@/components/ui/Badge"
import { GraduationCap, Landmark, Calculator, AlertCircle, TrendingUp } from "lucide-react"

interface MetricExplanation {
    title: string
    definition: string
    whyItMatters: string
    howToCalculate: string
    interpretation: string
    commonMisconceptions: string
}

const metricExplanations: Record<string, MetricExplanation> = {
    /* -- Profitability -- */
    "ROE": {
        title: "Return on Equity (ROE)",
        definition: "Measures how much profit a company generates for every rupee of shareholder equity.",
        whyItMatters: "Shows how effectively management turns shareholder capital into profits. Higher ROE means the company earns more per unit of equity.",
        howToCalculate: "Net Income / Shareholders' Equity x 100",
        interpretation: "Above 15% is generally good. Above 20% is excellent. Consistent ROE over many years is a strong quality signal.",
        commonMisconceptions: "ROE can be inflated by high debt. Always check alongside Debt-to-Equity ratio."
    },
    "ROA": {
        title: "Return on Assets (ROA)",
        definition: "Measures how efficiently a company uses its total assets to generate profit.",
        whyItMatters: "Unlike ROE, ROA accounts for debt. It tells you how productive all company resources are, regardless of how they're financed.",
        howToCalculate: "Net Income / Total Assets x 100",
        interpretation: "Above 5% is considered good for most industries. Asset-heavy industries (like manufacturing) tend to have lower ROA.",
        commonMisconceptions: "A low ROA doesn't always mean poor management -- some industries naturally require large asset bases."
    },
    "Net Margin": {
        title: "Net Profit Margin",
        definition: "The percentage of revenue that remains as profit after all expenses, taxes, and costs are deducted.",
        whyItMatters: "It shows how much of every rupee earned actually becomes profit. Rising margins indicate improving efficiency or pricing power.",
        howToCalculate: "Net Income / Total Revenue x 100",
        interpretation: "Varies widely by industry. Software companies may have 20-30% margins while retail might be 2-5%. Compare within the same sector.",
        commonMisconceptions: "High revenue growth with shrinking margins can be a warning sign -- the company may be growing unprofitably."
    },
    "ROCE": {
        title: "Return on Capital Employed (ROCE)",
        definition: "Measures how efficiently a company generates operating profit from total capital employed (equity + debt).",
        whyItMatters: "ROCE shows whether management earns strong returns on both shareholder and lender capital, making it a core efficiency signal.",
        howToCalculate: "EBIT / (Total Assets - Current Liabilities) x 100",
        interpretation: "Above 15% is generally healthy. Consistent ROCE across cycles indicates durable profitability.",
        commonMisconceptions: "ROCE can look inflated in asset-light businesses -- compare within the same industry."
    },
    "OPM": {
        title: "Operating Profit Margin (OPM)",
        definition: "The percentage of revenue left after covering operating costs, before interest and taxes.",
        whyItMatters: "OPM highlights pricing power and cost discipline. Rising OPM often signals improving business quality.",
        howToCalculate: "EBIT / Revenue x 100",
        interpretation: "Higher is better, but compare against sector peers. Consistent OPM is preferred over volatile spikes.",
        commonMisconceptions: "OPM excludes non-operating income, so it can differ from net margin."
    },

    /* -- Leverage -- */
    "Debt to Equity": {
        title: "Debt-to-Equity Ratio",
        definition: "Compares a company's total debt to its shareholders' equity, showing how much borrowed money is used relative to owner capital.",
        whyItMatters: "High leverage amplifies both gains and losses. Companies with moderate debt are generally more resilient during downturns.",
        howToCalculate: "Total Debt / Shareholders' Equity",
        interpretation: "Below 0.5 is conservative. Between 0.5-1.0 is moderate. Above 1.0 means debt exceeds equity -- higher risk.",
        commonMisconceptions: "Zero debt isn't always ideal -- some debt can boost returns. The key is whether debt is productive and manageable."
    },
    "Interest Coverage": {
        title: "Interest Coverage Ratio",
        definition: "Measures how easily a company can pay interest on its outstanding debt.",
        whyItMatters: "Low coverage means earnings barely cover interest obligations, increasing financial risk.",
        howToCalculate: "EBIT / Interest Expense",
        interpretation: "Above 3x is usually comfortable. Below 1.5x can indicate stress.",
        commonMisconceptions: "Coverage can fluctuate with one-time earnings -- check multi-year trends."
    },

    /* -- Valuation -- */
    "PE": {
        title: "Price-to-Earnings (P/E) Ratio",
        definition: "The ratio of a company's share price to its earnings per share, indicating how much investors pay per rupee of earnings.",
        whyItMatters: "Helps assess whether a stock is overvalued or undervalued relative to its earnings power.",
        howToCalculate: "Market Price per Share / Earnings per Share (EPS)",
        interpretation: "Below 15 is typically considered undervalued. 15-30 is moderate. Above 50 may indicate overvaluation or high growth expectations.",
        commonMisconceptions: "Low P/E doesn't always mean a bargain -- it could signal declining earnings ahead. Compare within the same sector."
    },
    "Market Cap": {
        title: "Market Capitalization",
        definition: "The total market value of a company based on its current share price.",
        whyItMatters: "Market cap helps compare company size and risk profile. Large caps tend to be more stable than small caps.",
        howToCalculate: "Share Price x Outstanding Shares",
        interpretation: "Use market cap to contextualize valuation multiples and growth expectations.",
        commonMisconceptions: "Market cap is not the same as enterprise value -- debt and cash also matter."
    },
    "Book Value": {
        title: "Book Value per Share",
        definition: "The net assets of a company divided by the number of shares outstanding.",
        whyItMatters: "Book value reflects the accounting value of equity and anchors valuation comparisons.",
        howToCalculate: "(Total Assets - Total Liabilities) / Shares Outstanding",
        interpretation: "A stock trading close to book value may be undervalued, but context matters by sector.",
        commonMisconceptions: "Book value can be misleading for asset-light or high-intangible businesses."
    },
    "Price to Book": {
        title: "Price-to-Book (P/B) Ratio",
        definition: "Compares the market price of a share to its book value per share.",
        whyItMatters: "Shows how much investors pay for each rupee of net assets. Useful for banks and asset-heavy firms.",
        howToCalculate: "Market Price per Share / Book Value per Share",
        interpretation: "Below 1 can signal undervaluation, while very high values suggest premium expectations.",
        commonMisconceptions: "A low P/B isn't always a bargain -- assets may be low quality or overvalued."
    },
    "Dividend Yield": {
        title: "Dividend Yield",
        definition: "Annual dividend per share as a percentage of the current share price.",
        whyItMatters: "Dividend yield indicates cash returns to shareholders and can signal financial discipline.",
        howToCalculate: "Annual Dividend per Share / Current Share Price x 100",
        interpretation: "High yield can be attractive, but confirm that dividends are sustainable.",
        commonMisconceptions: "A very high yield can be a warning sign if the share price has fallen sharply."
    },
    "Revenue": {
        title: "Revenue",
        definition: "Total income generated by the company from its operations during a reporting period.",
        whyItMatters: "Revenue shows business scale and demand. Sustained growth often supports long-term compounding.",
        howToCalculate: "Sum of operating income streams reported in the income statement.",
        interpretation: "Rising revenue over multi-year periods is generally positive, especially when margins are stable.",
        commonMisconceptions: "High revenue alone is not enough. Profitability and cash flow quality still matter."
    },
    "Net Profit": {
        title: "Net Profit",
        definition: "Earnings remaining after all expenses, interest, and taxes are deducted.",
        whyItMatters: "Net profit reflects the bottom-line earnings available to equity holders.",
        howToCalculate: "Total Revenue - Total Expenses - Interest - Taxes (plus/minus other non-operating items).",
        interpretation: "Consistent or improving net profit indicates healthy operating leverage and discipline.",
        commonMisconceptions: "One-time gains can inflate profit. Validate with operating cash flow trends."
    },
    "Dividend Payout": {
        title: "Dividend Payout Ratio",
        definition: "Percentage of net profit distributed to shareholders as dividends.",
        whyItMatters: "It shows the balance between shareholder returns and earnings retained for growth.",
        howToCalculate: "Dividends Paid / Net Profit x 100",
        interpretation: "Higher payout suggests stronger cash distribution; lower payout suggests reinvestment focus.",
        commonMisconceptions: "A lower payout is not always negative if retained earnings are deployed productively."
    },

    /* -- Quality Scores -- */
    "F-Score": {
        title: "Piotroski F-Score",
        definition: "A 9-point scoring system that tests a company's financial strength across profitability, leverage, and operating efficiency.",
        whyItMatters: "Invented by professor Joseph Piotroski, it provides a quick quality check. Companies scoring 7-9 have historically outperformed the market.",
        howToCalculate: "Sum of 9 binary tests: positive net income, positive ROA, positive cash flow, ROA increase, leverage decrease, liquidity increase, no dilution, margin increase, asset turnover increase",
        interpretation: "0-3: Weak fundamentals. 4-6: Average. 7-9: Strong fundamentals. The higher, the better.",
        commonMisconceptions: "F-Score is backward-looking -- it tests past financial health, not future prospects. Use it alongside forward-looking metrics."
    },

    /* -- Growth Trends -- */
    "Revenue Growth": {
        title: "Revenue CAGR (3-Year)",
        definition: "The Compound Annual Growth Rate of revenue over the last 3 fiscal years, smoothing out year-to-year volatility.",
        whyItMatters: "Sustainable revenue growth is the engine of long-term value creation. CAGR smooths out one-off spikes or dips.",
        howToCalculate: "((Revenue_Latest / Revenue_3YearsAgo)^(1/3) - 1) x 100",
        interpretation: "Above 15% is strong growth. 5-15% is moderate. Below 5% or negative suggests a maturing or declining business.",
        commonMisconceptions: "CAGR can mask volatility -- a company might have grown 50% then shrunk 30%. Check individual years too."
    },
    "Net Income Growth": {
        title: "Net Income CAGR (3-Year)",
        definition: "The Compound Annual Growth Rate of net income over the last 3 fiscal years.",
        whyItMatters: "Net income growth shows whether profitability is expanding alongside revenue.",
        howToCalculate: "((NetIncome_Latest / NetIncome_3YearsAgo)^(1/3) - 1) x 100",
        interpretation: "Consistent net income growth is a strong signal of operational leverage and pricing power.",
        commonMisconceptions: "One-off gains or losses can distort net income growth -- verify with cash flow."
    },
    "Margin Stability": {
        title: "Margin Stability",
        definition: "Assesses whether profit margins have remained consistent or fluctuated significantly over the past 3 years.",
        whyItMatters: "Stable margins indicate pricing power and cost discipline. Erratic margins may signal competitive pressures or poor cost control.",
        howToCalculate: "Compares standard deviation of net margins across available periods",
        interpretation: "'Stable' means margins are consistent. 'Volatile' suggests unpredictable profitability. Stable is preferred.",
        commonMisconceptions: "Expanding margins aren't always sustainable -- they could be driven by one-time cost cuts rather than genuine efficiency."
    },
    "Debtor Days": {
        title: "Debtor Days",
        definition: "Average number of days the company takes to collect cash from customers.",
        whyItMatters: "Lower debtor days imply faster cash collection and healthier working capital management.",
        howToCalculate: "(Trade Receivables / Revenue) x 365",
        interpretation: "Compare within the same industry. Rising debtor days can signal weak collections.",
        commonMisconceptions: "Seasonal businesses may have naturally higher debtor days at certain times."
    },
    "Inventory Days": {
        title: "Inventory Days",
        definition: "Average number of days inventory is held before being sold.",
        whyItMatters: "Efficient inventory turnover reduces storage costs and working capital pressure.",
        howToCalculate: "(Average Inventory / Cost of Goods Sold) x 365",
        interpretation: "Lower is generally better, but compare with peers in the same sector.",
        commonMisconceptions: "Higher inventory days may be strategic in cyclical industries."
    },
    "Working Capital Days": {
        title: "Working Capital Days",
        definition: "Measures how many days of sales are tied up in working capital.",
        whyItMatters: "Lower days mean the company turns working capital into revenue faster.",
        howToCalculate: "(Working Capital / Revenue) x 365",
        interpretation: "Rising working capital days can pressure cash flow.",
        commonMisconceptions: "Very low working capital days aren't always ideal for growth-focused firms."
    },
    "Cash Conversion Cycle": {
        title: "Cash Conversion Cycle (CCC)",
        definition: "The net time it takes to convert inventory and receivables into cash after paying suppliers.",
        whyItMatters: "Shorter CCC means better liquidity and operational efficiency.",
        howToCalculate: "Inventory Days + Debtor Days - Payable Days",
        interpretation: "Negative or low CCC is favorable. Track trends over time.",
        commonMisconceptions: "A low CCC doesn't guarantee profitability -- margins still matter."
    },

    /* -- Stance Pillars -- */
    "Business Quality": {
        title: "Business Quality Score",
        definition: "Rates the company's profitability and earnings quality on a 0-10 scale, primarily driven by Return on Equity (ROE).",
        whyItMatters: "High-quality businesses with strong ROE tend to generate consistent returns and weather market downturns better.",
        howToCalculate: "ROE > 25%: Score 9 | ROE 15-25%: Score 7 | ROE < 15%: Score 4 | No data: Score 5",
        interpretation: "7-10: Strong business quality. 4-6: Average. Below 4: Weak. Look for consistently high scores across years.",
        commonMisconceptions: "A high score in one year doesn't guarantee future quality. Check if the score has been consistent."
    },
    "Financial Safety": {
        title: "Financial Safety Score",
        definition: "Rates the company's financial risk and leverage on a 0-10 scale, primarily driven by the Debt-to-Equity ratio.",
        whyItMatters: "Companies with lower debt are more resilient during economic downturns and less likely to face financial distress.",
        howToCalculate: "D/E < 0.5: Score 9 | D/E 0.5-1.0: Score 6 | D/E > 1.0: Score 3 | No data: Score 5",
        interpretation: "7-10: Strong financial safety. 4-6: Average. Below 4: High risk.",
        commonMisconceptions: "Very low debt can mean the company is not using leverage opportunities -- context matters by industry."
    },
    "Valuation Comfort": {
        title: "Valuation Comfort Score",
        definition: "Rates how reasonably the stock is valued on a 0-10 scale, primarily driven by the P/E ratio.",
        whyItMatters: "Even great businesses can be bad investments if you overpay. This score helps gauge if the price is justified.",
        howToCalculate: "PE < 15: Score 8 | PE 15-30: Score 6 | PE 30-50: Score 4 | PE > 50: Score 2 | No data: Score 5",
        interpretation: "7-10: Attractively valued. 4-6: Fairly valued. Below 4: Potentially overvalued. Always compare to growth rate.",
        commonMisconceptions: "A low valuation score doesn't mean 'avoid' -- high-growth companies often command premium valuations justifiably."
    },
    "Overall Stance": {
        title: "Overall Fundamental Stance",
        definition: "A summary verdict combining Business Quality, Financial Safety, and Valuation Comfort into a single assessment.",
        whyItMatters: "Provides a quick, at-a-glance view of the company's fundamental health without needing to interpret individual metrics.",
        howToCalculate: "Average of three pillar scores: Strong >= 7.5 | Improving >= 6.0 | Mixed >= 4.0 | Risky < 4.0",
        interpretation: "'Fundamentally Strong' is the best. 'Mixed Signals' means some areas are good but others need attention. 'Risky Profile' warrants caution.",
        commonMisconceptions: "This is not a buy/sell recommendation. It's a fundamental health check -- other factors like technicals and macros also matter."
    },

    /* -- Integrity & Audit -- */
    "Data Confidence": {
        title: "Data Confidence Score",
        definition: "A 0-100% score reflecting how complete and reliable the underlying financial data is for this analysis.",
        whyItMatters: "Low confidence means some financial statements or data points are missing, which could make the analysis less reliable.",
        howToCalculate: "Based on availability of: income statement periods, balance sheet periods, cash flow data, company name, and current price",
        interpretation: "Above 80%: High confidence. 50-80%: Moderate -- some data gaps. Below 50%: Low confidence -- interpret results cautiously.",
        commonMisconceptions: "100% confidence doesn't mean the analysis is perfect -- it only means the input data is complete."
    },
    "Audit Status": {
        title: "Integrity Audit Checks",
        definition: "Automated validation that checks whether computed financial ratios fall within reasonable real-world ranges.",
        whyItMatters: "Catches suspicious values that could indicate data errors, unusual accounting, or computation issues.",
        howToCalculate: "Each metric is tested against predefined acceptable ranges. Violations are flagged as warnings.",
        interpretation: "'PASSED' means all metrics are within expected ranges. 'WARNING' means one or more metrics have suspicious values.",
        commonMisconceptions: "A warning doesn't necessarily mean the data is wrong -- some companies have genuinely extreme metrics."
    },

    /* -- AI Perspectives -- */
    "AI Analyst": {
        title: "Professional Analyst Perspective",
        definition: "An AI-generated analysis written in the style of a professional equity research analyst.",
        whyItMatters: "Provides a structured, analytical narrative that synthesizes all the financial data into a coherent assessment.",
        howToCalculate: "Generated by feeding financial ratios, quality scores, benchmarks, and stance to AI models",
        interpretation: "Read this for a balanced, data-driven perspective. The AI considers multiple factors simultaneously.",
        commonMisconceptions: "This is AI-generated educational content, not professional investment advice. Always do your own research."
    },
    "AI Contrarian": {
        title: "Contrarian Risk Perspective",
        definition: "An AI-generated counter-argument that intentionally looks for risks, weaknesses, and reasons to be cautious.",
        whyItMatters: "Helps avoid confirmation bias by presenting the bear case. Every investment has risks that should be understood.",
        howToCalculate: "Generated by feeding financial data to Llama 3.3 70B via Groq, with a contrarian-focused prompt",
        interpretation: "Don't ignore this view. Even if you're bullish, understanding the risks helps set realistic expectations.",
        commonMisconceptions: "The contrarian view isn't necessarily correct -- it's designed to challenge your assumptions, not to scare you."
    },
    "AI Educator": {
        title: "Educational Perspective",
        definition: "An AI-generated explanation that teaches you what the financial data means in simple, accessible language.",
        whyItMatters: "Perfect for learning. Breaks down complex financial concepts so anyone can understand what the numbers say about this company.",
        howToCalculate: "Generated by feeding financial ratios and stance to AI models with an educator-focused prompt",
        interpretation: "Use this to build your financial literacy. It explains WHY metrics matter, not just WHAT they are.",
        commonMisconceptions: "Simplified explanations may omit nuances. As you learn more, graduate to the professional analyst view."
    },
    "Shareholding Pattern": {
        title: "Shareholding Pattern",
        definition: "Breakdown of company ownership across promoters, institutional investors, government, and public shareholders.",
        whyItMatters: "Stable promoter and institutional ownership often signals confidence and long-term alignment.",
        howToCalculate: "Reported in quarterly shareholding filings",
        interpretation: "Rising institutional stake is typically positive. Sharp drops may require investigation.",
        commonMisconceptions: "High promoter holding isn't always good if governance standards are weak."
    },
    "Promoter Holding": {
        title: "Promoter Holding",
        definition: "Percentage of shares held by company founders, promoters, or controlling shareholders.",
        whyItMatters: "Higher promoter stake can align management with shareholder interests.",
        howToCalculate: "Promoter Shares / Total Shares x 100",
        interpretation: "Stable or rising promoter holding is often a positive signal.",
        commonMisconceptions: "Very high promoter holding can reduce public float and liquidity."
    },
    "FII Holding": {
        title: "FII Holding",
        definition: "Percentage of shares owned by Foreign Institutional Investors.",
        whyItMatters: "FII participation can signal global investor confidence and liquidity.",
        howToCalculate: "FII Shares / Total Shares x 100",
        interpretation: "Increasing FII stake often reflects positive sentiment.",
        commonMisconceptions: "FII flows can be volatile and may reverse quickly."
    },
    "DII Holding": {
        title: "DII Holding",
        definition: "Percentage of shares owned by Domestic Institutional Investors like mutual funds and insurers.",
        whyItMatters: "DII participation suggests domestic conviction and stability.",
        howToCalculate: "DII Shares / Total Shares x 100",
        interpretation: "Rising DII holdings can cushion volatility during market sell-offs.",
        commonMisconceptions: "DIIs may increase holdings for index-tracking reasons, not fundamentals."
    },
    "Operating Cash Flow": {
        title: "Operating Cash Flow",
        definition: "Cash generated from a company's core business operations.",
        whyItMatters: "Strong operating cash flow means profits are backed by real cash, not just accounting gains.",
        howToCalculate: "Cash From Operations in the cash flow statement",
        interpretation: "Consistent positive OCF is a quality signal.",
        commonMisconceptions: "One-time working capital changes can temporarily inflate OCF."
    },
    "Net Cash Flow": {
        title: "Net Cash Flow",
        definition: "Total change in cash after operating, investing, and financing activities.",
        whyItMatters: "Shows whether the company's cash balance is growing or shrinking overall.",
        howToCalculate: "Operating CF + Investing CF + Financing CF",
        interpretation: "Positive net cash flow indicates rising cash reserves.",
        commonMisconceptions: "Negative net cash flow isn't always bad if driven by growth investments."
    },
}

export function MetricExplanationModal({
    metric,
    isOpen,
    onClose,
    metricValues,
    metricImpacts,
}: {
    metric: string;
    isOpen: boolean;
    onClose: () => void;
    metricValues?: Record<string, string>;
    metricImpacts?: Record<string, string>;
}) {
    const explanation = metricExplanations[metric] || {
        title: metric,
        definition: "Educational content for this metric is currently being prepared.",
        whyItMatters: "Stay tuned for a detailed explanation.",
        howToCalculate: "N/A",
        interpretation: "N/A",
        commonMisconceptions: "N/A"
    }
    const currentValue = metricValues?.[metric]
    const impact = metricImpacts?.[metric]
    const hasCurrentValue = Boolean(currentValue && currentValue !== "N/A")
    const hasImpact = Boolean(impact)

    return (
        <Modal open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden border border-slate-700 shadow-2xl rounded-2xl bg-slate-900 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="relative p-6 pb-5 border-b border-slate-700/50">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/8 via-transparent to-emerald-500/8" />
                    <div className="relative z-10 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center border border-orange-500/20">
                                <GraduationCap className="h-5 w-5 text-orange-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <Badge variant="secondary" className="bg-slate-800 text-orange-300 border-orange-500/20 font-medium tracking-wide text-[10px] mb-1">
                                    Metric Deep Dive
                                </Badge>
                                <DialogTitle className="text-xl font-bold text-white tracking-tight leading-tight">
                                    {explanation.title}
                                </DialogTitle>
                            </div>
                        </div>
                        <DialogDescription className="text-slate-300 text-sm leading-relaxed font-medium">
                            {explanation.definition}
                        </DialogDescription>
                    </div>
                </div>

                {/* Current Value + Impact Snapshot */}
                {(hasCurrentValue || hasImpact) && (
                    <div className="px-6 py-4 border-b border-slate-700/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {hasCurrentValue && (
                                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Current Value</div>
                                    <div className="text-2xl font-extrabold bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">{currentValue}</div>
                                </div>
                            )}
                            {hasImpact && (
                                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Impact Snapshot</div>
                                    <div className="text-sm font-medium text-slate-200 leading-relaxed">{impact}</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Content Grid */}
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Why it Matters */}
                        <div className="group bg-slate-800/60 p-4 rounded-xl border border-slate-700 hover:border-orange-500/30 transition-all duration-300">
                            <div className="flex items-center gap-2.5 mb-2.5">
                                <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
                                    <Landmark className="h-4 w-4" />
                                </div>
                                <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wide">Why it Matters</h4>
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed">{explanation.whyItMatters}</p>
                        </div>

                        {/* How to Calculate */}
                        <div className="group bg-slate-800/60 p-4 rounded-xl border border-slate-700 hover:border-slate-500/50 transition-all duration-300">
                            <div className="flex items-center gap-2.5 mb-2.5">
                                <div className="p-1.5 rounded-lg bg-slate-700 text-slate-300">
                                    <Calculator className="h-4 w-4" />
                                </div>
                                <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wide">How to Calculate</h4>
                            </div>
                            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-600">
                                <code className="text-xs font-mono text-orange-300 font-semibold block break-words leading-relaxed">
                                    {explanation.howToCalculate}
                                </code>
                            </div>
                        </div>

                        {/* Signal Check */}
                        <div className="group bg-slate-800/60 p-4 rounded-xl border border-slate-700 hover:border-emerald-500/30 transition-all duration-300">
                            <div className="flex items-center gap-2.5 mb-2.5">
                                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                                    <TrendingUp className="h-4 w-4" />
                                </div>
                                <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wide">Signal Check</h4>
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed">{explanation.interpretation}</p>
                        </div>

                        {/* Risk Factor */}
                        <div className="group bg-slate-800/60 p-4 rounded-xl border border-slate-700 hover:border-amber-500/30 transition-all duration-300">
                            <div className="flex items-center gap-2.5 mb-2.5">
                                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                                    <AlertCircle className="h-4 w-4" />
                                </div>
                                <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wide">Risk Factor</h4>
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed">{explanation.commonMisconceptions}</p>
                        </div>
                    </div>

                    {/* Pro Tip */}
                    <div className="relative overflow-hidden p-4 bg-slate-800 rounded-xl border border-orange-500/15">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10 flex items-start gap-3">
                            <div className="p-1.5 rounded-full bg-orange-500/15 shrink-0 mt-0.5">
                                <AlertCircle className="h-4 w-4 text-orange-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-orange-300 text-xs uppercase tracking-wide mb-1">Analyst Pro Tip</h4>
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    Always analyze metrics in context. Compare <span className="text-white font-semibold">{explanation.title}</span> with {explanation.title.includes("P/E") ? "growth rates" : explanation.title.includes("Debt") ? "cash flow" : "industry peers"} to get the full picture.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Modal>
    )
}
