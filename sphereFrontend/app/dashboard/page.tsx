"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"

// Import the new modular components
import { WelcomeSection } from "@/components/dashboard/WelcomeSection";
import { TradingStrategiesCallout } from "@/components/dashboard/TradingStrategiesCallout";
import { PortfolioSummaryCards } from "@/components/dashboard/PortfolioSummaryCards";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { HoldingsList } from "@/components/dashboard/HoldingsList";
import { StrategyAllocationCard } from "@/components/dashboard/StrategyAllocationCard";
import { useAuth } from "../auth-provider";

export default function Dashboard() {
  
  const {user} = useAuth()
  const userName = user?.displayName + "!"|| "User";
  return (
    <div className="min-h-screen dark:from-gray-900 dark:via-gray-900 dark:to-emerald-900/10">
      <main className="container mx-auto p-4 pt-8 max-w-7xl">
        {/* Welcome Section */}
        <WelcomeSection userName={userName} />

        {/* Trading Strategies Callout */}
        <TradingStrategiesCallout />

        {/* Portfolio Overview Cards */}
        <PortfolioSummaryCards userId={user?.uid ?? ""} />

        {/* Portfolio Section */}
        <div className="mb-12 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio Performance</h2>
              <p className="text-muted-foreground mt-1">Track your investment performance over time</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="group">
              <Link href="/portfolio">
                View Details
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          {/* Portfolio Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Performance Chart - Takes 2/3 of the space */}
            <div className="lg:col-span-2 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <PerformanceChart />
            </div>
            
            {/* Strategy Allocation Card - Takes 1/3 of the space */}
            <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <StrategyAllocationCard />
            </div>
          </div>

          {/* Holdings List Card */}
          <div className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <HoldingsList />
          </div>
        </div>

        {/* Discover Section */}
        
      </main>
    </div>
  )
}