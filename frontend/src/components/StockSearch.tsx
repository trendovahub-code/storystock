"use client"

import * as React from "react"
import { Search, X, History, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/Input"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"

interface StockResult {
    symbol: string
    name: string
    sector: string
    marketCap?: string
    priceChange?: number
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
                const res = await fetch(`http://localhost:5000/api/search?q=${debouncedQuery}`)
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

    return (
        <div ref={containerRef} className="relative w-full max-w-2xl mx-auto z-40">
            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
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
                    placeholder="Search NSE stocks (e.g., RELIANCE, TCS)"
                    className="pl-12 pr-10 h-14 text-lg text-slate-900 rounded-2xl shadow-lg border-none bg-white/90 backdrop-blur-md focus-visible:ring-primary-400"
                />
                {query && (
                    <button
                        onClick={() => setQuery("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        <X className="h-4 w-4" />
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
                                    "flex items-center justify-between w-full px-4 py-3 rounded-xl transition-colors text-left",
                                    selectedIndex === index ? "bg-primary-50" : "hover:bg-slate-50"
                                )}
                            >
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-900">{stock.symbol}</span>
                                    <span className="text-sm text-slate-500 line-clamp-1">{stock.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant="secondary" className="opacity-70">{stock.sector}</Badge>
                                    {stock.priceChange !== undefined && (
                                        <span className={cn(
                                            "text-sm font-medium",
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
                                <p className="text-slate-500">No stocks found for &quot;{query}&quot;</p>
                                <p className="text-xs text-slate-400 mt-1">Try company name or NSE symbol</p>
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    )
}
