"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { InfoTip } from "@/components/InfoTip"
import type { PillarScores } from "../types"

export default function FundamentalScorecard({
    scores,
    overallScore,
    onInfo,
}: {
    scores: PillarScores
    overallScore: number
    onInfo: (metric: string) => void
}) {
    const pillars = [
        { metric: "Business Quality", value: scores.business_quality },
        { metric: "Financial Safety", value: scores.financial_safety },
        { metric: "Valuation Comfort", value: scores.valuation_comfort },
    ]
    const normalizedOverall = Number.isFinite(overallScore) ? Math.max(0, Math.min(10, overallScore)) : 0
    const stanceLabel =
        normalizedOverall >= 7.5
            ? "Strong"
            : normalizedOverall >= 6
                ? "Improving"
                : normalizedOverall >= 4
                    ? "Mixed"
                    : "Risky"

    const formatScore = (value: number) => {
        if (!Number.isFinite(value)) return "N/A"
        return Number.isInteger(value) ? `${value}` : value.toFixed(1)
    }

    const getBarClass = (value: number) => {
        if (value >= 7.5) return "from-emerald-500 to-green-400"
        if (value >= 6) return "from-amber-500 to-orange-400"
        if (value >= 4) return "from-yellow-500 to-amber-400"
        return "from-rose-500 to-red-400"
    }

    return (
        <Card className="bg-slate-800 border-slate-700 shadow-xl overflow-hidden">
            <CardHeader className="border-b border-slate-700">
                <div className="flex items-center gap-3">
                    <CardTitle className="text-lg font-bold text-white">Fundamental Scorecard</CardTitle>
                    <InfoTip metricKey="Overall Stance" onClick={onInfo} light />
                </div>
                <CardDescription className="text-slate-400 font-medium">Simple breakdown across the 3 core pillars</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                <div className="p-5 bg-slate-900/50 rounded-xl border border-slate-700/50">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">Overall Quality</div>
                    <div className="flex items-end justify-center gap-1">
                        <div className="text-4xl font-extrabold text-white tracking-tight">{formatScore(normalizedOverall)}</div>
                        <div className="text-xl text-slate-500 font-bold">/10</div>
                    </div>
                    <div className="text-center mt-2 text-sm font-semibold text-amber-300">{stanceLabel}</div>
                </div>

                <div className="space-y-4">
                    {pillars.map((pillar) => {
                        const clamped = Math.max(0, Math.min(10, pillar.value))
                        return (
                            <div key={pillar.metric} className="space-y-1.5">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-slate-200">{pillar.metric}</span>
                                        <InfoTip metricKey={pillar.metric} onClick={onInfo} light />
                                    </div>
                                    <span className="text-sm font-bold text-white tabular-nums">{formatScore(clamped)}/10</span>
                                </div>
                                <div className="h-2.5 rounded-full bg-slate-700/70 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full bg-gradient-to-r ${getBarClass(clamped)}`}
                                        style={{ width: `${clamped * 10}%` }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div className="text-xs text-slate-500">
                    Higher scores are better. Use info buttons for the scoring logic.
                </div>
            </CardContent>
        </Card>
    )
}
