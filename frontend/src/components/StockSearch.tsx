"use client"

import * as React from "react"
import { Search, X, History, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/Input"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { apiUrl } from "@/lib/api"

interface StockResult {
    symbol: string
    name: string
    sector: string
    exchange?: string
    marketCap?: string
    priceChange?: number
    price?: number | string
    currentPrice?: number | string
    ltp?: number | string
}

export function StockSearch() {
    const [query, setQuery] = React.useState("")
    const [results, setResults] = React.useState<StockResult[]>([])
    const [recentSearches, setRecentSearches] = React.useState<StockResult[]>([])
    const [isLoading, setIsLoading] = React.useState(false)
    const [selectedIndex, setSelectedIndex] = React.useState(-1)
    const [isOpen, setIsOpen] = React.useState(false)

    const debouncedQuery = useDebounce(query, 300)
    const router = useRouter()
    const containerRef = React.useRef<HTMLDivElement>(null)

    // Load recent searches on mount
    React.useEffect(() => {
        const saved = localStorage.getItem("recentSearches")
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved))
            } catch (e) {
                console.error("Failed to parse recent searches", e)
            }
        }
    }, [])

    // Handle outside clicks to close dropdown
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Fetch results when debounced query changes
    React.useEffect(() => {
        if (debouncedQuery.length < 2) {
            setResults([])
            return
        }

        const fetchResults = async () => {
            setIsLoading(true)
            try {
                const res = await fetch(apiUrl(`/api/search?q=${encodeURIComponent(debouncedQuery)}`))
                const data = await res.json()

                if (data.results) {
                    setResults(data.results)
                    setIsOpen(true)
                }
            } catch (error) {
                console.error("Search failed", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchResults()
    }, [debouncedQuery])

    const handleSelect = (stock: StockResult) => {
        // Save to recent searches
        const updated = [stock, ...recentSearches.filter(s => s.symbol !== stock.symbol)].slice(0, 5)
        setRecentSearches(updated)
        localStorage.setItem("recentSearches", JSON.stringify(updated))

        setIsOpen(false)
        setQuery("")
        router.push(`/analysis/${stock.symbol}`)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const currentList = query.length >= 2 ? results : recentSearches

        if (e.key === "ArrowDown") {
            setSelectedIndex(prev => (prev < currentList.length - 1 ? prev + 1 : prev))
        } else if (e.key === "ArrowUp") {
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        } else if (e.key === "Enter") {
            if (selectedIndex >= 0) {
                handleSelect(currentList[selectedIndex])
            } else if (query.trim()) {
                // Force navigate to whatever is typed
                router.push(`/analysis/${query.trim().toUpperCase()}`)
                setIsOpen(false)
                setQuery("")
            }
        } else if (e.key === "Escape") {
            setIsOpen(false)
        }
    }

    const formatPrice = (value?: number | string) => {
        if (value === null || value === undefined) return ""
        if (typeof value === "number") {
            return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value)}`
        }
        const cleaned = value.trim()
        if (!cleaned) return ""
        const normalized = cleaned.replace(/[₹,\s]/g, "")
        const parsed = Number(normalized)
        if (!Number.isNaN(parsed)) {
            return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(parsed)}`
        }
        return cleaned
    }

    return (
        <div ref={containerRef} className="relative w-full max-w-2xl mx-auto z-40">
            <div className="relative group/search">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-orange-500 transition-colors z-10">
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                </div>
                <Input
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setIsOpen(true)
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Search by company or symbol…"
                    className="pl-14 pr-12 h-[56px] text-lg text-slate-800 placeholder:text-slate-400 placeholder:font-normal rounded-2xl border border-slate-200/60 bg-white/90 backdrop-blur-sm transition-all ring-offset-0 ring-0 ring-transparent focus-visible:ring-2 focus-visible:ring-orange-500/30 focus-visible:border-orange-300 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]"
                />
                {query && (
                    <button
                        onClick={() => setQuery("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 p-2 z-10 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            {isOpen && (query.length >= 2 || recentSearches.length > 0) && (
                <Card className="absolute top-full mt-2 w-full overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2">
                        {query.length < 2 && recentSearches.length > 0 && (
                            <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
                                <History className="h-3 w-3" /> Recent Searches
                            </div>
                        )}

                        {(query.length >= 2 ? results : recentSearches).map((stock, index) => (
                            <button
                                key={stock.symbol}
                                onClick={() => handleSelect(stock)}
                                onMouseEnter={() => setSelectedIndex(index)}
                                className={cn(
                                    "flex items-center justify-between gap-3 w-full px-4 py-3 rounded-xl transition-colors text-left",
                                    selectedIndex === index ? "bg-primary-50" : "hover:bg-slate-50"
                                )}
                            >
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="font-bold text-slate-900">{stock.symbol}</span>
                                    <span className="text-sm text-slate-500 line-clamp-1">{stock.name}</span>
                                </div>
                                <div className="flex items-center justify-end gap-2 shrink-0 flex-wrap">
                                    {(() => {
                                        const rawPrice = stock.currentPrice ?? stock.price ?? stock.ltp
                                        const displayPrice = formatPrice(rawPrice)
                                        if (!displayPrice) return null
                                        return <span className="text-sm font-semibold text-slate-700 tabular-nums whitespace-nowrap">{displayPrice}</span>
                                    })()}
                                    {stock.exchange && (
                                        <Badge variant="outline" className="text-xs opacity-60 whitespace-nowrap">{stock.exchange}</Badge>
                                    )}
                                    <Badge variant="secondary" className="opacity-70 whitespace-nowrap">{stock.sector}</Badge>
                                    {stock.priceChange !== undefined && (
                                        <span className={cn(
                                            "text-sm font-medium tabular-nums whitespace-nowrap",
                                            stock.priceChange >= 0 ? "text-success-500" : "text-danger-500"
                                        )}>
                                            {stock.priceChange >= 0 ? "+" : ""}{stock.priceChange}%
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))}

                        {query.length >= 2 && results.length === 0 && !isLoading && (
                            <div className="px-4 py-8 text-center">
                                <p className="text-slate-500">No stocks found on Trendova Hub. Try another search.</p>
                                <p className="text-xs text-slate-400 mt-1">Try company name or BSE/NSE symbol</p>
                            </div>
                        )}
                        <div className="px-4 py-3 text-xs text-slate-400 border-t border-slate-100">
                            Powered by Trendova Hub
                        </div>
                    </div>
                </Card>
            )}
        </div>
    )
}
