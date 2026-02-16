"use client"

import * as React from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs"
import { Card } from "@/components/ui/Card"
import { AlertTriangle, Brain, GraduationCap, MessageSquare } from "lucide-react"
import { InfoTip } from "@/components/InfoTip"

interface AIPerspectivesProps {
    aiLoading: boolean
    aiData: {
        analyst: string
        contrarian: string
        educator: string
        final_verdict: string
    }
    aiFallback: string
    onInfo: (metric: string) => void
}

const AIPerspectives = React.forwardRef<HTMLDivElement, AIPerspectivesProps>(
    ({ aiLoading, aiData, aiFallback, onInfo }, ref) => {
        const headingGradientClass = "text-transparent bg-clip-text inline-block"
        const headingGradientStyle = {
            letterSpacing: "-0.02em",
            backgroundImage: "linear-gradient(90deg, #E2E8F0, #93C5FD, #60A5FA, #1D4ED8, #E2E8F0)",
            backgroundSize: "220% auto",
            WebkitBackgroundClip: "text" as const,
            WebkitTextFillColor: "transparent",
            backgroundClip: "text" as const,
            animation: "gradient 6s linear infinite",
        }

        return (
        <div ref={ref} className="space-y-4 mt-8">
            <div className="flex items-center gap-3 mb-2 px-1">
                <Brain className="h-6 w-6 text-orange-400" />
                <h3 className={`text-xl font-bold flex items-center gap-2 tracking-tight ${headingGradientClass}`} style={headingGradientStyle}>
                    AI Perspectives
                </h3>
                <InfoTip metricKey="AI Analyst" onClick={onInfo} light />
            </div>
            {aiLoading && (
                <div className="text-sm text-orange-300 font-medium animate-pulse">Loading AI insights...</div>
            )}
            <Tabs defaultValue="analyst" className="w-full">
                <TabsList className="bg-slate-800 border border-slate-700 w-full md:w-auto p-1 rounded-xl">
                    <TabsTrigger value="analyst" className="gap-2 font-medium px-4 py-2 rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400 hover:text-white transition-all"><MessageSquare className="h-4 w-4" /> Analyst</TabsTrigger>
                    <TabsTrigger value="contrarian" className="gap-2 font-medium px-4 py-2 rounded-lg data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400 hover:text-white transition-all"><AlertTriangle className="h-4 w-4" /> Contrarian</TabsTrigger>
                    <TabsTrigger value="educator" className="gap-2 font-medium px-4 py-2 rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400 hover:text-white transition-all"><GraduationCap className="h-4 w-4" /> Educator</TabsTrigger>
                </TabsList>

                <TabsContent value="analyst" className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Card variant="flat" className="p-8 border border-orange-500/20 bg-slate-800/80 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="flex gap-5 items-start relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-orange-500/30 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300">
                                <Brain className="h-6 w-6 text-orange-400" />
                            </div>
                            <div className="space-y-4 flex-1">
                                <h4 className="text-lg font-bold text-orange-300">Professional Analyst View</h4>
                                <div className="text-slate-200 leading-relaxed font-medium text-base opacity-90 border-l-2 border-orange-500/30 pl-4 whitespace-pre-line">
                                    {aiData.analyst || aiFallback}
                                </div>
                            </div>
                        </div>
                    </Card>
                </TabsContent>
                <TabsContent value="contrarian" className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Card variant="flat" className="p-8 border border-amber-500/20 bg-slate-800/80 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="flex gap-5 items-start relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300">
                                <AlertTriangle className="h-6 w-6 text-amber-400" />
                            </div>
                            <div className="space-y-4 flex-1">
                                <h4 className="text-lg font-bold text-amber-300">Contrarian Risk View</h4>
                                <div className="text-slate-200 leading-relaxed font-medium text-base opacity-90 border-l-2 border-amber-500/30 pl-4 whitespace-pre-line">
                                    {aiData.contrarian || aiFallback}
                                </div>
                            </div>
                        </div>
                    </Card>
                </TabsContent>
                <TabsContent value="educator" className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Card variant="flat" className="p-8 border border-emerald-500/20 bg-slate-800/80 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="flex gap-5 items-start relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300">
                                <GraduationCap className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div className="space-y-4 flex-1">
                                <h4 className="text-lg font-bold text-emerald-300">Educational Perspective</h4>
                                <div className="text-slate-200 leading-relaxed font-medium text-base opacity-90 bg-slate-900/40 p-4 rounded-xl border border-white/5 whitespace-pre-line">
                                    {aiData.educator || aiFallback}
                                </div>
                            </div>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )}
)

AIPerspectives.displayName = "AIPerspectives"

export default AIPerspectives
