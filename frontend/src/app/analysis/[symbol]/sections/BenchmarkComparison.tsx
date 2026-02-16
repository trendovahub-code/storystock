"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { InfoTip } from "@/components/InfoTip"
import type { AnalysisData } from "../types"

const formatValue = (value?: number | null) => {
    if (value === null || value === undefined) return "N/A"
    return Number.isFinite(value) ? value.toFixed(2) : "N/A"
}

export default function BenchmarkComparison({
    ratios,
    averages,
    sector,
    onInfo,
}: {
    ratios: AnalysisData["ratios"]
    averages: AnalysisData["benchmarks"]["averages"]
    sector: string | null
    onInfo: (metric: string) => void
}) {
    const data = [
        { metric: "ROE", company: ratios.profitability.roe, sector: averages.avg_roe },
        { metric: "P/E", company: ratios.valuation.pe_ratio, sector: averages.avg_pe },
        { metric: "D/E", company: ratios.leverage.debt_to_equity, sector: averages.avg_debt_equity },
        { metric: "Net Margin", company: ratios.profitability.net_margin, sector: averages.avg_net_margin },
    ]

    const hasData = data.some((row) => row.company != null || row.sector != null)

    return (
        <Card className="bg-slate-800 border-slate-700 shadow-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-700">
                <div className="flex items-center gap-3">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-white">Sector Benchmarks</CardTitle>
                    <InfoTip metricKey="ROE" onClick={onInfo} light />
                </div>
                <CardDescription className="text-xs font-semibold text-slate-500">vs {sector || "Default"} averages</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
                {hasData ? (
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={data}
                                margin={{ left: 0, right: 10, top: 5, bottom: 5 }}
                                barCategoryGap="20%"
                                barGap={4}
                            >
                                <CartesianGrid stroke="#334155" strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" stroke="#94A3B8" fontSize={11} />
                                <YAxis type="category" dataKey="metric" stroke="#CBD5E1" width={70} fontSize={12} />
                                <Tooltip
                                    formatter={(value, name) => {
                                        const label = name === "company" ? "Company" : "Sector Avg"
                                        return [formatValue(value as number), label]
                                    }}
                                    contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12, fontSize: 13 }}
                                    labelStyle={{ color: "#e2e8f0", fontWeight: 600 }}
                                />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Bar dataKey="company" fill="#F27A1A" name="Company" radius={[0, 4, 4, 0]} barSize={14} maxBarSize={18} />
                                <Bar dataKey="sector" fill="#475569" name="Sector Avg" radius={[0, 4, 4, 0]} barSize={14} maxBarSize={18} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="text-sm text-slate-400 text-center py-8">Benchmark data not available.</div>
                )}
            </CardContent>
        </Card>
    )
}
