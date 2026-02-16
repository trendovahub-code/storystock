import { Metadata } from "next"

export const metadata: Metadata = {
    title: "How It Works - Trendova Hub",
    description: "Discover how Trendova Hub collects data and produces stock analysis insights.",
}

export default function HowItWorksPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-16">
            <h1 className="text-4xl font-bold text-slate-900 mb-8">How Trendova Hub Works</h1>
            <div className="space-y-12">
                <section>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Data Collection</h2>
                    <p className="text-slate-600">Trendova Hub aggregates real-time and historical financial data from trusted sources such as Yahoo Finance and NSE.</p>
                </section>
                <section>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Fundamental Analysis</h2>
                    <p className="text-slate-600">Our engine computes key ratios and benchmarks performance across seven core pillars.</p>
                </section>
                <section>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">3. AI Insights</h2>
                    <p className="text-slate-600">Multiple AI perspectives translate the numbers into analyst, contrarian, and educational viewpoints.</p>
                </section>
            </div>
        </div>
    )
}
