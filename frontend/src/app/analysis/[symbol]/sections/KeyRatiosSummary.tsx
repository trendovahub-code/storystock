"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { InfoTip } from "@/components/InfoTip"
import type { KeyRatios, Shareholding } from "../types"

const formatCurrency = (value?: number | null) => {
    if (value === null || value === undefined) return "N/A"
    return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value)}`
}

const formatNumber = (value?: number | null) => {
    if (value === null || value === undefined) return "N/A"
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value)
}

const formatMarketCap = (value?: number | null) => {
    if (value === null || value === undefined) return "N/A"
    return `₹${formatNumber(value)} Cr`
}

const formatHighLow = (value?: string | number | null) => {
    if (value === null || value === undefined) return "N/A"
    if (typeof value === "number") {
        return `High: ₹${formatNumber(value)} | Low: N/A`
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

export default function KeyRatiosSummary({
    keyRatios,
    shareholding,
    onInfo,
}: {
    keyRatios?: KeyRatios
    shareholding?: Shareholding
    onInfo: (metric: string) => void
}) {
    const promoterHolding = keyRatios?.promoter_holding ?? shareholding?.Promoters

    return (
        <Card className="bg-slate-800 border-slate-700 shadow-xl overflow-hidden">
            <CardHeader className="border-b border-slate-700">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-white">Key Ratios Summary</CardTitle>
                    <InfoTip metricKey="Market Cap" onClick={onInfo} light />
                </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-slate-400">Market Cap</span>
                    <span className="text-white font-semibold">{formatMarketCap(keyRatios?.market_cap)}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-slate-400">Book Value</span>
                    <span className="text-white font-semibold">{formatCurrency(keyRatios?.book_value)}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-slate-400">Face Value</span>
                    <span className="text-white font-semibold">{formatCurrency(keyRatios?.face_value)}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-slate-400">52W High/Low</span>
                    <span className="text-white font-semibold text-right">{formatHighLow(keyRatios?.high_low)}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-slate-400">Promoter Holding</span>
                    <span className="text-white font-semibold">{promoterHolding != null ? `${promoterHolding}%` : "N/A"}</span>
                </div>
            </CardContent>
        </Card>
    )
}
