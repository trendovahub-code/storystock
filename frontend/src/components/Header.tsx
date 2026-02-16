"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

const navLinks = [
    { name: "Home", href: "/" },
    { name: "Markets", href: "/markets" },
    { name: "About", href: "/about" },
    { name: "Contact Us", href: "/contact" },
]

function BrandLogo({ scrolled }: { scrolled: boolean }) {
    return (
        <div className="flex items-baseline gap-1.5 select-none">
            <span
                className={cn(
                    "text-xl md:text-2xl font-extrabold tracking-tight transition-colors duration-300",
                    scrolled ? "text-white" : "text-slate-800"
                )}
            >
                Story<span className="text-orange-500">Stock</span>
            </span>
            <span
                className={cn(
                    "hidden sm:inline text-[11px] font-medium tracking-wide transition-colors duration-300",
                    scrolled ? "text-slate-400" : "text-slate-500"
                )}
            >
                by Trendova Hub
            </span>
        </div>
    )
}

export function Header() {
    const [isScrolled, setIsScrolled] = React.useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
    const pathname = usePathname()

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const isNavLinkActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href))

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-4 md:px-6",
                isScrolled
                    ? "py-2 bg-slate-900/90 backdrop-blur-xl border-b border-white/[0.06] shadow-lg"
                    : "py-4 bg-transparent"
            )}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Brand */}
                <Link href="/" className="flex items-center group shrink-0">
                    <BrandLogo scrolled={isScrolled} />
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-1.5">
                    {navLinks.map((link) => {
                        const isActive = isNavLinkActive(link.href)
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-sm font-semibold tracking-[0.01em] transition-all duration-200",
                                    isScrolled
                                        ? isActive
                                            ? "text-white bg-orange-500/20 border border-orange-500/30"
                                            : "text-slate-300 hover:text-white hover:bg-white/10 border border-transparent"
                                        : isActive
                                            ? "text-orange-600 bg-orange-500/10 border border-orange-500/20"
                                            : "text-slate-700 hover:text-orange-600 hover:bg-orange-50/60 border border-transparent"
                                )}
                            >
                                {link.name}
                            </Link>
                        )
                    })}
                </nav>

                {/* Mobile Toggle */}
                <button
                    className={cn(
                        "md:hidden p-2 transition-colors rounded-lg",
                        isScrolled
                            ? "text-white/70 hover:text-white"
                            : "text-slate-600 hover:text-slate-900"
                    )}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile Nav */}
            {isMobileMenuOpen && (
                <div className={cn(
                    "md:hidden mt-3 p-3 rounded-xl backdrop-blur-xl border animate-in slide-in-from-top-2 duration-200",
                    isScrolled
                        ? "bg-slate-900/90 border-white/[0.08]"
                        : "bg-white/80 border-slate-200/60 shadow-lg"
                )}>
                    <nav className="flex flex-col gap-1">
                        {navLinks.map((link) => {
                            const isActive = isNavLinkActive(link.href)
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                        "text-sm font-medium px-4 py-2.5 rounded-lg transition-all",
                                        isScrolled
                                            ? isActive
                                                ? "text-white bg-orange-500/15"
                                                : "text-white/60 hover:text-white/90 hover:bg-white/[0.05]"
                                            : isActive
                                                ? "text-orange-600 bg-orange-50"
                                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                    )}
                                >
                                    {link.name}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
            )}
        </header>
    )
}
