"use client"

import { useParams } from "next/navigation"
import * as React from "react"
import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs"
import { ArrowLeft, Download, Share2, TrendingUp, TrendingDown, AlertTriangle, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { apiUrl } from "@/lib/api"
import { MetricExplanationModal } from "@/components/MetricExplanationModal"
import { InfoTip } from "@/components/InfoTip"
import toast from "react-hot-toast"
import FinancialCharts from "./sections/FinancialCharts"
import ShareholdingCard from "./sections/ShareholdingCard"
import FundamentalScorecard from "./sections/FundamentalScorecard"
import BenchmarkComparison from "./sections/BenchmarkComparison"
import AIPerspectives from "./sections/AIPerspectives"
import KeyRatiosSummary from "./sections/KeyRatiosSummary"
import type { AnalysisData, Financials } from "./types"

const EMPTY_FINANCIALS: Financials = {
    income_statement: {},
    balance_sheet: {},
    cashflow: {},
    ratios_table: {},
}

const formatNumber = (value?: number | null, digits = 2) => {
    if (value === null || value === undefined) return "N/A"
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: digits }).format(value)
}

const formatPercent = (value?: number | null, digits = 1) => {
    if (value === null || value === undefined) return "N/A"
    return `${value.toFixed(digits)}%`
}

const formatCurrency = (value?: number | null) => {
    if (value === null || value === undefined) return "N/A"
    return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value)}`
}

const formatMarketCap = (value?: number | null) => {
    if (value === null || value === undefined) return "N/A"
    return `₹${formatNumber(value, 2)} Cr`
}

const formatHighLow = (value?: string | number | null) => {
    if (value === null || value === undefined) return "N/A"
    if (typeof value === "number") {
        return `High: ₹${formatNumber(value, 2)} | Low: N/A`
    }

    const cleaned = value.trim()
    if (!cleaned) return "N/A"

    const nums = cleaned.replace(/₹/g, "").match(/\d[\d,]*(?:\.\d+)?/g) ?? []
    if (nums.length >= 2) {
        return `High: ₹${nums[0]} | Low: ₹${nums[1]}`
    }
    if (nums.length === 1) {
        return `High: ₹${nums[0]} | Low: N/A`
    }

    return cleaned
}

const getStatementValue = (
    statement: Record<string, Record<string, number | null>>,
    field: string,
    periodsAgo = 0
) => {
    const dates = Object.keys(statement || {}).sort((a, b) => b.localeCompare(a))
    if (dates.length <= periodsAgo) return null
    const target = dates[periodsAgo]
    return statement[target]?.[field] ?? null
}

const computeCagr = (
    statement: Record<string, Record<string, number | null>>,
    field: string,
    periodsAgo = 2
) => {
    const latest = getStatementValue(statement, field, 0)
    const earlier = getStatementValue(statement, field, periodsAgo)
    if (latest !== null && earlier !== null && latest > 0 && earlier > 0) {
        return ((latest / earlier) ** (1 / periodsAgo) - 1) * 100
    }
    return null
}

const MetricCard = ({
    label,
    value,
    metricKey,
    accent,
    onInfo,
}: {
    label: string
    value: string
    metricKey: string
    accent: string
    onInfo: (metric: string) => void
}) => (
    <Card className="p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border border-slate-700 overflow-hidden relative bg-slate-800 group">
        <div className={cn("absolute inset-0 opacity-10 pointer-events-none bg-gradient-to-br", accent)} />
        <div className="flex items-start justify-between mb-2 relative z-10">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide group-hover:text-slate-300 transition-colors">{label}</span>
            <InfoTip metricKey={metricKey} onClick={onInfo} light />
        </div>
        <div className={cn("text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r relative z-10", accent)}>
            {value}
        </div>
    </Card>
)

export default function AnalysisClient() {
    const params = useParams()
    const symbol = params.symbol as string
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [data, setData] = useState<AnalysisData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const aiRef = React.useRef<HTMLDivElement>(null)
    const [aiVisible, setAiVisible] = useState(false)
    const [aiInsights, setAiInsights] = useState<AnalysisData["ai_insights"] | null>(null)
    const [aiLoading, setAiLoading] = useState(false)
    const [pdfLoading, setPdfLoading] = useState(false)
    const [shareLoading, setShareLoading] = useState(false)

    const getReportUrl = (hasInsights: boolean) => apiUrl(`/api/report/${symbol}?insights=${hasInsights}`)

    const handleExportPDF = async () => {
        setPdfLoading(true)
        try {
            const hasInsights = !!(aiInsights?.analyst || aiInsights?.contrarian || aiInsights?.educator || aiInsights?.final_verdict)
            const url = getReportUrl(hasInsights)
            const a = document.createElement("a")
            a.href = url
            a.target = "_blank"
            a.rel = "noopener noreferrer"
            document.body.appendChild(a)
            a.click()
            a.remove()
        } catch (err) {
            console.error("PDF export failed", err)
        } finally {
            setPdfLoading(false)
        }
    }

    const handleSharePDF = async () => {
        setShareLoading(true)
        try {
            const hasInsights = !!(aiInsights?.analyst || aiInsights?.contrarian || aiInsights?.educator || aiInsights?.final_verdict)
            const reportUrl = getReportUrl(hasInsights)
            const shareData = {
                title: `${symbol.toUpperCase()} Analysis Report`,
                text: `Stock analysis report for ${symbol.toUpperCase()} from StoryStock.`,
                url: reportUrl,
            }

            if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
                await navigator.share(shareData)
                return
            }

            await navigator.clipboard.writeText(reportUrl)
            toast.success("Report link copied. Share it anywhere.")
        } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") {
                return
            }
            const hasInsights = !!(aiInsights?.analyst || aiInsights?.contrarian || aiInsights?.educator || aiInsights?.final_verdict)
            const reportUrl = getReportUrl(hasInsights)
            try {
                await navigator.clipboard.writeText(reportUrl)
                toast.success("Report link copied. Share it anywhere.")
            } catch {
                toast.error("Unable to share right now. Please try again.")
            }
        } finally {
            setShareLoading(false)
        }
    }

    React.useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                const res = await fetch(apiUrl(`/api/analysis/${symbol}?include=financials&insights=true`))
                const json = await res.json()
                setData(json)
                const hasAi = json?.ai_insights && (
                    json.ai_insights.analyst ||
                    json.ai_insights.contrarian ||
                    json.ai_insights.educator ||
                    json.ai_insights.final_verdict
                )
                setAiInsights(hasAi ? json.ai_insights : null)
            } catch (err) {
                console.error("Failed to fetch analysis", err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [symbol])

    React.useEffect(() => {
        const node = aiRef.current
        if (!node) return
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    setAiVisible(true)
                    observer.disconnect()
                }
            },
            { rootMargin: "200px" }
        )
        observer.observe(node)
        return () => observer.disconnect()
    }, [aiRef])

    React.useEffect(() => {
        if (!aiVisible || aiLoading || aiInsights) return
        const fetchInsights = async () => {
            setAiLoading(true)
            try {
                const res = await fetch(apiUrl(`/api/insights/${symbol}?include=financials`))
                const json = await res.json()
                if (json?.ai_insights) {
                    setAiInsights(json.ai_insights)
                } else {
                    setAiInsights(null)
                }
            } catch {
                console.error("Failed to fetch AI insights")
                setAiInsights(null)
            } finally {
                setAiLoading(false)
            }
        }
        fetchInsights()
    }, [aiVisible, aiLoading, aiInsights, symbol])

    const openExplanation = (metric: string) => {
        setSelectedMetric(metric)
        setIsModalOpen(true)
    }

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-20 text-center">
                <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-slate-900 font-medium">StoryStock is analyzing {symbol.toUpperCase()}...</p>
            </div>
        )
    }

    if (!data) return <div className="p-20 text-center text-slate-900 font-medium">StoryStock could not load this analysis. Please try again.</div>

    const financials = data.financials ?? EMPTY_FINANCIALS
    const keyRatios = data.key_ratios ?? {}
    const shareholding = data.shareholding ?? {}
    const promoterHolding = keyRatios.promoter_holding ?? shareholding.Promoters

    const netIncomeCagr = computeCagr(financials.income_statement, "Net Income")
    const salesGrowth5y = computeCagr(financials.income_statement, "Total Revenue", 5)
    const opmPercent = getStatementValue(financials.income_statement, "OPM_Percent")
    const latestRevenue = getStatementValue(financials.income_statement, "Total Revenue")
    const latestNetProfit = getStatementValue(financials.income_statement, "Net Income")
    const latestDividendPayout = getStatementValue(financials.income_statement, "Dividend Payout Percent")
    const ebit = getStatementValue(financials.income_statement, "EBIT")
    const interestExpense = getStatementValue(financials.income_statement, "Interest Expense")
    const interestCoverage = ebit && interestExpense && interestExpense !== 0 ? ebit / interestExpense : null
    const priceToBook = keyRatios.book_value && data.price?.current ? data.price.current / keyRatios.book_value : null
    const quickFacts = [
        { label: "Revenue", key: "Revenue", value: latestRevenue != null ? `${formatNumber(latestRevenue, 0)} Cr` : "N/A" },
        { label: "Profit", key: "Net Profit", value: latestNetProfit != null ? `${formatNumber(latestNetProfit, 0)} Cr` : "N/A" },
        { label: "Sales Growth (5Y)", key: "Revenue Growth", value: formatPercent(salesGrowth5y, 2) },
        { label: "Dividend Payout", key: "Dividend Payout", value: formatPercent(latestDividendPayout, 1) },
        { label: "Promoter Holding", key: "Promoter Holding", value: promoterHolding != null ? `${promoterHolding}%` : "N/A" },
    ].filter((fact) => fact.value !== "N/A")

    const tabs = [
        {
            id: "growth",
            label: "Growth",
            items: [
                {
                    label: "Revenue CAGR (3Y)",
                    key: "Revenue Growth",
                    value: formatPercent(data.ratios.growth_trends.revenue_cagr_3y),
                    trend: (data.ratios.growth_trends.revenue_cagr_3y ?? 0) > 10 ? "up" : "down",
                    benchmark: "N/A",
                },
                {
                    label: "Net Income CAGR (3Y)",
                    key: "Net Income Growth",
                    value: formatPercent(netIncomeCagr),
                    trend: (netIncomeCagr ?? 0) > 10 ? "up" : "down",
                    benchmark: "N/A",
                },
                {
                    label: "Margin Stability",
                    key: "Margin Stability",
                    value: data.ratios.growth_trends.margin_stability ?? "N/A",
                    trend: data.ratios.growth_trends.margin_stability === "Stable" ? "up" : "down",
                    benchmark: "Stable",
                },
            ],
        },
        {
            id: "profitability",
            label: "Profitability",
            items: [
                {
                    label: "Return on Equity (ROE)",
                    key: "ROE",
                    value: formatPercent(data.ratios.profitability.roe),
                    trend: "up",
                    benchmark: data.benchmarks.averages.avg_roe != null ? `${data.benchmarks.averages.avg_roe}%` : "N/A",
                },
                {
                    label: "Return on Assets (ROA)",
                    key: "ROA",
                    value: formatPercent(data.ratios.profitability.roa),
                    trend: "up",
                    benchmark: "15%",
                },
                {
                    label: "Net Margin",
                    key: "Net Margin",
                    value: formatPercent(data.ratios.profitability.net_margin),
                    trend: "up",
                    benchmark: data.benchmarks.averages.avg_net_margin != null ? `${data.benchmarks.averages.avg_net_margin}%` : "N/A",
                },
                {
                    label: "ROCE",
                    key: "ROCE",
                    value: formatPercent(keyRatios.roce),
                    trend: (keyRatios.roce ?? 0) > 15 ? "up" : "down",
                    benchmark: "N/A",
                },
                {
                    label: "OPM %",
                    key: "OPM",
                    value: formatPercent(opmPercent),
                    trend: (opmPercent ?? 0) > 15 ? "up" : "down",
                    benchmark: "N/A",
                },
            ],
        },
        {
            id: "leverage",
            label: "Leverage",
            items: [
                {
                    label: "Debt to Equity",
                    key: "Debt to Equity",
                    value: formatNumber(data.ratios.leverage.debt_to_equity, 2),
                    trend: (data.ratios.leverage.debt_to_equity ?? 0) < 1 ? "up" : "down",
                    benchmark: data.benchmarks.averages.avg_debt_equity != null ? `${data.benchmarks.averages.avg_debt_equity}` : "N/A",
                },
                {
                    label: "Interest Coverage",
                    key: "Interest Coverage",
                    value: formatNumber(interestCoverage, 2),
                    trend: (interestCoverage ?? 0) > 3 ? "up" : "down",
                    benchmark: "N/A",
                },
            ],
        },
        {
            id: "valuation",
            label: "Valuation",
            items: [
                {
                    label: "P/E Ratio",
                    key: "PE",
                    value: formatNumber(data.ratios.valuation.pe_ratio, 1),
                    trend: "up",
                    benchmark: data.benchmarks.averages.avg_pe != null ? `${data.benchmarks.averages.avg_pe}` : "N/A",
                },
                {
                    label: "Price to Book",
                    key: "Price to Book",
                    value: formatNumber(priceToBook, 2),
                    trend: (priceToBook ?? 0) < 3 ? "up" : "down",
                    benchmark: "N/A",
                },
                {
                    label: "Dividend Yield",
                    key: "Dividend Yield",
                    value: formatPercent(keyRatios.dividend_yield),
                    trend: (keyRatios.dividend_yield ?? 0) > 1 ? "up" : "down",
                    benchmark: "N/A",
                },
            ],
        },
        {
            id: "quality",
            label: "Quality",
            items: [
                {
                    label: "Piotroski F-Score",
                    key: "F-Score",
                    value: data.ratios.quality_scores.piotroski_f_score != null ? `${data.ratios.quality_scores.piotroski_f_score}/9` : "N/A",
                    trend: "up",
                    benchmark: "6/9",
                },
            ],
        },
    ]

    const aiData = aiInsights ?? data.ai_insights
    const aiFallback = aiLoading ? "Loading insights..." : "AI insights not loaded yet."

    const keyMetricsRow1 = [
        {
            label: "ROE",
            value: formatPercent(data.ratios.profitability.roe),
            key: "ROE",
            accent: "from-orange-500 to-amber-400",
        },
        {
            label: "ROCE",
            value: formatPercent(keyRatios.roce),
            key: "ROCE",
            accent: "from-orange-500 to-amber-400",
        },
        {
            label: "Net Margin",
            value: formatPercent(data.ratios.profitability.net_margin),
            key: "Net Margin",
            accent: "from-emerald-500 to-green-400",
        },
        {
            label: "D/E",
            value: formatNumber(data.ratios.leverage.debt_to_equity, 2),
            key: "Debt to Equity",
            accent: "from-amber-500 to-orange-400",
        },
        {
            label: "P/E",
            value: formatNumber(data.ratios.valuation.pe_ratio, 1),
            key: "PE",
            accent: "from-blue-500 to-blue-300",
        },
    ]

    const keyMetricsRow2 = [
        {
            label: "F-Score",
            value: data.ratios.quality_scores.piotroski_f_score != null ? `${data.ratios.quality_scores.piotroski_f_score}/9` : "N/A",
            key: "F-Score",
            accent: "from-orange-500 to-amber-300",
        },
        {
            label: "Revenue CAGR",
            value: formatPercent(data.ratios.growth_trends.revenue_cagr_3y),
            key: "Revenue Growth",
            accent: "from-emerald-500 to-green-400",
        },
        {
            label: "Overall /10",
            value: data.stance.overall_score != null ? `${data.stance.overall_score}/10` : "N/A",
            key: "Overall Stance",
            accent: "from-orange-500 to-amber-400",
        },
        {
            label: "Dividend Yield",
            value: formatPercent(keyRatios.dividend_yield),
            key: "Dividend Yield",
            accent: "from-emerald-500 to-green-400",
        },
    ]

    const metricValues: Record<string, string> = {
        "Overall Stance": data.stance.overall_stance,
        "Market Cap": formatMarketCap(keyRatios.market_cap),
        "Revenue": latestRevenue != null ? `${formatNumber(latestRevenue, 0)} Cr` : "N/A",
        "Net Profit": latestNetProfit != null ? `${formatNumber(latestNetProfit, 0)} Cr` : "N/A",
        "Book Value": formatCurrency(keyRatios.book_value),
        "Dividend Payout": formatPercent(latestDividendPayout, 1),
        "Dividend Yield": formatPercent(keyRatios.dividend_yield),
        "ROE": formatPercent(data.ratios.profitability.roe),
        "ROCE": formatPercent(keyRatios.roce),
        "Net Margin": formatPercent(data.ratios.profitability.net_margin),
        "ROA": formatPercent(data.ratios.profitability.roa),
        "Debt to Equity": formatNumber(data.ratios.leverage.debt_to_equity, 2),
        "PE": formatNumber(data.ratios.valuation.pe_ratio, 1),
        "Price to Book": formatNumber(priceToBook, 2),
        "F-Score": data.ratios.quality_scores.piotroski_f_score != null ? `${data.ratios.quality_scores.piotroski_f_score}/9` : "N/A",
        "Revenue Growth": formatPercent(data.ratios.growth_trends.revenue_cagr_3y),
        "Net Income Growth": formatPercent(netIncomeCagr),
        "Margin Stability": data.ratios.growth_trends.margin_stability ?? "N/A",
        "OPM": formatPercent(opmPercent),
        "Interest Coverage": formatNumber(interestCoverage, 2),
        "Data Confidence": `${data.integrity_audit.data_completeness?.confidence ?? 0}%`,
        "Audit Status": data.integrity_audit.is_valid ? "PASSED" : "WARNING",
        "Promoter Holding": promoterHolding != null ? `${promoterHolding}%` : "N/A",
        "FII Holding": shareholding.FIIs != null ? `${shareholding.FIIs}%` : "N/A",
        "DII Holding": shareholding.DIIs != null ? `${shareholding.DIIs}%` : "N/A",
    }

    const metricImpacts: Record<string, string> = {
        "ROE": data.ratios.profitability.roe != null
            ? data.ratios.profitability.roe >= 15
                ? "Healthy return on equity suggests strong profitability."
                : "Lower ROE points to room for efficiency gains."
            : "Insufficient data to assess ROE impact.",
        "ROCE": keyRatios.roce != null
            ? keyRatios.roce >= 15
                ? "Capital is being employed efficiently."
                : "Capital efficiency could be improved."
            : "Insufficient data to assess ROCE impact.",
        "Net Margin": data.ratios.profitability.net_margin != null
            ? data.ratios.profitability.net_margin >= 10
                ? "Solid margins provide a buffer against volatility."
                : "Thin margins may pressure earnings in downturns."
            : "Insufficient data to assess margin impact.",
        "Debt to Equity": data.ratios.leverage.debt_to_equity != null
            ? data.ratios.leverage.debt_to_equity <= 1
                ? "Leverage looks manageable at current levels."
                : "Higher leverage increases balance-sheet risk."
            : "Insufficient data to assess leverage impact.",
        "PE": data.ratios.valuation.pe_ratio != null
            ? data.ratios.valuation.pe_ratio <= 15
                ? "Valuation appears relatively conservative."
                : data.ratios.valuation.pe_ratio >= 30
                    ? "Premium valuation implies high growth expectations."
                    : "Valuation looks broadly fair versus earnings."
            : "Insufficient data to assess valuation impact.",
        "Price to Book": priceToBook != null
            ? priceToBook <= 1.5
                ? "Stock trades close to its asset value."
                : priceToBook >= 3
                    ? "Market is pricing in a premium to assets."
                    : "Price-to-book suggests balanced expectations."
            : "Insufficient data to assess price-to-book impact.",
        "Dividend Yield": keyRatios.dividend_yield != null
            ? keyRatios.dividend_yield >= 1
                ? "Dividend yield adds an income cushion."
                : "Dividend yield is modest right now."
            : "Insufficient data to assess dividend impact.",
        "Interest Coverage": interestCoverage != null
            ? interestCoverage >= 3
                ? "Earnings comfortably cover interest obligations."
                : "Interest coverage is tight, monitor debt servicing."
            : "Insufficient data to assess interest coverage.",
        "Revenue Growth": data.ratios.growth_trends.revenue_cagr_3y != null
            ? data.ratios.growth_trends.revenue_cagr_3y >= 10
                ? "Strong revenue growth supports long-term compounding."
                : "Growth appears moderate; monitor momentum."
            : "Insufficient data to assess revenue growth impact.",
        "Revenue": latestRevenue != null
            ? "Revenue level reflects current scale of business operations."
            : "Insufficient data to assess current revenue.",
        "Net Profit": latestNetProfit != null
            ? "Net profit indicates post-tax earnings available to shareholders."
            : "Insufficient data to assess current profitability.",
        "Dividend Payout": latestDividendPayout != null
            ? latestDividendPayout >= 30
                ? "Higher payout indicates stronger profit distribution to shareholders."
                : "Lower payout suggests profits are being retained for growth."
            : "Insufficient data to assess dividend payout.",
        "Net Income Growth": netIncomeCagr != null
            ? netIncomeCagr >= 10
                ? "Profit growth is accelerating with scale."
                : "Profit growth is modest; watch margin leverage."
            : "Insufficient data to assess profit growth impact.",
        "F-Score": data.ratios.quality_scores.piotroski_f_score != null
            ? data.ratios.quality_scores.piotroski_f_score >= 7
                ? "Strong fundamental quality score."
                : data.ratios.quality_scores.piotroski_f_score >= 4
                    ? "Average fundamental quality score."
                    : "Weak quality score; investigate drivers."
            : "Insufficient data to assess F-Score impact.",
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 animate-slide-down">
            {/* ═══ Header ═══ */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 md:gap-6 mb-8 bg-slate-800/90 p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-2xl relative overflow-hidden group border-t-4 border-amber-400">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.12),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.18),transparent_55%)]" />

                <div className="flex items-start gap-3 md:gap-6 relative z-10 w-full">
                    <Link href="/" className="no-print">
                        <Button variant="ghost" size="icon" className="rounded-full mt-0.5 shrink-0 text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                            <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 md:gap-4">
                            <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-white tracking-tight" style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.6)" }}>{data.symbol}</h1>
                            <div className="flex items-center gap-2">
                                <Badge className="px-2.5 md:px-3 py-1 text-[10px] sm:text-xs md:text-sm uppercase tracking-wider font-bold whitespace-nowrap bg-white/10 text-white border-white/20 backdrop-blur-md shadow-sm">{data.stance.overall_stance}</Badge>
                                <InfoTip metricKey="Overall Stance" onClick={openExplanation} light />
                            </div>
                        </div>
                        <p className="text-base sm:text-xl md:text-2xl font-bold text-amber-100 mt-1 tracking-wide drop-shadow-md">{data.profile.name}</p>

                        {/* Sector & Industry Pills */}
                        <div className="flex flex-wrap gap-2 mt-3 mb-3">
                            {data.profile.sector && (
                                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-slate-900/60 text-emerald-200 border border-emerald-500/20 shadow-sm">
                                    {data.profile.sector}
                                </span>
                            )}
                            {data.profile.industry && (
                                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-slate-900/60 text-orange-200 border border-orange-500/20 shadow-sm">
                                    {data.profile.industry}
                                </span>
                            )}
                        </div>

                        {quickFacts.length > 0 && (
                            <div className="bg-slate-900/40 rounded-xl p-2.5 sm:p-3 border border-white/5 backdrop-blur-sm mt-2 max-w-3xl">
                                <div className="flex flex-wrap gap-2">
                                    {quickFacts.map((fact) => (
                                        <div key={fact.label} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80">
                                            <span className="text-[11px] uppercase tracking-wide font-semibold text-slate-400">{fact.label}</span>
                                            <span className="text-xs md:text-sm font-bold text-slate-100">{fact.value}</span>
                                            <InfoTip metricKey={fact.key} onClick={openExplanation} light />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-2 mt-4 ml-1">
                            <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                            <p className="text-[9px] sm:text-[10px] md:text-xs uppercase tracking-widest text-amber-200 font-bold opacity-80">StoryStock Analysis</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4 md:items-end relative z-10 w-full md:w-auto md:min-w-[320px]">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 text-left md:text-right w-full">
                        <div className="col-span-2">
                            <div className="text-xs text-slate-400 uppercase tracking-wide md:text-right">Price</div>
                            <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent tracking-tight drop-shadow-sm break-words sm:whitespace-nowrap tabular-nums">{formatCurrency(data.price.current)}</div>
                            <p className="text-[11px] text-slate-400 font-medium mt-1 leading-relaxed">
                                Price shown is from the previous market day and is not live market data.
                            </p>
                        </div>
                        <div>
                            <div className="flex items-center justify-start md:justify-end gap-1 text-xs text-slate-400 uppercase tracking-wide">
                                Market Cap
                                <InfoTip metricKey="Market Cap" onClick={openExplanation} light />
                            </div>
                            <div className="text-lg font-bold text-white">{formatMarketCap(keyRatios.market_cap)}</div>
                        </div>
                        <div>
                            <div className="flex items-center justify-start md:justify-end gap-1 text-xs text-slate-400 uppercase tracking-wide">
                                Book Value
                                <InfoTip metricKey="Book Value" onClick={openExplanation} light />
                            </div>
                            <div className="text-sm font-semibold text-slate-100">{formatCurrency(keyRatios.book_value)}</div>
                        </div>
                        <div className="col-span-2">
                            <div className="text-xs text-slate-400 uppercase tracking-wide">52W High/Low</div>
                            <div className="text-xs sm:text-sm font-semibold text-slate-100">{formatHighLow(keyRatios.high_low)}</div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-start md:justify-end gap-2">
                        <Badge className="px-3 py-1 text-xs uppercase tracking-wider font-bold bg-emerald-500/20 text-emerald-200 border-emerald-500/30">Dividend Yield {formatPercent(keyRatios.dividend_yield)}</Badge>
                        <InfoTip metricKey="Dividend Yield" onClick={openExplanation} light />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        <Button
                            className="w-full md:w-auto justify-center rounded-full shadow-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 font-bold px-6 transition-all duration-300 no-print"
                            onClick={handleSharePDF}
                            loading={shareLoading}
                        >
                            <Share2 className="h-4 w-4 mr-2" /> Share PDF
                        </Button>
                        <Button
                            className="w-full md:w-auto justify-center rounded-full shadow-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 border-none font-bold px-6 hover:shadow-amber-500/25 hover:scale-105 transition-all duration-300 no-print disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                            onClick={handleExportPDF}
                            disabled={pdfLoading}
                        >
                            {pdfLoading ? (
                                <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" /> Generating...</>
                            ) : (
                                <><Download className="h-4 w-4 mr-2" /> Export PDF</>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* ═══ KEY METRICS DASHBOARD — 2 rows of 5 ═══ */}
            <div className="space-y-4 mb-10">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                    {keyMetricsRow1.map((metric) => (
                        <MetricCard
                            key={metric.label}
                            label={metric.label}
                            value={metric.value}
                            metricKey={metric.key}
                            accent={metric.accent}
                            onInfo={openExplanation}
                        />
                    ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                    {keyMetricsRow2.map((metric) => (
                        <MetricCard
                            key={metric.label}
                            label={metric.label}
                            value={metric.value}
                            metricKey={metric.key}
                            accent={metric.accent}
                            onInfo={openExplanation}
                        />
                    ))}
                </div>
            </div>

            {/* ═══ Financial Charts ═══ */}
            <div className="mb-10">
                <FinancialCharts financials={financials} onInfo={openExplanation} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* ═══ Left Column ═══ */}
                <div className="lg:col-span-8 space-y-8">
                    {/* 1 ─ Stance Card */}
                    <Card variant="elevated" className="overflow-hidden border-none bg-gradient-to-br from-orange-500 to-emerald-600 text-white p-5 md:p-8">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4 font-bold uppercase tracking-widest text-sm text-white/90">
                                <ShieldCheck className="h-5 w-5" /> Overall Fundamental Stance
                                <InfoTip metricKey="Overall Stance" onClick={openExplanation} light />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold mb-4">{data.stance.overall_stance}</h2>
                            <div className="text-white/90 text-base leading-relaxed max-w-2xl font-medium whitespace-pre-line">
                                {aiData.final_verdict || aiFallback}
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                    </Card>

                    {/* 2 ─ Financial Metrics Tabs */}
                    <Card className="bg-slate-800 border-slate-700 shadow-xl overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                        <CardHeader className="border-b border-slate-700 pb-4 relative z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                        <TrendingUp className="h-5 w-5 text-orange-400" />
                                    </div>
                                    <CardTitle className="text-xl font-bold tracking-tight text-white">Financial Metrics</CardTitle>
                                    <InfoTip metricKey="ROE" onClick={openExplanation} light />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 relative z-10">
                            <Tabs defaultValue="growth">
                                <TabsList className="mb-6 w-full justify-start overflow-x-auto scrollbar-hide bg-slate-900/50 p-1 rounded-xl border border-white/5">
                                    <TabsTrigger value="growth" className="whitespace-nowrap px-4 py-2 rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400 hover:text-white transition-all duration-300 font-medium">Growth</TabsTrigger>
                                    <TabsTrigger value="profitability" className="whitespace-nowrap px-4 py-2 rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400 hover:text-white transition-all duration-300 font-medium">Profitability</TabsTrigger>
                                    <TabsTrigger value="leverage" className="whitespace-nowrap px-4 py-2 rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400 hover:text-white transition-all duration-300 font-medium">Leverage</TabsTrigger>
                                    <TabsTrigger value="valuation" className="whitespace-nowrap px-4 py-2 rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400 hover:text-white transition-all duration-300 font-medium">Valuation</TabsTrigger>
                                    <TabsTrigger value="quality" className="whitespace-nowrap px-4 py-2 rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400 hover:text-white transition-all duration-300 font-medium">Quality</TabsTrigger>
                                </TabsList>

                                {tabs.map((tab) => (
                                    <TabsContent key={tab.id} value={tab.id} className="space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-300 print:!block print:!opacity-100">
                                        {tab.items.length > 0 ? (
                                            tab.items.map((metric) => (
                                                <div key={metric.label} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-slate-700 last:border-0 hover:bg-white/5 px-4 rounded-xl transition-all duration-200 gap-2 sm:gap-0 group/item">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-medium text-slate-300 text-sm sm:text-base group-hover/item:text-white transition-colors">{metric.label}</span>
                                                        <InfoTip metricKey={metric.key} onClick={openExplanation} light />
                                                    </div>
                                                    <div className="flex items-center justify-between sm:justify-end gap-4 md:gap-8 w-full sm:w-auto pl-8 sm:pl-0">
                                                        <div className="flex items-center gap-2 min-w-[80px] justify-end">
                                                            <span className="font-extrabold text-white text-xl tracking-tight">{metric.value || "N/A"}</span>
                                                            {metric.trend && (
                                                                metric.trend === "up" ? <TrendingUp className="h-4 w-4 text-emerald-400" /> : <TrendingDown className="h-4 w-4 text-rose-400" />
                                                            )}
                                                        </div>
                                                        <div className="text-xs sm:text-sm font-medium text-slate-400 bg-slate-900/50 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center">
                                                            <span className="md:hidden mr-1">Avg:</span>
                                                            <span className="hidden md:inline mr-1 text-slate-500">Avg: </span>
                                                            {metric.benchmark || "N/A"}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-12 text-center text-slate-400 text-sm font-medium bg-slate-900/20 rounded-xl border border-dashed border-slate-700">
                                                No specific {tab.label} data found for this period.
                                            </div>
                                        )}
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* 3 ─ Financial Integrity Audit */}
                    <Card className="bg-slate-800 border-slate-700 shadow-xl overflow-hidden">
                        <CardHeader className="border-b border-slate-700 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                                </div>
                                <CardTitle className="text-lg font-bold text-white">Financial Integrity Audit</CardTitle>
                                <InfoTip metricKey="Audit Status" onClick={openExplanation} light />
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4 pt-6">
                            {data.stance.red_flags.length > 0 ? (
                                data.stance.red_flags.map((flag: string, i: number) => (
                                    <div key={i} className="flex items-center gap-3 p-4 bg-rose-500/10 text-rose-200 rounded-xl text-sm font-semibold border border-rose-500/20 shadow-sm">
                                        <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
                                        {flag}
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 text-emerald-200 rounded-xl text-sm font-semibold border border-emerald-500/20 shadow-sm">
                                    <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
                                    No critical fundamental red flags detected.
                                </div>
                            )}
                            <div className="mt-2 p-5 rounded-xl bg-slate-900/50 border border-slate-700/50 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-2 font-medium text-slate-300 text-sm">Data Confidence <InfoTip metricKey="Data Confidence" onClick={openExplanation} light /></span>
                                    <span className="font-bold text-white text-base">{data.integrity_audit.data_completeness?.confidence ?? 0}%</span>
                                </div>
                                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" style={{ width: `${data.integrity_audit.data_completeness?.confidence ?? 0}%` }} />
                                </div>
                                <div className="flex justify-between items-center pt-1">
                                    <span className="flex items-center gap-2 font-medium text-slate-300 text-sm">Audit Checks <InfoTip metricKey="Audit Status" onClick={openExplanation} light /></span>
                                    <Badge variant="secondary" className={cn("font-bold px-3 py-1", data.integrity_audit.is_valid ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border-rose-500/30")}>
                                        {data.integrity_audit.is_valid ? "PASSED" : "WARNING"}
                                    </Badge>
                                </div>
                            </div>
                            <div className="mt-1 text-xs text-slate-500 font-medium text-center">Analysis provided by Trendova Hub</div>
                        </CardContent>
                    </Card>

                    {/* 4 ─ AI Perspectives */}
                    <AIPerspectives
                        ref={aiRef}
                        aiLoading={aiLoading}
                        aiData={aiData}
                        aiFallback={aiFallback}
                        onInfo={openExplanation}
                    />
                </div>

                {/* ═══ Right Column ═══ */}
                <div className="lg:col-span-4 space-y-6">
                    <FundamentalScorecard
                        scores={data.stance.pillar_scores}
                        overallScore={data.stance.overall_score}
                        onInfo={openExplanation}
                    />

                    <BenchmarkComparison
                        ratios={data.ratios}
                        averages={data.benchmarks.averages}
                        sector={data.benchmarks.sector}
                        onInfo={openExplanation}
                    />

                    <ShareholdingCard shareholding={shareholding} onInfo={openExplanation} />

                    <KeyRatiosSummary keyRatios={keyRatios} shareholding={shareholding} onInfo={openExplanation} />
                </div>
            </div>

            {/* Mandatory Disclaimer */}
            <div className="mt-20 pt-8 border-t border-slate-700 print-disclaimer">
                <h4 className="text-center font-bold text-[#FFD700] mb-4 print:block hidden">Legal Disclosure & Risk Disclaimer</h4>
                <p className="text-xs text-slate-400 leading-relaxed text-center max-w-4xl mx-auto font-medium">
                    DISCLAIMER: This report is an educational analysis generated by Trendova Hub, not fixed investment advice. All information is provided for learning purposes only.
                    We do not recommend buying, selling, or holding any securities. Past performance does not guarantee future results.
                    Stock market investments are subject to market risks. Please consult a SEBI-registered investment advisor before making any investment decisions.
                    Trendova Hub and its affiliates are not responsible for any financial losses.
                    Report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                </p>
                <p className="mt-4 text-[10px] text-slate-500 text-center opacity-80">
                    &copy; {new Date().getFullYear()} Trendova Hub | Assets Analysis Intelligence
                </p>
            </div>
            <MetricExplanationModal
                metric={selectedMetric || ""}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                metricValues={metricValues}
                metricImpacts={metricImpacts}
            />
        </div>
    )
}
