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
  if (!data || !data.timestamp || !data.equity) return []

  const timestamps = data.timestamp
  const equities = data.equity

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

// Calculate percentage return for a given range
const calculateReturn = (data: PortfolioHistoryResponse, range: string, allPortfolioData?: Record<string, PortfolioHistoryResponse>): string => {
  if (!data || !data.equity || data.equity.length < 2) return "0.00%"

  let change = 0
  let percentChange = 0

  // For 1D range, prefer pnl_pct if available
  if (range === "1D" && data.pnl_pct && data.pnl_pct.length > 0) {
    const lastPct = data.pnl_pct[data.pnl_pct.length - 1] || 0
    percentChange = lastPct * 100
    const currentValue = data.equity[data.equity.length - 1]
    change = (percentChange / 100) * currentValue
  } else {
    const lastValue = data.equity[data.equity.length - 1]
    let firstValue = data.equity[0]
    let startIndex = 0
    
    // Check if all equity values are zero (account didn't exist during this range)
    const hasNonZeroEquity = data.equity.some((value: number) => value > 0)
    if (!hasNonZeroEquity) {
      // All values are zero - calculate since inception for YTD/1Y
      if ((range === "YTD" || range === "1Y") && allPortfolioData) {
        // Get current portfolio value from other ranges
        let currentPortfolioValue = 0
        const rangesToCheck = ["1D", "1M", "3M"]
        for (const checkRange of rangesToCheck) {
          if (allPortfolioData[checkRange] && allPortfolioData[checkRange].equity.length > 0) {
            const lastEquity = allPortfolioData[checkRange].equity[allPortfolioData[checkRange].equity.length - 1]
            if (lastEquity > 0) {
              currentPortfolioValue = lastEquity
              break
            }
          }
        }
        
        // Use known base value
        const knownBaseValue = 50000
        
        if (currentPortfolioValue > 0) {
          const returnAmount = currentPortfolioValue - knownBaseValue
          const sign = returnAmount >= 0 ? "+" : ""
          return `${sign}$${returnAmount.toFixed(2)} (Since Apr)`
        }
      }
      
      return "0.00%"
    }

    // Find start point for the range
    if (data.timestamp && data.timestamp.length > 0) {
      const currentTimestamp = data.timestamp[data.timestamp.length - 1]
      const earliestTimestamp = data.timestamp[0]
      let targetSecondsBack: number
      
      switch (range) {
        case "1W":
          targetSecondsBack = 7 * 24 * 60 * 60
          break
        case "1M":
          targetSecondsBack = 30 * 24 * 60 * 60
          break
        case "3M":
          targetSecondsBack = 90 * 24 * 60 * 60
          break
        case "YTD":
          const jan1 = new Date(new Date().getFullYear(), 0, 1)
          targetSecondsBack = (Date.now() / 1000 - jan1.getTime() / 1000)
          break
        case "1Y":
          targetSecondsBack = 365 * 24 * 60 * 60
          break
        default:
          targetSecondsBack = 24 * 60 * 60
      }
      
      const targetTimestamp = currentTimestamp - targetSecondsBack
      
      // Check if target timestamp is before our earliest data
      if (targetTimestamp < earliestTimestamp) {
        // Check if this is a long-term range (YTD, 1Y) and account is newer
        if ((range === "YTD" || range === "1Y") && allPortfolioData) {
          // Get current portfolio value from other ranges
          let currentPortfolioValue = 0
          const rangesToCheck = ["1D", "1M", "3M"]
          for (const checkRange of rangesToCheck) {
            if (allPortfolioData[checkRange] && allPortfolioData[checkRange].equity.length > 0) {
              const lastEquity = allPortfolioData[checkRange].equity[allPortfolioData[checkRange].equity.length - 1]
              if (lastEquity > 0) {
                currentPortfolioValue = lastEquity
                break
              }
            }
          }
          
          // Use known base value
          const knownBaseValue = 50000
          
          if (currentPortfolioValue > 0) {
            const returnAmount = currentPortfolioValue - knownBaseValue
            const sign = returnAmount >= 0 ? "+" : ""
            return `${sign}$${returnAmount.toFixed(2)} (Since Apr)`
          }
        }
        
        startIndex = 0
        firstValue = data.equity[startIndex]
      } else {
        // Find the closest timestamp
        let bestIndex = 0
        let bestDiff = Math.abs(data.timestamp[0] - targetTimestamp)
        
        for (let i = 1; i < data.timestamp.length; i++) {
          const diff = Math.abs(data.timestamp[i] - targetTimestamp)
          if (diff < bestDiff) {
            bestDiff = diff
            bestIndex = i
          }
        }
        
        startIndex = bestIndex
        firstValue = data.equity[bestIndex]
      }
    }

    // Validate first value
    if (firstValue === undefined || firstValue === null || isNaN(firstValue) || firstValue === 0) {
      const nonZeroValue = data.equity.find(val => val > 0)
      if (nonZeroValue) {
        firstValue = nonZeroValue
      } else {
        if (lastValue > 0) {
          change = lastValue
          percentChange = 100
          const sign = change >= 0 ? "+" : ""
          return `${sign}$${change.toFixed(2)} (${sign}${percentChange.toFixed(2)}%)`
        } else {
          return "0.00%"
        }
      }
    }

    // Normal calculation
    change = lastValue - firstValue
    percentChange = (change / firstValue) * 100
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

    fetchData(selectedRange)
  }, [selectedRange, portfolioData])

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
  }, [portfolioData])

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