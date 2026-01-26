"use client"

import { Modal, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Modal"
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
    "ROE": {
        title: "Return on Equity (ROE)",
        definition: "ROE is a measure of financial performance calculated by dividing net income by shareholders' equity.",
        whyItMatters: "It indicates how effectively management is using a company's assets to create profits.",
        howToCalculate: "Net Income / Average Shareholders' Equity",
        interpretation: "Generally, an ROE of 15% to 20% is considered good. Consistently rising ROE is a very positive sign.",
        commonMisconceptions: "ROE can be artificially inflated by taking on high debt. Always check ROE alongside Debt-to-Equity."
    },
    "PE Ratio": {
        title: "Price-to-Earnings (P/E) Ratio",
        definition: "The P/E ratio relates a company's share price to its earnings per share.",
        whyItMatters: "It helps investors determine the market value of a stock as compared to its earnings.",
        howToCalculate: "Market Price per Share / Earnings per Share (EPS)",
        interpretation: "A high P/E could mean that a stock's price is high relative to earnings and possibly overvalued. Conversely, a low P/E might indicate that the current stock price is low relative to earnings.",
        commonMisconceptions: "Low P/E doesn't always mean a bargain. It could mean the market expects earnings to fall in the future."
    },
    // Add more as needed
}

export function MetricExplanationModal({
    metric,
    isOpen,
    onClose
}: {
    metric: string;
    isOpen: boolean;
    onClose: () => void
}) {
    const explanation = metricExplanations[metric] || {
        title: metric,
        definition: "Educational content for this metric is currently being prepared.",
        whyItMatters: "Stay tuned for a detailed explanation.",
        howToCalculate: "N/A",
        interpretation: "N/A",
        commonMisconceptions: "N/A"
    }

    return (
        <Modal open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-primary-600" />
                        </div>
                        <Badge variant="secondary">Educational Guide</Badge>
                    </div>
                    <DialogTitle className="text-2xl font-bold">{explanation.title}</DialogTitle>
                    <DialogDescription className="text-slate-500 text-lg">
                        {explanation.definition}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="mt-1"><Landmark className="h-4 w-4 text-primary-500" /></div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm italic uppercase tracking-wider">Why it Matters</h4>
                                <p className="text-sm text-slate-600 leading-relaxed mt-1">{explanation.whyItMatters}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="mt-1"><Calculator className="h-4 w-4 text-primary-500" /></div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm italic uppercase tracking-wider">How to Calculate</h4>
                                <code className="block bg-slate-50 p-2 rounded text-xs font-mono text-primary-700 mt-2">
                                    {explanation.howToCalculate}
                                </code>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="mt-1"><TrendingUp className="h-4 w-4 text-primary-500" /></div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm italic uppercase tracking-wider">How to Interpret</h4>
                                <p className="text-sm text-slate-600 leading-relaxed mt-1">{explanation.interpretation}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="mt-1"><AlertCircle className="h-4 w-4 text-warning-500" /></div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm italic uppercase tracking-wider">Watch Out For</h4>
                                <p className="text-sm text-slate-600 leading-relaxed mt-1">{explanation.commonMisconceptions}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-primary-50 rounded-xl border border-primary-100 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-primary-600" />
                    <p className="text-xs text-primary-800 font-medium leading-relaxed">
                        PRO TIP: Always analyze metrics in combination with other data points. A single metric never tells the whole story.
                    </p>
                </div>
            </DialogContent>
        </Modal>
    )
}
