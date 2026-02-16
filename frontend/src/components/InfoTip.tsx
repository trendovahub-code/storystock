"use client"

import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

export function InfoTip({
    metricKey,
    onClick,
    light = false,
}: {
    metricKey: string
    onClick: (k: string) => void
    light?: boolean
}) {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation()
                onClick(metricKey)
            }}
            className={cn(
                "inline-flex items-center justify-center rounded-full transition-all cursor-pointer shrink-0",
                "h-5 w-5 border border-white/20 bg-white/5 text-slate-300 hover:text-white hover:border-orange-400/60 hover:bg-white/10 hover:shadow-[0_0_10px_rgba(242,122,26,0.3)]",
                light ? "" : "text-slate-500 border-slate-200"
            )}
            aria-label={`Learn about ${metricKey}`}
            title={`What is ${metricKey}?`}
        >
            <Info className="h-4 w-4" />
        </button>
    )
}
