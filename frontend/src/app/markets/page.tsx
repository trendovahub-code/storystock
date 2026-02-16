import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Markets - Trendova Hub",
    description: "Market overviews and curated insights from Trendova Hub.",
}

export default function MarketsPage() {
    const headingGradientClass = "text-transparent bg-clip-text inline-block"
    const headingGradientStyle = {
        letterSpacing: "-0.03em",
        backgroundImage: "linear-gradient(90deg, #F27A1A, #F59E0B, #EF4444, #F27A1A)",
        backgroundSize: "200% auto",
        WebkitBackgroundClip: "text" as const,
        WebkitTextFillColor: "transparent",
        backgroundClip: "text" as const,
        animation: "gradient 6s linear infinite",
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-16">
            <h1 className={`text-4xl font-bold mb-4 ${headingGradientClass}`} style={headingGradientStyle}>Markets</h1>
            <p className="text-slate-600 mb-8">
                Trendova Hub surfaces market context, sector signals, and curated watchlists.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                    { title: "Sector Pulse", text: "Track momentum across key NSE sectors with Trendova Hub." },
                    { title: "Market Brief", text: "Daily high-level summaries and macro signals." },
                    { title: "Watchlists", text: "Curated lists of high‑quality, high‑volatility, and defensive picks." },
                    { title: "Upcoming Events", text: "Earnings calendar and key corporate actions." },
                ].map((card) => (
                    <div key={card.title} className="p-6 rounded-2xl bg-white/80 border border-slate-200 shadow-sm">
                        <h3 className={`text-lg font-semibold mb-2 ${headingGradientClass}`} style={headingGradientStyle}>{card.title}</h3>
                        <p className="text-sm text-slate-600">{card.text}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
