"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"

const navLinks = [
    { name: "How It Works", href: "/how-it-works" },
    { name: "About", href: "/about" },
]

export function Header() {
    const [isScrolled, setIsScrolled] = React.useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
    const pathname = usePathname()
    const router = useRouter()

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const handleGetStarted = () => {
        setIsMobileMenuOpen(false)
        if (pathname === '/') {
            window.scrollTo({ top: 400, behavior: 'smooth' });
        } else {
            router.push('/');
        }
    }

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4",
                isScrolled
                    ? "py-3 bg-white/70 backdrop-blur-lg border-b border-slate-200"
                    : "py-6 bg-transparent"
            )}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center text-white shadow-lg shadow-primary-500/30 group-hover:scale-105 transition-transform">
                        <BarChart3 className="w-6 h-6" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                        Asset Analysis
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-primary-500",
                                pathname === link.href ? "text-primary-500" : "text-slate-600"
                            )}
                        >
                            {link.name}
                        </Link>
                    ))}
                    <Button
                        variant="primary"
                        size="sm"
                        className="rounded-full px-6 cursor-pointer"
                        onClick={handleGetStarted}
                    >
                        Get Started
                    </Button>
                </nav>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden text-slate-600 p-2"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Nav */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 p-4 animate-in slide-in-from-top-4 duration-200">
                    <nav className="flex flex-col gap-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                    "text-base font-medium p-2 rounded-lg",
                                    pathname === link.href ? "bg-primary-50 text-primary-500" : "text-slate-600"
                                )}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <Button variant="primary" className="w-full mt-2 cursor-pointer" onClick={handleGetStarted}>
                            Get Started
                        </Button>
                    </nav>
                </div>
            )}
        </header>
    )
}
