import { StockSearch } from "@/components/StockSearch"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Stock Analysis - Trendova Hub",
    description: "Search and analyze NSE stocks with Trendova Hub.",
}

export default function AnalysisLandingPage() {
    return (
        <div className="max-w-5xl mx-auto px-4 py-16">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Stock Analysis</h1>
            <p className="text-slate-600 mb-10">
                Discover institutional-grade insights, fundamentals, and benchmarks with Trendova Hub.
            </p>
            <StockSearch />
        </div>
    )
}
