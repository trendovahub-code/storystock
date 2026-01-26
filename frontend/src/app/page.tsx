"use client"

import { StockSearch } from "@/components/StockSearch"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import * as React from "react"

export default function Home() {
  const router = useRouter()
  const searchRef = React.useRef<HTMLDivElement>(null)

  const handleTryStock = (symbol: string) => {
    router.push(`/analysis/${symbol}`)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] px-4 overflow-hidden relative z-10">
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto relative z-10 w-full">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 backdrop-blur-md border border-white/20 text-slate-600 text-sm font-medium mb-8"
        >
          <span className="flex h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
          Educational Stock Analysis Platform
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-primary-900 to-slate-900"
        >
          Understand Stocks,<br />Make Informed Decisions
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg md:text-xl text-slate-600 mb-12 max-w-2xl mx-auto"
        >
          Get institutional-grade fundamental analysis with always-on explanations.
          Learn what metrics mean, not just what they are.
        </motion.p>

        <motion.div
          ref={searchRef}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full relative z-20"
        >
          <StockSearch />
          <div className="mt-6 text-sm text-slate-500 font-medium">
            Try:
            {["RELIANCE", "TCS", "INFY"].map((symbol, i) => (
              <button
                key={symbol}
                onClick={() => handleTryStock(symbol)}
                className="ml-2 text-primary-600 hover:text-primary-700 hover:underline transition-all cursor-pointer"
              >
                {symbol}{i < 2 ? "," : ""}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
