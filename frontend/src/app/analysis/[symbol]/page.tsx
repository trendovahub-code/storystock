"use client"

import { useParams } from "next/navigation"
import * as React from "react"
import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs"
import {
    ArrowLeft, Share2, Download, TrendingUp, TrendingDown,
    HelpCircle, AlertTriangle, ShieldCheck, Brain, MessageSquare, GraduationCap
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { MetricExplanationModal } from "@/components/MetricExplanationModal"
import { PriceChart } from "@/components/StockCharts"

interface PillarScores {
    business_quality: number;
    financial_safety: number;
    valuation_comfort: number;
}

interface BenchmarkComp {
    status: string;
    diff_pct: number;
}

interface AnalysisData {
    symbol: string;
    profile: {
        name: string;
        sector: string;
        industry: string;
        description: string;
    };
    price: {
        current: number;
        date: string;
        history: { date: string; close: number; volume: number }[];
    };
    ratios: {
        profitability: { roe: number; roa: number; net_margin: number };
        leverage: { debt_to_equity: number };
        valuation: { pe_ratio: number; price: number };
        quality_scores: { piotroski_f_score: number; altman_z_score: number };
        growth_trends: { revenue_cagr_3y: number; margin_stability: string; data_points: number };
    };
    stance: {
        overall_stance: string;
        pillar_scores: PillarScores;
        overall_score: number;
        red_flags: string[];
    };
    ai_insights: {
        analyst: string;
        contrarian: string;
        educator: string;
        final_verdict: string;
    };
    benchmarks: {
        sector: string;
        averages: { avg_roe: number; avg_pe: number; avg_debt_equity: number; avg_net_margin: number };
        comparisons: Record<string, BenchmarkComp>;
    };
    integrity_audit: {
        is_valid: boolean;
        warnings: string[];
        data_completeness: { nse_available: boolean; yf_available: boolean };
    };
}

export default function AnalysisPage() {
    const params = useParams()
    const symbol = params.symbol as string
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [data, setData] = useState<AnalysisData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    React.useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                const res = await fetch(`http://localhost:5000/api/analysis/${symbol}`)
                const json = await res.json()
                setData(json)
            } catch (err) {
                console.error("Failed to fetch analysis", err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [symbol])

    const openExplanation = (metric: string) => {
        setSelectedMetric(metric)
        setIsModalOpen(true)
    }

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-20 text-center">
                <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-slate-500">Generating institutional-grade report...</p>
            </div>
        )
    }

    if (!data) return <div className="p-20 text-center text-slate-500">Failed to load analysis. Ensure backend is running.</div>

    const tabs = [
        {
            id: "growth",
            label: "Growth",
            items: [
                { label: "Revenue CAGR (3Y)", key: "Revenue Growth", value: `${data.ratios.growth_trends.revenue_cagr_3y}%`, trend: data.ratios.growth_trends.revenue_cagr_3y > 10 ? "up" : "down", benchmark: `${data.benchmarks.averages.avg_net_margin}%` },
                { label: "Margin Stability", key: "Margin Stability", value: data.ratios.growth_trends.margin_stability, trend: data.ratios.growth_trends.margin_stability === "Stable" ? "up" : "down", benchmark: "Stable" },
            ]
        },
        {
            id: "profitability",
            label: "Profitability",
            items: [
                { label: "Return on Equity (ROE)", key: "ROE", value: `${data.ratios.profitability.roe?.toFixed(1)}%`, trend: "up", benchmark: `${data.benchmarks.averages.avg_roe}%` },
                { label: "Return on Assets (ROA)", key: "ROA", value: `${data.ratios.profitability.roa?.toFixed(1)}%`, trend: "up", benchmark: `15%` },
                { label: "Net Margin", key: "Net Margin", value: `${data.ratios.profitability.net_margin?.toFixed(1)}%`, trend: "up", benchmark: `${data.benchmarks.averages.avg_net_margin}%` },
            ]
        },
        {
            id: "leverage",
            label: "Leverage",
            items: [
                { label: "Debt to Equity", key: "Debt to Equity", value: data.ratios.leverage.debt_to_equity?.toFixed(2), trend: data.ratios.leverage.debt_to_equity < 1 ? "up" : "down", benchmark: `${data.benchmarks.averages.avg_debt_equity}` },
            ]
        },
        {
            id: "valuation",
            label: "Valuation",
            items: [
                { label: "P/E Ratio", key: "PE", value: data.ratios.valuation.pe_ratio?.toFixed(1), trend: "up", benchmark: `${data.benchmarks.averages.avg_pe}` },
            ]
        },
        {
            id: "quality",
            label: "Quality",
            items: [
                { label: "Piotroski F-Score", key: "F-Score", value: `${data.ratios.quality_scores.piotroski_f_score}/9`, trend: "up", benchmark: "6/9" },
                { label: "Altman Z-Score", key: "Z-Score", value: data.ratios.quality_scores.altman_z_score?.toFixed(2), trend: "up", benchmark: "3.0" },
            ]
        }
    ]

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 animate-slide-down">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-6">
                    <Link href="/">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-4 flex-wrap">
                            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{data.symbol}</h1>
                            <Badge variant="stance-strong" className="px-4 py-1.5 text-sm uppercase tracking-wider">{data.stance.overall_stance}</Badge>
                            <div className="flex gap-2">
                                <Badge variant="secondary">{data.profile.industry}</Badge>
                                <Badge variant="secondary">{data.profile.sector}</Badge>
                            </div>
                        </div>
                        <p className="text-slate-700 font-medium mt-2 text-lg">{data.profile.name}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                    <div className="text-right mr-4">
                        <div className="text-2xl font-bold text-slate-900">₹{data.price.current?.toLocaleString()}</div>
                        <div className="text-xs text-slate-400 font-medium">{data.price.date}</div>
                    </div>
                    <Button variant="secondary" size="md" className="rounded-full shadow-sm">
                        <Share2 className="h-4 w-4 mr-2" /> Share
                    </Button>
                    <Button
                        variant="primary"
                        size="md"
                        className="rounded-full shadow-lg shadow-primary-500/20 cursor-pointer"
                        onClick={() => window.print()}
                    >
                        <Download className="h-4 w-4 mr-2" /> Export PDF
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Stance & Insights */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Stance Card */}
                    <Card variant="elevated" className="overflow-hidden border-none bg-gradient-to-br from-primary-500 to-primary-700 text-white p-8">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-primary-100 mb-4 font-medium uppercase tracking-widest text-xs">
                                <ShieldCheck className="h-4 w-4" /> Overall Fundamental Stance
                            </div>
                            <h2 className="text-3xl font-bold mb-4">{data.stance.overall_stance}</h2>
                            <p className="text-primary-50 text-lg leading-relaxed max-w-2xl">
                                {data.ai_insights.final_verdict}
                            </p>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                    </Card>

                    {/* Quality Badges Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card variant="flat" className="p-4 bg-slate-50 border-none text-center">
                            <div className="text-xs font-bold text-slate-400 uppercase mb-1">Piotroski Score</div>
                            <div className="text-2xl font-bold text-slate-900">{data.ratios.quality_scores.piotroski_f_score}/9</div>
                        </Card>
                        <Card variant="flat" className="p-4 bg-slate-50 border-none text-center">
                            <div className="text-xs font-bold text-slate-400 uppercase mb-1">Altman Z-Score</div>
                            <div className="text-2xl font-bold text-slate-900">{data.ratios.quality_scores.altman_z_score}</div>
                        </Card>
                        <Card variant="flat" className="p-4 bg-slate-50 border-none text-center">
                            <div className="text-xs font-bold text-slate-400 uppercase mb-1">Revenue CAGR</div>
                            <div className="text-2xl font-bold text-slate-900">{data.ratios.growth_trends.revenue_cagr_3y}%</div>
                        </Card>
                        <Card variant="flat" className="p-4 bg-slate-50 border-none text-center">
                            <div className="text-xs font-bold text-slate-400 uppercase mb-1">Margin Stability</div>
                            <div className="text-2xl font-bold text-slate-900 text-success-600">{data.ratios.growth_trends.margin_stability}</div>
                        </Card>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base text-slate-900">Price Trend (1Y)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <PriceChart data={data.price.history} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base text-slate-900">Financial Integrity Audit</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px] flex flex-col justify-center gap-4">
                                {data.stance.red_flags.length > 0 ? (
                                    data.stance.red_flags.map((flag: string, i: number) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-danger-50 text-danger-700 rounded-lg text-sm border border-danger-100">
                                            <AlertTriangle className="h-4 w-4 shrink-0" />
                                            {flag}
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center gap-3 p-3 bg-success-50 text-success-700 rounded-lg text-sm border border-success-100 italic">
                                        <ShieldCheck className="h-4 w-4 shrink-0" />
                                        No critical fundamental red flags detected.
                                    </div>
                                )}
                                <div className="mt-4 p-4 rounded-xl bg-slate-50 text-xs text-slate-500 space-y-2">
                                    <div className="flex justify-between"><span>NSE Verified:</span> <span className="font-bold text-slate-900">{data.integrity_audit.data_completeness.nse_available ? 'YES' : 'NO'}</span></div>
                                    <div className="flex justify-between"><span>Audit Checks:</span> <span className="font-bold text-slate-900">{data.integrity_audit.is_valid ? 'PASSED' : 'WARNING'}</span></div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Key Insights Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="border-success-500/20 bg-success-50/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base text-success-700 font-bold flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" /> Why Strong?
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {["18% Revenue CAGR (3Y)", "Net Cash Positive Position", "40% Retension Ratio"].map((item, i) => (
                                        <li key={i} className="text-sm text-success-900 flex gap-2">
                                            <span className="text-success-600 font-bold">•</span> {item}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="border-warning-500/20 bg-warning-50/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base text-warning-700 font-bold flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" /> Risks
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {["Premium PE vs peers", "Macro slowdown in US/EU", "Rising talent costs"].map((item, i) => (
                                        <li key={i} className="text-sm text-warning-900 flex gap-2">
                                            <span className="text-warning-600 font-bold">•</span> {item}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="border-primary-500/20 bg-primary-50/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base text-primary-700 font-bold flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" /> To Track
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {["Order intake trends", "Operating margins", "Attrition rates"].map((item, i) => (
                                        <li key={i} className="text-sm text-primary-900 flex gap-2">
                                            <span className="text-primary-600 font-bold">•</span> {item}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detailed Metrics Tabs */}
                    <Card className="border-slate-200">
                        <CardHeader className="border-b border-slate-100 pb-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-slate-900">Financial Metrics</CardTitle>
                                <Badge variant="secondary" className="font-normal text-slate-500">Source: yfinance</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <Tabs defaultValue="growth">
                                <TabsList className="mb-6 w-full justify-start overflow-x-auto">
                                    <TabsTrigger value="growth">Growth</TabsTrigger>
                                    <TabsTrigger value="profitability">Profitability</TabsTrigger>
                                    <TabsTrigger value="leverage">Leverage</TabsTrigger>
                                    <TabsTrigger value="valuation">Valuation</TabsTrigger>
                                    <TabsTrigger value="quality">Quality</TabsTrigger>
                                </TabsList>

                                {tabs.map((tab) => (
                                    <TabsContent key={tab.id} value={tab.id} className="space-y-1">
                                        {tab.items.length > 0 ? (
                                            tab.items.map((metric) => (
                                                <div key={metric.label} className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 px-2 rounded-lg transition-colors group">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-slate-700">{metric.label}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-5 w-5 text-slate-400 group-hover:text-primary-500"
                                                            onClick={() => openExplanation(metric.key)}
                                                        >
                                                            <HelpCircle className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                    <div className="flex items-center gap-8">
                                                        <div className="flex items-center gap-2 min-w-[80px] justify-end">
                                                            <span className="font-bold text-slate-900">{metric.value || "N/A"}</span>
                                                            {metric.trend && (
                                                                metric.trend === "up" ? <TrendingUp className="h-3.5 w-3.5 text-success-500" /> : <TrendingDown className="h-3.5 w-3.5 text-danger-500" />
                                                            )}
                                                        </div>
                                                        <div className="hidden md:block text-xs text-slate-400">
                                                            Avg: {metric.benchmark || "N/A"}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-10 text-center text-slate-400 text-sm italic">
                                                No specific {tab.label} data found for this period.
                                            </div>
                                        )}
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* AI Insights Section */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Brain className="h-5 w-5 text-primary-500" /> AI Perspectives
                        </h3>
                        <Tabs defaultValue="analyst" className="w-full">
                            <TabsList className="bg-white/50 border border-slate-200 w-full md:w-auto">
                                <TabsTrigger value="analyst" className="gap-2"><MessageSquare className="h-4 w-4" /> Analyst</TabsTrigger>
                                <TabsTrigger value="contrarian" className="gap-2"><AlertTriangle className="h-4 w-4" /> Contrarian</TabsTrigger>
                                <TabsTrigger value="educator" className="gap-2"><GraduationCap className="h-4 w-4" /> Educator</TabsTrigger>
                            </TabsList>

                            <TabsContent value="analyst" className="mt-4">
                                <Card variant="flat" className="p-8 border-none bg-white shadow-xl shadow-slate-200/50">
                                    <div className="flex gap-4 items-start">
                                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                                            <Brain className="h-5 w-5 text-primary-600" />
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="text-lg font-bold text-slate-900">Professional Analyst View</h4>
                                            <p className="text-slate-600 leading-relaxed italic">
                                                &quot;{data.ai_insights.analyst}&quot;
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </TabsContent>
                            <TabsContent value="contrarian" className="mt-4">
                                <Card variant="flat" className="p-8 border-none bg-white shadow-xl shadow-slate-200/50">
                                    <div className="flex gap-4 items-start">
                                        <div className="w-10 h-10 rounded-full bg-warning-100 flex items-center justify-center shrink-0">
                                            <AlertTriangle className="h-5 w-5 text-warning-600" />
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="text-lg font-bold text-slate-900">Contrarian Risk View</h4>
                                            <p className="text-slate-600 leading-relaxed italic">
                                                &quot;{data.ai_insights.contrarian}&quot;
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </TabsContent>
                            <TabsContent value="educator" className="mt-4">
                                <Card variant="flat" className="p-8 border-none bg-white shadow-xl shadow-slate-200/50">
                                    <div className="flex gap-4 items-start">
                                        <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center shrink-0">
                                            <GraduationCap className="h-5 w-5 text-success-600" />
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="text-lg font-bold text-slate-900">Educational Perspective</h4>
                                            <p className="text-slate-600 leading-relaxed">
                                                {data.ai_insights.educator}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

                {/* Right Column: Scorecard & More */}
                <div className="lg:col-span-4 space-y-8">
                    <Card className="sticky top-24">
                        <CardHeader className="border-b border-slate-100">
                            <CardTitle className="text-lg">Fundamental Scorecard</CardTitle>
                            <CardDescription>Performance across 7 core pillars</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {[
                                { name: "Business Quality", score: data.stance.pillar_scores.business_quality, color: data.stance.pillar_scores.business_quality >= 7 ? "bg-success-500" : "bg-warning-500" },
                                { name: "Financial Safety", score: data.stance.pillar_scores.financial_safety, color: data.stance.pillar_scores.financial_safety >= 7 ? "bg-success-500" : "bg-warning-500" },
                                { name: "Valuation Comfort", score: data.stance.pillar_scores.valuation_comfort, color: data.stance.pillar_scores.valuation_comfort >= 7 ? "bg-success-500" : "bg-warning-500" },
                            ].map((pillar) => (
                                <div key={pillar.name} className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-semibold text-slate-700">{pillar.name}</span>
                                        <span className="font-bold text-slate-900">{pillar.score}/10</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-1000", pillar.color)}
                                            style={{ width: `${pillar.score * 10}%` }}
                                        />
                                    </div>
                                </div>
                            ))}

                            <div className="pt-4 border-t border-slate-100">
                                <div className="p-4 bg-slate-50 rounded-xl text-center">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Overall Quality</div>
                                    <div className="text-3xl font-bold text-slate-900">{data.stance.overall_score}<span className="text-lg text-slate-400 font-medium">/10</span></div>
                                    <p className="text-xs text-slate-500 mt-2 italic">Sector: {data.benchmarks.sector}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">Glossary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-sm group cursor-help">
                                <span className="font-bold text-slate-700 block mb-1 group-hover:text-primary-500 transition-colors underline decoration-dotted decoration-slate-300">ROE (Return on Equity)</span>
                                <p className="text-slate-500 leading-relaxed">Measures profitability relative to shareholder equity. High ROE indicates efficient capital use.</p>
                            </div>
                            <Button variant="ghost" className="w-full text-xs text-primary-500 hover:text-primary-600 font-bold p-0 justify-start">View full glossary →</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Mandatory Disclaimer */}
            <div className="mt-20 pt-8 border-t border-slate-200">
                <p className="text-[10px] sm:text-xs text-slate-400 leading-relaxed text-center max-w-4xl mx-auto">
                    DISCLAIMER: This is an educational analysis tool, not investment advice. All information is provided for learning purposes only.
                    We do not recommend buying, selling, or holding any securities. Past performance does not guarantee future results.
                    Please consult a SEBI-registered investment advisor before making any investment decisions. Markets are subject to risks.
                    Please read all disclaimers carefully. Generated on {new Date().toLocaleDateString()}
                </p>
            </div>
            <MetricExplanationModal
                metric={selectedMetric || ""}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    )
}
