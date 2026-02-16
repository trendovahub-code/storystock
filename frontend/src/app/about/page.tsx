import { Metadata } from "next"

export const metadata: Metadata = {
    title: "About StoryStock",
    description: "Learn what company fundamentals actually mean with StoryStock.",
}

export default function AboutPage() {
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
        <div className="max-w-4xl mx-auto px-4 py-20">
            <div className="mb-16">
                <h1 className={`text-4xl font-extrabold mb-6 ${headingGradientClass}`} style={headingGradientStyle}>About StoryStock</h1>
                <div className="prose prose-slate prose-lg max-w-none">
                    <p className="text-xl text-slate-900 leading-relaxed font-medium mb-6">
                        <strong>StoryStock</strong> is a stock analysis tool designed to help investors understand <em>what company fundamentals actually mean</em>, not just what the numbers are.
                    </p>
                    <p className="text-lg text-slate-900 leading-relaxed">
                        Most platforms show financial metrics. StoryStock explains them.
                    </p>
                    <p className="text-lg text-slate-900 leading-relaxed mt-4">
                        At its core, StoryStock allows you to <strong>search any Indian stock</strong> and instantly access:
                    </p>
                    <ul className="list-disc pl-6 mt-4 space-y-2 text-slate-900">
                        <li>Clean, structured fundamental data</li>
                        <li>Contextual explanations in simple language</li>
                        <li>Insight-driven analysis that connects metrics together</li>
                        <li>AI-assisted interpretation of strengths, risks, and trends</li>
                    </ul>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 mb-16">
                <section>
                    <h2 className={`text-2xl font-bold mb-4 ${headingGradientClass}`} style={headingGradientStyle}>What StoryStock Does Differently</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className={`text-lg font-bold mb-1 ${headingGradientClass}`} style={headingGradientStyle}>1. Explanation First</h3>
                            <p className="text-slate-900">Every financial metric is explained clearly—why it matters, how it impacts the business, and what it may signal about the company’s health.</p>
                        </div>
                        <div>
                            <h3 className={`text-lg font-bold mb-1 ${headingGradientClass}`} style={headingGradientStyle}>2. Insights, Not Just Data</h3>
                            <p className="text-slate-900">StoryStock doesn’t stop at displaying numbers. It highlights patterns, relationships, and anomalies across financials to help you think critically about a company.</p>
                        </div>
                        <div>
                            <h3 className={`text-lg font-bold mb-1 ${headingGradientClass}`} style={headingGradientStyle}>3. AI-Powered Analysis</h3>
                            <p className="text-slate-900">AI is used to summarize complex financials, identify meaningful signals and risks, and translate technical data into human-readable insights.</p>
                        </div>
                        <div>
                            <h3 className={`text-lg font-bold mb-1 ${headingGradientClass}`} style={headingGradientStyle}>4. Built for Long-Term Thinking</h3>
                            <p className="text-slate-900">The platform is focused on fundamentals, business quality, and sustainability—not short-term price movement or trading noise.</p>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className={`text-2xl font-bold mb-4 ${headingGradientClass}`} style={headingGradientStyle}>Who StoryStock Is For</h2>
                    <ul className="space-y-4">
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary-500 mt-2" />
                            <span className="text-slate-900">Investors who want to understand businesses, not just stock prices</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary-500 mt-2" />
                            <span className="text-slate-900">Learners who want clear explanations without jargon</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary-500 mt-2" />
                            <span className="text-slate-900">Professionals who want fast, structured insights</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary-500 mt-2" />
                            <span className="text-slate-900">Anyone who believes good decisions come from clarity</span>
                        </li>
                    </ul>

                    <div className="mt-12 p-8 rounded-2xl bg-slate-50 border border-slate-100 italic text-center">
                        <p className="text-xl text-slate-800 font-medium mb-1">Numbers tell facts.</p>
                        <p className="text-xl text-slate-800 font-medium">Stories explain meaning.</p>
                        <p className="text-sm text-slate-400 mt-4 not-italic font-medium uppercase tracking-widest">StoryStock exists to bridge that gap.</p>
                    </div>
                </section>
            </div>

            <div className="pt-12 border-t border-slate-100">
                <h2 className={`text-xl font-bold mb-2 ${headingGradientClass}`} style={headingGradientStyle}>Parent Company</h2>
                <p className="text-slate-900">
                    StoryStock is a product by <strong>Trendova Hub</strong>, an initiative focused on building educational, insight-driven tools for financial understanding.
                </p>
            </div>
        </div>
    )
}
