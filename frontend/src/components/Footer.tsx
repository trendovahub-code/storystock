"use client"

import Link from "next/link"

export function Footer() {
    return (
        <footer className="mt-24 bg-slate-900 text-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-extrabold tracking-tight text-white">
                            Story<span className="text-orange-500">Stock</span>
                        </span>
                        <span className="text-[11px] font-medium tracking-wide text-slate-400">
                            by Trendova Hub
                        </span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed max-w-md">
                        Trendova Hub delivers institutional-grade stock analysis for Indian markets,
                        with clear explanations and disciplined research workflows.
                    </p>
                    <p className="text-xs text-slate-500">© {new Date().getFullYear()} Trendova Hub. All rights reserved.</p>
                </div>

                <div className="space-y-3">
                    <div className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Quick Links</div>
                    <ul className="space-y-2 text-sm">
                        <li><Link href="/about" className="text-slate-400 hover:text-white transition-colors">About</Link></li>
                        <li><Link href="/contact" className="text-slate-400 hover:text-white transition-colors">Contact Us</Link></li>
                        <li><Link href="/disclaimer" className="text-slate-400 hover:text-white transition-colors">Disclaimer</Link></li>
                    </ul>
                </div>
            </div>
        </footer>
    )
}
