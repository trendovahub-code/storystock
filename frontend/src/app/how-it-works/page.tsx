export default function HowItWorksPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-16">
            <h1 className="text-4xl font-bold text-slate-900 mb-8">How It Works</h1>
            <div className="space-y-12">
                <section>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Data Collection</h2>
                    <p className="text-slate-600">We fetch real-time and historical financial data from free, reliable sources like yfinance and NSE.</p>
                </section>
                <section>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Technical Analysis</h2>
                    <p className="text-slate-600">Our engine computes 50+ financial ratios and identifies trends across 7 core pillars.</p>
                </section>
                <section>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">3. AI Insights</h2>
                    <p className="text-slate-600">Three different AI models analyze the data to provide an expert analyst view, a contrarian perspective, and educational notes.</p>
                </section>
            </div>
        </div>
    )
}
