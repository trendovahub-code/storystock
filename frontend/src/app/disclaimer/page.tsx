export default function DisclaimerPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-16">
            <h1 className="text-4xl font-bold text-slate-900 mb-8">Disclaimer</h1>
            <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl">
                <p className="text-lg text-slate-700 leading-relaxed font-medium mb-6">
                    DISCLAIMER: This is an educational analysis tool, not investment advice.
                    All information is provided for learning purposes only.
                </p>
                <p className="text-slate-600 leading-relaxed space-y-4">
                    We do not recommend buying, selling, or holding any securities.
                    Past performance does not guarantee future results. Please consult
                    a SEBI-registered investment advisor before making any investment decisions.
                    Markets are subject to risks. Please read all disclaimers carefully.
                </p>
            </div>
        </div>
    )
}
