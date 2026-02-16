"use client"

import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { InfoTip } from "@/components/InfoTip"
import type { Shareholding } from "../types"

const SLICE_COLORS = {
    Promoters: "#F27A1A",
    FIIs: "#60A5FA",
    DIIs: "#00C853",
    Government: "#F59E0B",
    Public: "#FB7185",
    Others: "#94A3B8",
}

export default function ShareholdingCard({
    shareholding,
    onInfo,
}: {
    shareholding?: Shareholding
    onInfo: (metric: string) => void
}) {
    const raw = shareholding ?? {}
    const slices = [
        { name: "Promoters", value: raw.Promoters },
        { name: "FIIs", value: raw.FIIs },
        { name: "DIIs", value: raw.DIIs },
        { name: "Government", value: raw.Government },
        { name: "Public", value: raw.Public },
        { name: "Others", value: raw.Others },
    ].filter((item) => typeof item.value === "number" && (item.value ?? 0) > 0)

    return (
        <Card className="bg-slate-800 border-slate-700 shadow-xl overflow-hidden">
            <CardHeader className="border-b border-slate-700">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold text-white">Shareholding Pattern</CardTitle>
                        <CardDescription className="text-slate-400">Ownership snapshot from latest filings</CardDescription>
                    </div>
                    <InfoTip metricKey="Shareholding Pattern" onClick={onInfo} light />
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                {slices.length > 0 ? (
                    <div className="space-y-6">
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={slices} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                                        {slices.map((slice) => (
                                            <Cell key={slice.name} fill={SLICE_COLORS[slice.name as keyof typeof SLICE_COLORS]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value, name) => [`${value}%`, String(name)]}
                                        contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12, fontSize: 13 }}
                                        labelStyle={{ color: "#e2e8f0", fontWeight: 600 }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-2">
                            {slices.map((slice) => (
                                <div key={slice.name} className="flex items-center justify-between text-sm text-slate-300">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="h-2.5 w-2.5 rounded-full"
                                            style={{ backgroundColor: SLICE_COLORS[slice.name as keyof typeof SLICE_COLORS] }}
                                        />
                                        <span className="font-medium">{slice.name}</span>
                                    </div>
                                    <span className="font-semibold text-white">
                                        {slice.value != null ? `${slice.value.toFixed(1)}%` : "N/A"}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 border-t border-slate-700 text-xs text-slate-400 space-y-1">
                            {raw["No. of Shareholders"] && (
                                <div className="flex items-center justify-between">
                                    <span>No. of Shareholders</span>
                                    <span className="text-slate-200 font-semibold">{raw["No. of Shareholders"]?.toLocaleString()}</span>
                                </div>
                            )}
                            {raw.as_of && (
                                <div className="flex items-center justify-between">
                                    <span>As of</span>
                                    <span className="text-slate-200 font-semibold">{raw.as_of}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-slate-400 text-center py-10">Shareholding data not available.</div>
                )}
            </CardContent>
        </Card>
    )
}
