"use client";

import { useEffect, useState } from "react";
import { getAccountPortfolioHistory } from "@/lib/apiClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { PortfolioCardSkeleton } from "@/components/ui/portfolio-card-skeleton"; // Adjust import path

// Import the dashboard components
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { HoldingsList } from "@/components/dashboard/HoldingsList";
import { StrategyAllocationCard } from "@/components/dashboard/StrategyAllocationCard";

interface PortfolioData {
  portfolioValue: number;
  buyingPower: number;
  todayChange: number;
  todayChangePercent: number;
  ytdReturn: number;
  ytdReturnPercent: number;
}

export default function PortfolioPage() {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current account data for portfolio value and buying power
        const accountResponse = await fetch('http://localhost:3002/api/trading/user/account');
        const accountData = await accountResponse.json();
        
        const portfolioValue = accountData.portfolio_value || 0;
        const buyingPower = accountData.buying_power || 0;
        
        // Get portfolio history for performance calculations
        const historyData = await getAccountPortfolioHistory();
        
        let todayChange = 0;
        let todayChangePercent = 0;
        let ytdReturn = 0;
        let ytdReturnPercent = 0;

        if (historyData?.equity && historyData.equity.length >= 2) {
          // Calculate today's change (compare last two data points)
          const lastEquity = historyData.equity[historyData.equity.length - 1];
          const previousEquity = historyData.equity[historyData.equity.length - 2];
          
          let currentValue, previousValue;
          
          if (typeof lastEquity === 'object' && lastEquity.equity !== undefined) {
            currentValue = lastEquity.equity;
            previousValue = previousEquity?.equity || currentValue;
          } else {
            currentValue = lastEquity;
            previousValue = previousEquity;
          }
          
          todayChange = currentValue - previousValue;
          todayChangePercent = previousValue > 0 ? (todayChange / previousValue) * 100 : 0;

          // Calculate YTD return (first vs last)
          const firstEquity = historyData.equity[0];
          const lastEquityValue = historyData.equity[historyData.equity.length - 1];
          
          const startValue = typeof firstEquity === 'object' ? firstEquity.equity : firstEquity;
          const endValue = typeof lastEquityValue === 'object' ? lastEquityValue.equity : lastEquityValue;
          
          ytdReturn = endValue - startValue;
          ytdReturnPercent = startValue > 0 ? (ytdReturn / startValue) * 100 : 0;
        }

        setPortfolioData({
          portfolioValue,
          buyingPower,
          todayChange,
          todayChangePercent,
          ytdReturn,
          ytdReturnPercent,
        });

      } catch (err: any) {
        console.error("Failed to fetch portfolio data:", err);
        setError(err.message || "Failed to fetch portfolio data.");
        setPortfolioData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioData();
  }, []);

  // Helper functions
  const formatCurrency = (value: number) => {
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  // Helper function to render card content based on state
  const renderCardContent = (
      title: string,
      value: string,
      changeText?: string,
      changeColor = "text-green-500",
      ChangeIcon = TrendingUp
  ) => {
      if (error) {
          return (
              <Card>
                  <CardHeader className="pb-2">
                      <CardDescription>{title}</CardDescription>
                      <CardTitle className="text-2xl text-destructive">Error</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p className="text-sm text-muted-foreground">Could not load data.</p>
                  </CardContent>
              </Card>
          );
      }

      return (
          <Card>
              <CardHeader className="pb-2">
                  <CardDescription>{title}</CardDescription>
                  <CardTitle className="text-2xl">{value}</CardTitle>
              </CardHeader>
              {changeText && (
                  <CardContent>
                      <div className={`flex items-center text-sm ${changeColor}`}>
                          <ChangeIcon className="mr-1 h-4 w-4" />
                          <span>{changeText}</span>
                      </div>
                  </CardContent>
              )}
              {!changeText && <CardContent><div className="h-5" /></CardContent>}
          </Card>
      );
  };

  // Calculate display values
  const portfolioValue = portfolioData ? formatCurrency(portfolioData.portfolioValue) : '$0.00';
  const todayChangeValue = portfolioData ? formatCurrency(portfolioData.todayChange) : '+$0.00';
  const todayChangePercent = portfolioData ? formatPercentage(portfolioData.todayChangePercent) : '+0.00%';
  const ytdReturnValue = portfolioData ? formatCurrency(portfolioData.ytdReturn) : '+$0.00';
  const ytdReturnPercent = portfolioData ? formatPercentage(portfolioData.ytdReturnPercent) : '+0.00%';
  const buyingPowerValue = portfolioData ? formatCurrency(portfolioData.buyingPower) : '$0.00';
  
  const isTodayPositive = portfolioData ? portfolioData.todayChange >= 0 : true;
  const isYtdPositive = portfolioData ? portfolioData.ytdReturn >= 0 : true;

  return (
    <div className="container mx-auto p-4 pt-6">
      <div className="flex justify-between items-center mb-8 mt-6">
        <h1 className="text-3xl font-bold">Your Portfolio</h1>
        <Link href="/create/portfolio">
          <button className="btn btn-primary flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Portfolio
          </button>
        </Link>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              <>
                <PortfolioCardSkeleton />
                <PortfolioCardSkeleton />
                <PortfolioCardSkeleton />
                <PortfolioCardSkeleton />
              </>
            ) : (
              <>
                {renderCardContent(
                  "Total Portfolio Value",
                  portfolioValue,
                  `${todayChangeValue} (${todayChangePercent}) today`,
                  isTodayPositive ? "text-green-500" : "text-red-500",
                  isTodayPositive ? TrendingUp : TrendingDown
                )}
                {renderCardContent(
                  "Daily Change",
                  todayChangeValue,
                  todayChangePercent,
                  isTodayPositive ? "text-green-500" : "text-red-500",
                  isTodayPositive ? TrendingUp : TrendingDown
                )}
                {renderCardContent(
                  "YTD Return",
                  ytdReturnValue,
                  `${ytdReturnPercent} this year`,
                  isYtdPositive ? "text-green-500" : "text-red-500",
                  isYtdPositive ? TrendingUp : TrendingDown
                )}
                {renderCardContent(
                  "Buying Power",
                  buyingPowerValue,
                  "Available for trading",
                  "text-blue-500",
                  TrendingUp
                )}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="holdings" className="space-y-4">
          <HoldingsList />
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PerformanceChart />
            </div>
            <div>
              <StrategyAllocationCard />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="history">Your history data or loading state...</TabsContent>
      </Tabs>
    </div>
  );
}