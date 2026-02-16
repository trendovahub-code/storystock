"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs"
import { InfoTip } from "@/components/InfoTip"
import { BarChart3 } from "lucide-react"
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    ComposedChart,
} from "recharts"
import type { Financials } from "../types"

const COLORS = {
    orange: "#F27A1A",
    orangeLight: "#F59E0B",
    green: "#00C853",
    greenLight: "#34D399",
    teal: "#14B8A6",
    slate: "#334155",
    text: "#94A3B8",
    blue: "#60A5FA",
}

const formatCompact = (value?: number | null) => {
    if (value === null || value === undefined) return "N/A"
    return new Intl.NumberFormat("en-IN", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(value)
}

const formatPeriod = (dateKey: string) => {
    const date = new Date(dateKey)
    if (Number.isNaN(date.getTime())) return dateKey
    const year = date.getFullYear()
    return `FY${String(year).slice(-2)}`
}

const buildSeries = (
    statement: Record<string, Record<string, number | null>>,
    fields: Record<string, string>
) => {
    const rows = Object.entries(statement)
        .filter(([key]) => Boolean(key))
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)

    return rows.map(([dateKey, values]) => {
        const row: Record<string, string | number | null> = {
            period: formatPeriod(dateKey),
        }
        Object.entries(fields).forEach(([alias, fieldName]) => {
            row[alias] = values?.[fieldName] ?? null
        })
        return row
    })
}

const hasSeries = (series: Array<Record<string, string | number | null>>) =>
    series.length > 0 &&
    series.some((row) => Object.values(row).some((value) => typeof value === "number"))

const tooltipStyle = {
    contentStyle: { background: "#0f172a", border: "1px solid #334155", borderRadius: 12, fontSize: 13 },
    labelStyle: { color: "#e2e8f0", fontWeight: 600 },
}

const getNumericSeries = (series: Array<Record<string, string | number | null>>, key: string) =>
    series
        .map((row) => row[key])
        .filter((value): value is number => typeof value === "number")

const getTrendDirection = (values: number[], lowerIsBetter = false) => {
    if (values.length < 2) return "insufficient"
    const first = values[0]
    const last = values[values.length - 1]
    if (first === 0) return "insufficient"
    const changePct = ((last - first) / Math.abs(first)) * 100
    if (Math.abs(changePct) < 4) return "stable"
    if (lowerIsBetter) return changePct < 0 ? "improving" : "worsening"
    return changePct > 0 ? "improving" : "worsening"
}

export default function FinancialCharts({
    financials,
    onInfo,
}: {
    financials?: Financials
    onInfo: (metric: string) => void
}) {
    const income = financials?.income_statement ?? {}
    const balance = financials?.balance_sheet ?? {}
    const cashflow = financials?.cashflow ?? {}
    const ratios = financials?.ratios_table ?? {}

    const revenueSeries = buildSeries(income, {
        revenue: "Total Revenue",
        netIncome: "Net Income",
        opm: "OPM_Percent",
    })
    const balanceSeries = buildSeries(balance, {
        equity: "Equity Capital",
        reserves: "Reserves",
        debt: "Total Debt",
        other: "Other Liabilities",
    })
    const cashflowSeries = buildSeries(cashflow, {
        operating: "Operating Cash Flow",
        investing: "Investing Cash Flow",
        financing: "Financing Cash Flow",
        net: "Net Cash Flow",
    })
    const efficiencySeries = buildSeries(ratios, {
        debtorDays: "Debtor Days",
        workingCapitalDays: "Working Capital Days",
        roce: "ROCE_Percent",
    })

    const revenueTrend = getTrendDirection(getNumericSeries(revenueSeries, "revenue"))
    const netIncomeTrend = getTrendDirection(getNumericSeries(revenueSeries, "netIncome"))
    const debtTrend = getTrendDirection(getNumericSeries(balanceSeries, "debt"), true)
    const operatingCfTrend = getTrendDirection(getNumericSeries(cashflowSeries, "operating"))
    const debtorDaysTrend = getTrendDirection(getNumericSeries(efficiencySeries, "debtorDays"), true)
    const wcDaysTrend = getTrendDirection(getNumericSeries(efficiencySeries, "workingCapitalDays"), true)
    const roceTrend = getTrendDirection(getNumericSeries(efficiencySeries, "roce"))

    const trendLabel = (trend: string) =>
        trend === "improving" ? "improving" : trend === "worsening" ? "worsening" : trend === "stable" ? "stable" : "not enough data"

    const chartInsight = {
        revenue: `Revenue trend is ${trendLabel(revenueTrend)} and net profit trend is ${trendLabel(netIncomeTrend)} across displayed years.`,
        balance: `Debt trend is ${trendLabel(debtTrend)} relative to the company’s liability structure over time.`,
        cashflow: `Operating cash flow trend is ${trendLabel(operatingCfTrend)}. Sustainable positive operating cash flow is usually healthier.`,
        efficiency: `Debtor Days: ${trendLabel(debtorDaysTrend)}, Working Capital Days: ${trendLabel(wcDaysTrend)}, ROCE: ${trendLabel(roceTrend)}.`,
    }

    const emptyState = (msg: string) => (
        <div className="h-full flex items-center justify-center text-slate-500 text-sm font-medium">{msg}</div>
    )

    return (
        <Card className="bg-slate-900/80 border-slate-700 shadow-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-700 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <BarChart3 className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-xl font-bold text-white">Financial Trend Charts</CardTitle>
                            <InfoTip metricKey="Revenue Growth" onClick={onInfo} light />
                        </div>
                        <CardDescription className="text-slate-400">Multi-year performance across revenue, balance sheet, cash flow &amp; efficiency</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <Tabs defaultValue="revenue">
                    <TabsList className="mb-6 w-full justify-start overflow-x-auto scrollbar-hide bg-slate-950/60 p-1 rounded-xl border border-white/5">
                        {["revenue", "balance", "cashflow", "efficiency"].map((tab) => (
                            <TabsTrigger
                                key={tab}
                                value={tab}
                                className="whitespace-nowrap px-4 py-2 rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400 hover:text-white transition-all duration-300 font-medium"
                            >
                                {tab === "revenue" ? "Revenue & Profit" : tab === "balance" ? "Balance Sheet" : tab === "cashflow" ? "Cash Flow" : "Efficiency Ratios"}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* Revenue & Profit */}
                    <TabsContent value="revenue" className="space-y-3">
                        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">What this means</span>
                                <InfoTip metricKey="Revenue Growth" onClick={onInfo} light />
                            </div>
                            <p className="text-sm text-slate-300">{chartInsight.revenue}</p>
                        </div>
                        <div className="h-[280px]">
                        {hasSeries(revenueSeries) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={revenueSeries} margin={{ left: 0, right: 10, top: 10, bottom: 5 }}>
                                    <CartesianGrid stroke={COLORS.slate} strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="period" stroke={COLORS.text} fontSize={12} />
                                    <YAxis tickFormatter={(v) => formatCompact(v)} stroke={COLORS.text} fontSize={11} width={55} />
                                    <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} stroke={COLORS.text} fontSize={11} width={40} />
                                    <Tooltip
                                        formatter={(value, name) => {
                                            if (name === "OPM %") return [`${value}%`, String(name)]
                                            return [formatCompact(value as number), String(name)]
                                        }}
                                        {...tooltipStyle}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Bar dataKey="revenue" fill={COLORS.orange} radius={[4, 4, 0, 0]} name="Revenue" barSize={28} maxBarSize={36} />
                                    <Line type="monotone" dataKey="netIncome" stroke={COLORS.green} strokeWidth={2.5} dot={{ r: 3, fill: COLORS.green }} name="Net Income" />
                                    <Line type="monotone" dataKey="opm" stroke={COLORS.blue} strokeWidth={2} strokeDasharray="5 3" dot={false} yAxisId="right" name="OPM %" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : emptyState("Revenue and profit data not available.")}
                        </div>
                    </TabsContent>

                    {/* Balance Sheet */}
                    <TabsContent value="balance" className="space-y-3">
                        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">What this means</span>
                                <InfoTip metricKey="Debt to Equity" onClick={onInfo} light />
                            </div>
                            <p className="text-sm text-slate-300">{chartInsight.balance}</p>
                        </div>
                        <div className="h-[280px]">
                        {hasSeries(balanceSeries) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={balanceSeries} margin={{ left: 0, right: 10, top: 10, bottom: 5 }}>
                                    <CartesianGrid stroke={COLORS.slate} strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="period" stroke={COLORS.text} fontSize={12} />
                                    <YAxis tickFormatter={(v) => formatCompact(v)} stroke={COLORS.text} fontSize={11} width={55} />
                                    <Tooltip
                                        formatter={(value, name) => [formatCompact(value as number), String(name)]}
                                        {...tooltipStyle}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Bar dataKey="equity" stackId="a" fill={COLORS.orange} name="Equity Capital" barSize={32} maxBarSize={40} />
                                    <Bar dataKey="reserves" stackId="a" fill={COLORS.orangeLight} name="Reserves" barSize={32} maxBarSize={40} />
                                    <Bar dataKey="debt" stackId="a" fill={COLORS.green} name="Total Debt" barSize={32} maxBarSize={40} radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="other" stackId="a" fill={COLORS.blue} name="Other Liabilities" barSize={32} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : emptyState("Balance sheet data not available.")}
                        </div>
                    </TabsContent>

                    {/* Cash Flow */}
                    <TabsContent value="cashflow" className="space-y-3">
                        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">What this means</span>
                                <InfoTip metricKey="Operating Cash Flow" onClick={onInfo} light />
                            </div>
                            <p className="text-sm text-slate-300">{chartInsight.cashflow}</p>
                        </div>
                        <div className="h-[280px]">
                        {hasSeries(cashflowSeries) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={cashflowSeries} margin={{ left: 0, right: 10, top: 10, bottom: 5 }}>
                                    <CartesianGrid stroke={COLORS.slate} strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="period" stroke={COLORS.text} fontSize={12} />
                                    <YAxis tickFormatter={(v) => formatCompact(v)} stroke={COLORS.text} fontSize={11} width={55} />
                                    <Tooltip
                                        formatter={(value, name) => [formatCompact(value as number), String(name)]}
                                        {...tooltipStyle}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Bar dataKey="operating" fill={COLORS.orange} name="Operating CF" barSize={22} maxBarSize={28} radius={[3, 3, 0, 0]} />
                                    <Bar dataKey="investing" fill={COLORS.blue} name="Investing CF" barSize={22} maxBarSize={28} radius={[3, 3, 0, 0]} />
                                    <Bar dataKey="financing" fill={COLORS.teal} name="Financing CF" barSize={22} maxBarSize={28} radius={[3, 3, 0, 0]} />
                                    <Line type="monotone" dataKey="net" stroke={COLORS.green} strokeWidth={2.5} dot={{ r: 3, fill: COLORS.green }} name="Net Cash Flow" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : emptyState("Cash flow data not available.")}
                        </div>
                    </TabsContent>

                    {/* Efficiency Ratios */}
                    <TabsContent value="efficiency" className="space-y-3">
                        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">What this means</span>
                                <InfoTip metricKey="Working Capital Days" onClick={onInfo} light />
                            </div>
                            <p className="text-sm text-slate-300">{chartInsight.efficiency}</p>
                        </div>
                        <div className="h-[280px]">
                        {hasSeries(efficiencySeries) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={efficiencySeries} margin={{ left: 0, right: 10, top: 10, bottom: 5 }}>
                                    <CartesianGrid stroke={COLORS.slate} strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="period" stroke={COLORS.text} fontSize={12} />
                                    <YAxis stroke={COLORS.text} fontSize={11} width={55} />
                                    <Tooltip
                                        formatter={(value, name) => {
                                            if (name === "ROCE %") return [`${value}%`, String(name)]
                                            return [`${value} days`, String(name)]
                                        }}
                                        {...tooltipStyle}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Line type="monotone" dataKey="debtorDays" stroke={COLORS.orange} strokeWidth={2.5} dot={{ r: 3, fill: COLORS.orange }} name="Debtor Days" />
                                    <Line type="monotone" dataKey="workingCapitalDays" stroke={COLORS.blue} strokeWidth={2.5} dot={{ r: 3, fill: COLORS.blue }} name="Working Capital Days" />
                                    <Line type="monotone" dataKey="roce" stroke={COLORS.green} strokeWidth={2.5} dot={{ r: 3, fill: COLORS.green }} name="ROCE %" />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : emptyState("Efficiency ratio data not available.")}
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
