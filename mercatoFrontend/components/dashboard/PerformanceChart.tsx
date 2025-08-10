"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, type TooltipProps } from "recharts"
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent"
import { getAccountPortfolioHistory } from "@/lib/apiClient"
import { format } from "date-fns"

// Define the data structure for our chart
interface PerformanceDataPoint {
  timestamp: number
  value: number
  label: string
}

interface PortfolioHistoryResponse {
  timestamp?: number[]
  equity: number[]
  profit_loss?: number[]
  pnl_pct?: number[]
  base_value?: number
  base_value_asof?: string
  timeframe?: string
}

// Generate API parameters for different ranges
const getApiParamsForRange = (range: string) => {
  const now = new Date()
  
  switch (range) {
    case "1D":
      return {
        period: '1D',
        timeframe: '5Min',
        intraday_reporting: 'extended_hours',
        pnl_reset: 'per_day',
        force_engine_version: 'v2'
      }
    case "1W":
      // Calculate exactly 7 days ago
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return {
        start: oneWeekAgo.toISOString(),
        timeframe: '1D',
        intraday_reporting: 'market_hours',
        pnl_reset: 'no_reset',
        force_engine_version: 'v2'
      }
    case "1M":
      // Calculate exactly 30 days ago (not "this month")
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      return {
        start: thirtyDaysAgo.toISOString(),
        timeframe: '1D',
        intraday_reporting: 'market_hours',
        pnl_reset: 'no_reset',
        force_engine_version: 'v2'
      }
    case "3M":
      // Calculate exactly 90 days ago (not "3 calendar months")
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      return {
        start: ninetyDaysAgo.toISOString(),
        timeframe: '1D',
        intraday_reporting: 'market_hours',
        pnl_reset: 'no_reset',
        force_engine_version: 'v2'
      }
    case "YTD":
      // For YTD, calculate start date since there's no YTD period format
      const jan1 = new Date(now.getFullYear(), 0, 1)
      return {
        start: jan1.toISOString(),
        timeframe: '1D',
        intraday_reporting: 'market_hours',
        pnl_reset: 'no_reset',
        force_engine_version: 'v2'
      }
    case "1Y":
      // Calculate exactly 365 days ago (not "this year")
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      return {
        start: oneYearAgo.toISOString(),
        timeframe: '1D',
        intraday_reporting: 'market_hours',
        pnl_reset: 'no_reset',
        force_engine_version: 'v2'
      }
    case "ALL":
      return {
        timeframe: '1D',
        intraday_reporting: 'market_hours',
        pnl_reset: 'no_reset',
        force_engine_version: 'v2'
      }
    default:
      const defaultThirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      return {
        start: defaultThirtyDaysAgo.toISOString(),
        timeframe: '1D',
        intraday_reporting: 'market_hours',
        pnl_reset: 'no_reset',
        force_engine_version: 'v2'
      }
  }
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as PerformanceDataPoint
    return (
      <div className="rounded-md border bg-popover px-3 py-1.5 text-sm shadow-md animate-in fade-in-0 zoom-in-95">
        <div className="font-medium text-popover-foreground">
          {new Date(data.timestamp * 1000).toLocaleString([], {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </div>
        <div className="text-muted-foreground">
          Value: ${data.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>
    )
  }
  return null
}

// Enhanced Chart Component using Recharts
const EnhancedLineChart = ({ data }: { data: PerformanceDataPoint[] }) => {
  if (!data || data.length < 2) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">Not enough data for this period</div>
    )
  }

  // Determine min/max for Y-axis domain with padding
  const values = data.map((d) => d.value)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const padding = (maxVal - minVal) * 0.1 // 10% padding

  return (
    <div className="w-full h-64 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 20 }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            interval={data.length > 15 ? Math.floor(data.length / 6) : 0}
            padding={{ left: 10, right: 10 }}
          />
          <YAxis domain={[minVal - padding, maxVal + padding]} hide={true} />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "hsl(var(--foreground))", strokeWidth: 1, strokeDasharray: "3 3" }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="url(#chartGradient)"
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 5,
              strokeWidth: 1,
              fill: "hsl(var(--background))",
              stroke: "hsl(var(--primary))",
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// Format the data for the chart
const formatChartData = (data: PortfolioHistoryResponse, selectedRange?: string): PerformanceDataPoint[] => {
  if (!data || !data.equity) return []

  // Handle both array of objects and separate timestamp/equity arrays
  if (Array.isArray(data.equity) && data.equity.length > 0) {
    const firstItem = data.equity[0]
    
    // If equity is an array of objects with timestamp and equity properties
    if (typeof firstItem === 'object' && firstItem !== null && 'timestamp' in firstItem && 'equity' in firstItem) {
      return data.equity.map((item: any, index: number) => {
        const date = new Date(item.timestamp)
        let label = ""

        // Format label based on timeframe
        switch (selectedRange) {
          case "1D":
            label = format(date, "HH:mm")
            break
          case "1W":
          case "1M":
          case "3M":
          case "YTD":
          case "1Y":
            label = format(date, "MMM d")
            break
          default:
            label = format(date, "MMM yyyy")
        }

        return {
          timestamp: new Date(item.timestamp).getTime() / 1000,
          value: item.equity,
          label,
        }
      })
    } 
    // If we have separate timestamp and equity arrays (original format)
    else if (data.timestamp && Array.isArray(data.timestamp)) {
      const timestamps = data.timestamp
      const equities = data.equity as number[]

      return timestamps.map((timestamp, index) => {
        const date = new Date(timestamp * 1000)
        let label = ""

        // Format label based on timeframe
        switch (selectedRange) {
          case "1D":
            label = format(date, "HH:mm")
            break
          case "1W":
          case "1M":
          case "3M":
          case "YTD":
          case "1Y":
            label = format(date, "MMM d")
            break
          default:
            label = format(date, "MMM yyyy")
        }

        return {
          timestamp,
          value: equities[index],
          label,
        }
      })
    }
  }

  return []
}

// Calculate percentage return for a given range
const calculateReturn = (data: PortfolioHistoryResponse, range: string, allPortfolioData?: Record<string, PortfolioHistoryResponse>): string => {
  if (!data || !data.equity || data.equity.length < 2) return "0.00%"

  let change = 0
  let percentChange = 0

  // Extract equity values - handle both array of objects and plain number arrays
  let equityValues: number[] = []
  if (Array.isArray(data.equity) && data.equity.length > 0) {
    const firstItem = data.equity[0]
    if (typeof firstItem === 'object' && firstItem !== null && 'equity' in firstItem) {
      // Array of objects with equity property
      equityValues = data.equity.map((item: any) => item.equity)
    } else {
      // Plain number array
      equityValues = data.equity as number[]
    }
  }

  if (equityValues.length < 2) return "0.00%"

  const lastValue = equityValues[equityValues.length - 1]
  const firstValue = equityValues[0]

  // For 1D range, try to use profit_loss data if available
  if (range === "1D" && data.profit_loss && Array.isArray(data.profit_loss) && data.profit_loss.length > 0) {
    const lastProfitLoss = data.profit_loss[data.profit_loss.length - 1]
    if (typeof lastProfitLoss === 'object' && lastProfitLoss !== null && 'profit_loss_pct' in lastProfitLoss) {
      percentChange = (lastProfitLoss as any).profit_loss_pct
      change = (lastProfitLoss as any).profit_loss
    } else {
      // Fallback to manual calculation
      change = lastValue - firstValue
      percentChange = firstValue > 0 ? (change / firstValue) * 100 : 0
    }
  } else {
    // Normal calculation for other ranges
    change = lastValue - firstValue
    percentChange = firstValue > 0 ? (change / firstValue) * 100 : 0
  }

  const sign = change >= 0 ? "+" : ""
  return `${sign}$${change.toFixed(2)} (${sign}${percentChange.toFixed(2)}%)`
}

export const PerformanceChart = () => {
  const [selectedRange, setSelectedRange] = useState<string>("YTD")
  const [portfolioData, setPortfolioData] = useState<Record<string, PortfolioHistoryResponse>>({})
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data for the selected range
  useEffect(() => {
    const fetchData = async (range: string) => {
      try {
        setLoading(true)
        const apiParams = getApiParamsForRange(range)
        const response = await getAccountPortfolioHistory(apiParams)
        setPortfolioData((prev) => ({ ...prev, [range]: response }))
        setError(null)
      } catch (err: any) {
        console.error(`Error fetching ${range} data:`, err)
        setError(`Failed to load ${range} data`)
      } finally {
        setLoading(false)
      }
    }

    // Only fetch if we don't already have data for this range
    if (!portfolioData[selectedRange]) {
      fetchData(selectedRange)
    }
  }, [selectedRange]) // Remove portfolioData from dependencies

  // Fetch 1D data on initial load for "Today's Change"
  useEffect(() => {
    if (!portfolioData["1D"]) {
      const apiParams = getApiParamsForRange("1D")
      getAccountPortfolioHistory(apiParams)
        .then((data) => {
          setPortfolioData((prev) => ({ ...prev, "1D": data }))
        })
        .catch((err: any) => {
          console.error("Error fetching 1D data:", err)
        })
    }
  }, []) // Empty dependency array - only run once on mount

  // Select data based on the chosen range
  const chartData = useMemo(() => {
    const data = portfolioData[selectedRange]
    return data ? formatChartData(data, selectedRange) : []
  }, [selectedRange, portfolioData])

  // Calculate return values dynamically from data
  const todayChange = useMemo(() => {
    return portfolioData["1D"] ? calculateReturn(portfolioData["1D"], "1D", portfolioData) : "0.00%"
  }, [portfolioData])

  const rangeReturn = useMemo(() => {
    const data = portfolioData[selectedRange]
    const result = data ? calculateReturn(data, selectedRange, portfolioData) : "0.00%"
    return result
  }, [selectedRange, portfolioData])

  const rangeLabel = useMemo(() => {
    // Check if we're showing contextual "since inception" data
    const isShowingSinceInception = rangeReturn.includes("Since")
    
    switch (selectedRange) {
      case "1D":
        return "Today's Change"
      case "1W":
        return isShowingSinceInception ? "Since Inception" : "1W Return"
      case "1M":
        return isShowingSinceInception ? "Since Inception" : "1M Return"
      case "3M":
        return isShowingSinceInception ? "Since Inception" : "3M Return"
      case "YTD":
        return isShowingSinceInception ? "Since Inception" : "YTD Return"
      case "1Y":
        return isShowingSinceInception ? "Since Inception" : "1Y Return"
      case "ALL":
        return "All Time Return"
      default:
        return "Return"
    }
  }, [selectedRange, rangeReturn])

  return (
    <Card key={`perf-chart-${selectedRange}`}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Time Range Selector */}
          <Tabs value={selectedRange} defaultValue="YTD" onValueChange={setSelectedRange} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-4 sm:grid-cols-7 w-full sm:w-auto h-auto sm:h-10">
              <TabsTrigger value="1D" className="text-xs sm:text-sm px-2 sm:px-3">
                1D
              </TabsTrigger>
              <TabsTrigger value="1W" className="text-xs sm:text-sm px-2 sm:px-3">
                1W
              </TabsTrigger>
              <TabsTrigger value="1M" className="text-xs sm:text-sm px-2 sm:px-3">
                1M
              </TabsTrigger>
              <TabsTrigger value="3M" className="text-xs sm:text-sm px-2 sm:px-3">
                3M
              </TabsTrigger>
              <TabsTrigger value="YTD" className="text-xs sm:text-sm px-2 sm:px-3">
                YTD
              </TabsTrigger>
              <TabsTrigger value="1Y" className="text-xs sm:text-sm px-2 sm:px-3">
                1Y
              </TabsTrigger>
              <TabsTrigger value="ALL" className="text-xs sm:text-sm px-2 sm:px-3">
                ALL
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Performance Summary */}
          <div className="flex space-x-6 text-right w-full sm:w-auto justify-end">
            <div>
              <div className="text-xs text-muted-foreground">Today's Change</div>
              <div
                className={`text-sm font-medium ${todayChange.includes("+") ? "text-green-500" : todayChange.includes("-") ? "text-red-500" : ""}`}
              >
                {todayChange}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{rangeLabel}</div>
              <div
                className={`text-sm font-medium ${rangeReturn.includes("+") ? "text-green-500" : rangeReturn.includes("-") ? "text-red-500" : ""}`}
              >
                {rangeReturn}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-muted-foreground">Loading portfolio data...</div>
          </div>
        ) : error ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-red-500">{error}</div>
          </div>
        ) : (
          <EnhancedLineChart data={chartData} />
        )}
      </CardContent>
    </Card>
  )
}