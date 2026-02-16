import { Metadata } from "next"
import { HomeHero } from "@/components/HomeHero"

export const metadata: Metadata = {
  title: "Trendova Hub - Stock Market Analysis & Insights",
  description: "Trendova Hub delivers institutional-grade analysis and insights for Indian NSE stocks.",
}

export default function Home() {
  return <HomeHero />
}
