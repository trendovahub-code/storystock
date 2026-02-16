"use client"

import { StockSearch } from "@/components/StockSearch"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import * as React from "react"

export function HomeHero() {
  const router = useRouter()
  const searchRef = React.useRef<HTMLDivElement>(null)

  const handleTryStock = (symbol: string) => {
    router.push(`/analysis/${symbol}`)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] px-4 overflow-hidden relative z-10">
      <div className="text-center max-w-4xl mx-auto relative z-10 w-full">
        {/* Headline */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-5xl md:text-7xl font-extrabold leading-[1.08] mb-10 selection:bg-orange-500/20"
          style={{
            letterSpacing: '-0.03em',
            backgroundImage: 'linear-gradient(90deg, #F27A1A, #F59E0B, #EF4444, #F27A1A)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'gradient 6s linear infinite',
          }}
        >
          Fundamental insights,<br className="hidden sm:block" />
          not just financials.
        </motion.h1>

        {/* Search */}
        <motion.div
          ref={searchRef}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full relative z-20"
        >
          <StockSearch />

          {/* Try hints — clean inline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-4 flex items-center justify-center gap-1.5 text-[13px]"
          >
            <span className="text-slate-400 font-normal">Try:</span>
            {["RELIANCE", "TCS", "INFY"].map((symbol, i) => (
              <button
                key={symbol}
                onClick={() => handleTryStock(symbol)}
                className="text-slate-500 hover:text-orange-600 transition-colors cursor-pointer font-medium"
              >
                {symbol}{i < 2 ? "," : ""}
              </button>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
