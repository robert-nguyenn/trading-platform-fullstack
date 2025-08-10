"use client" // Required if using state/client components like Tabs

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Using Tabs for time range selection
import apiClient from '@/lib/apiClient';

// Types for chart data
interface ChartDataPoint {
    value: number;
    [key: string]: any; // Allow for flexible additional properties like month, day, time
}

// Basic SVG Line Chart Component (Replace with a proper charting library like Recharts, Chart.js, Nivo)
const SimpleLineChart = ({ data }: { data: ChartDataPoint[] }) => {
    if (!data || data.length < 2) {
        return <div className="h-64 flex items-center justify-center text-muted-foreground">Not enough data</div>;
    }

    const values = data.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal === 0 ? 1 : maxVal - minVal; // Avoid division by zero

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((d.value - minVal) / range) * 90 - 5; // Scale y, leave padding
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="w-full h-64 mt-4">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                 {/* Optional: Add Y-axis labels */}
                <text x="0" y="10" fontSize="4" fill="currentColor" className="text-muted-foreground">${maxVal.toLocaleString()}</text>
                <text x="0" y="95" fontSize="4" fill="currentColor" className="text-muted-foreground">${minVal.toLocaleString()}</text>

                <polyline
                    points={points}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="0.5"
                />
            </svg>
             {/* Basic X-axis labels */}
            <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
                {data.map((d, i) => {
                    if (i % Math.ceil(data.length / 6) === 0) { // Show ~6 labels
                        return <span key={i}>{d.month || d.day || d.time || i}</span>;
                    }
                    return null;
                })}
            </div>
        </div>
    );
};


export const PerformanceChart: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState<string>("YTD");
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch performance data based on selected range
  const fetchPerformanceData = async (range: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/portfolio/performance?range=${range}`);
      setChartData(response.data);
    } catch (err) {
      console.error('Failed to fetch performance data:', err);
      setError('Failed to load performance data');
      setChartData([]); // Empty data on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when component mounts or range changes
  useEffect(() => {
    fetchPerformanceData(selectedRange);
  }, [selectedRange]);

  // Calculate return values based on chartData
  const rangeReturn = useMemo(() => {
    if (chartData.length < 2) return "";
    const firstValue = chartData[0].value;
    const lastValue = chartData[chartData.length - 1].value;
    const difference = lastValue - firstValue;
    const percentage = ((difference / firstValue) * 100).toFixed(2);
    const sign = difference >= 0 ? "+" : "";
    return `${sign}$${difference.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${sign}${percentage}%)`;
  }, [chartData]);

  const rangeLabel = useMemo(() => {
       switch (selectedRange) {
         case '1D': return "Today's Change";
         case '1W': return "1W Return";
         case '1M': return "1M Return";
         case '3M': return "3M Return";
         case 'YTD': return "YTD Return";
         case '1Y': return "1Y Return";
         case 'ALL': return "All Time Return";
         default: return "Return";
       }
  }, [selectedRange]);

  // Calculate today's change (assuming we always show this regardless of selected range)
  const todayChange = useMemo(() => {
    // This could be a separate API call or derived from daily data
    // For now, return empty if no data
    return rangeReturn; // Temporary fallback
  }, [rangeReturn]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Time Range Selector */}
            <Tabs defaultValue="YTD" onValueChange={setSelectedRange} className="w-full sm:w-auto">
              <TabsList className="grid grid-cols-4 sm:grid-cols-7 w-full sm:w-auto h-auto sm:h-10">
                  {/* Adjust grid cols as needed */}
                  <TabsTrigger value="1D" className="text-xs sm:text-sm px-2 sm:px-3">1D</TabsTrigger>
                  <TabsTrigger value="1W" className="text-xs sm:text-sm px-2 sm:px-3">1W</TabsTrigger>
                  <TabsTrigger value="1M" className="text-xs sm:text-sm px-2 sm:px-3">1M</TabsTrigger>
                  <TabsTrigger value="3M" className="text-xs sm:text-sm px-2 sm:px-3">3M</TabsTrigger>
                  <TabsTrigger value="YTD" className="text-xs sm:text-sm px-2 sm:px-3">YTD</TabsTrigger>
                  <TabsTrigger value="1Y" className="text-xs sm:text-sm px-2 sm:px-3">1Y</TabsTrigger>
                  <TabsTrigger value="ALL" className="text-xs sm:text-sm px-2 sm:px-3">ALL</TabsTrigger>
              </TabsList>
            </Tabs>

             {/* Performance Summary */}
            <div className="flex space-x-6 text-right w-full sm:w-auto justify-end">
                <div>
                  <div className="text-xs text-muted-foreground">Today's Change</div>
                  <div className={`text-sm font-medium ${todayChange.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                    {todayChange}
                  </div>
                </div>
                <div>
                    <div className="text-xs text-muted-foreground">{rangeLabel}</div>
                    <div className={`text-sm font-medium ${rangeReturn.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                      {rangeReturn}
                    </div>
                </div>
            </div>
        </div>
      </CardHeader>
      <CardContent>
         {/* Chart with loading and error states */}
         {loading ? (
           <div className="h-64 flex items-center justify-center text-muted-foreground">
             Loading performance data...
           </div>
         ) : error ? (
           <div className="h-64 flex items-center justify-center text-red-500">
             {error}
           </div>
         ) : (
           <SimpleLineChart data={chartData} />
         )}
      </CardContent>
    </Card>
  );
};