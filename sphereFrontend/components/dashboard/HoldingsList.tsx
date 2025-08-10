"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowUp, ArrowDown, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
// Import the getAccountPositions function from your apiClient
import { getAccountPositions } from "@/lib/apiClient" // Adjust the path if necessary

interface Holding {
  symbol: string
  qty: string
  market_value: string
  unrealized_pl: string
  unrealized_plpc: string
  change_today: string // This might be daily percent change, check your API docs
  asset_class: string
  exchange: string
  side: string
  current_price: string
  unrealized_intraday_pl: string // This seems to be the daily dollar change
  avg_entry_price: string
  strategyId?: string | null   // <-- Add this line (optional)
  strategyName?: string | null // <-- Add this line
}

export const HoldingsList: React.FC = () => {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null) // Add error state

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null); // Reset error state on fetch attempt

    // Call getAccountPositions directly. It no longer requires an ID parameter
    getAccountPositions()
      .then((positions) => {
        // The API might return an array directly, or an object like { data: [...] }
        // Assuming it returns an array directly based on the original code structure.
        // Add a check to ensure it's an array.
        if (isMounted) {
            if (Array.isArray(positions)) {
                setHoldings(positions);
            } else {
                 console.error("API returned unexpected data format for positions:", positions);
                 setHoldings([]); // Set to empty array on unexpected format
                 setError("Received unexpected data format from server."); // Inform user
            }
        }
      })
      .catch((error) => {
        console.error("Error fetching positions:", error)
        if (isMounted) {
            setHoldings([]) // Clear holdings on error
            // Set error state to display a message to the user
            setError(error.message || "Failed to load holdings. Please try again later.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false
    }
  }, []) // Empty dependency array means this effect runs once on mount

  // Format currency, handle potential non-numeric values safely
  const formatCurrency = (value: string | number | null | undefined): string => {
    const numValue = typeof value === "string" ? Number.parseFloat(value) : Number(value); // Ensure it's a number
    if (isNaN(numValue)) {
        return "$0.00"; // Display $0.00 or "N/A" for invalid numbers
    }
    return numValue.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Format asset class for display (e.g., "us_equity" -> "US Equity")
  const formatAssetClass = (assetClass: string | null | undefined): string => {
    if (!assetClass) return ''; // Return empty string for null/undefined
    return assetClass
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <div className="w-full mt-8">
      <div className="mb-8">
        <h2 className="text-xl font-bold">Current Holdings</h2>
        <p className="text-muted-foreground">Your portfolio positions and performance</p>
      </div>

      <div className="rounded-lg border bg-card">
        {/* Table Header */}
        {/* Only render header if not loading and no major error */}
        {!loading && !error && holdings.length > 0 && (
            <div className="grid grid-cols-5 gap-4 px-6 py-4 border-b text-sm font-medium text-muted-foreground">
              <div className="text-left">Symbol</div>
              <div className="text-center">Quantity</div>
              <div className="text-center">Market Value</div>
              <div className="text-center">Today's Change</div>
              <div className="text-center">Strategy</div>
            </div>
        )}


        {/* Table Content */}
        {loading ? (
          <div className="p-8 text-center">Loading your holdings...</div>
        ) : error ? ( // Display error message if there's an error
          <div className="p-8 text-center text-destructive">{error}</div>
        ) : holdings.length === 0 ? (
          <div className="p-8 text-center">No holdings found in your portfolio.</div>
        ) : (
          <div>
            {holdings.map((holding) => {
              // Use nullish coalescing (??) to provide default values for potential null/undefined API responses
              const changeValue = Number.parseFloat(holding.unrealized_intraday_pl ?? "0");
              // Check if change_today is percentage or factor (assuming factor like 0.025)
              // If API returns 2.5 for 2.5%, remove * 100
              const changePercent = Number.parseFloat(holding.change_today ?? "0") * 100;

              const isPositive = changeValue >= 0;
              // Use parseInt with base 10 and default to 0
              const quantity = Number.parseInt(holding.qty ?? "0", 10);
              // Use parseFloat and default to 0
              const marketValue = Number.parseFloat(holding.market_value ?? "0");

              // Determine strategy display, handling potential null/undefined
              const investmentType = holding.side === "long" ? "Long" : holding.side === "short" ? "Short" : "N/A";
              const assetClassDisplay = formatAssetClass(holding.asset_class); // Use formatted name
              const strategyDisplay = `${investmentType} ${assetClassDisplay}`.trim(); // Trim trailing space if assetClass is empty

              return (
                // Use symbol as key if available, fallback to index or unique ID
                <div
                  key={holding.symbol || `holding-${Math.random()}`}
                  className="grid grid-cols-5 gap-4 px-6 py-6 border-b last:border-b-0 items-center hover:bg-muted/50 transition-colors"
                >
                  {/* Symbol and Exchange */}
                  <div className="text-left">
                    <div className="font-semibold">{holding.symbol || 'N/A'}</div> {/* Add fallback display */}
                    <div className="text-sm text-muted-foreground">{holding.exchange || 'N/A'}</div> {/* Add fallback display */}
                  </div>

                  {/* Quantity */}
                  <div className="text-center font-medium">{quantity}</div>

                  {/* Market Value */}
                  <div className="text-center font-medium">{formatCurrency(marketValue)}</div>

                  {/* Today's Change */}
                  <div
                    className={`text-center flex items-center justify-center ${isPositive ? "text-green-500" : "text-red-500"}`}
                  >
                    {/* Only show arrow if there's a non-zero change */}
                    {changeValue !== 0 && (isPositive ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />)}
                    <span>
                      {/* Format absolute values, handle potential NaN from parsing */}
                      {formatCurrency(Math.abs(changeValue))} ({isNaN(changePercent) ? '0.00' : Math.abs(changePercent).toFixed(2)}%)
                    </span>
                  </div>

                  {/* Strategy - using asset class and side from API */}
                  <div className="text-center">
                    {/* Only show badge if both side and asset_class are present */}
                    {holding.side && holding.asset_class ? (
                       <Badge
                         variant="outline"
                         // Example: customize badge color based on side or asset class
                         className={`${holding.side === "long" ? "bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                                  : holding.side === "short" ? "bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                                  : "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200" // Default/other styles
                                 }`}
                       >
                         {strategyDisplay}
                       </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* View All Button */}
         {/* Only show the button if data is loaded and there's no primary error */}
        {!loading && !error && (
           <div className="p-4 border-t">
             <Button variant="outline" className="w-full" asChild>
               <Link href="/portfolio/holdings" className="flex items-center justify-center">
                 View All Holdings
                 <ExternalLink className="ml-2 h-4 w-4" />
               </Link>
             </Button>
           </div>
        )}

      </div>
    </div>
  )
}

export default HoldingsList;