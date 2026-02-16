import { Metadata } from "next"
import AnalysisClient from "./AnalysisClient"

type Props = {
    params: { symbol: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const symbol = params.symbol?.toUpperCase() || "Stock"
    return {
        title: `${symbol} Analysis - Trendova Hub`,
        description: `Trendova Hub analysis for ${symbol} with fundamentals, benchmarks, and insights.`,
    }
}

export default function AnalysisPage() {
    return <AnalysisClient />
}
