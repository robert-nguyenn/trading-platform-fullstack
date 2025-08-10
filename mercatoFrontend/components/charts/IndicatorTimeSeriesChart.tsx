'use client'; // Mark this as a Client Component

import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';

// Define the structure of the data points the chart expects
interface ChartDataPoint {
    date: string; // Keep as string for axis label
    value: number | null; // Allow null for missing data points
}

interface IndicatorTimeSeriesChartProps {
    data: ChartDataPoint[];
    dataKey?: string; // Optional: If the value field isn't always 'value'
    strokeColor?: string;
    name?: string; // Name for the Legend/Tooltip
}

const IndicatorTimeSeriesChart: React.FC<IndicatorTimeSeriesChartProps> = ({
    data,
    dataKey = 'value', // Default to 'value'
    strokeColor = '#8884d8',
    name = 'Value',
}) => {

    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-gray-500">No data available for chart.</div>;
    }

    // Format date for tooltip (optional, improves readability)
    const formatTooltipDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        } catch (e) {
            return dateStr; // Fallback to original string if parsing fails
        }
    };

    // Format Y-axis values (optional, for large numbers or decimals)
    const formatYAxisTick = (value: number) => {
         if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
         if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
         if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
         // Handle small decimals if needed
         // if (Math.abs(value) < 1 && value !== 0) return value.toFixed(2);
         return value.toLocaleString(); // Default formatting
    };

    return (
        // ResponsiveContainer makes the chart adapt to parent size
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={data}
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                {/* Grid lines */}
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />

                {/* X Axis (Date) */}
                <XAxis
                    dataKey="date"
                    // Show fewer ticks if data is dense
                    // interval="preserveStartEnd" // Basic interval handling
                    // tickFormatter={(dateStr) => formatTickDate(dateStr)} // Optional custom formatting
                    tick={{ fontSize: 10 }} // Smaller font size for ticks
                    minTickGap={30} // Minimum gap between ticks
                />

                {/* Y Axis (Value) */}
                <YAxis
                    tickFormatter={formatYAxisTick}
                    tick={{ fontSize: 10 }}
                    // domain={['auto', 'auto']} // Auto-adjust domain or set manually
                    // allowDataOverflow={true}
                    width={80} // Adjust width to accommodate labels
                />

                {/* Tooltip on Hover */}
                <Tooltip
                    labelFormatter={(label) => formatTooltipDate(label)}
                    formatter={(value: number, name: string) => [`${value.toLocaleString()}`, name]} // Format value in tooltip
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', border: '1px solid #ccc' }}
                    itemStyle={{ color: strokeColor }}
                />

                {/* Legend (useful if plotting multiple lines later) */}
                {/* <Legend /> */}

                {/* Add a reference line at y=0 if relevant */}
                {data.some(d => d.value !== null && d.value < 0) && data.some(d => d.value !== null && d.value > 0) && (
                   <ReferenceLine y={0} stroke="#808080" strokeDasharray="4 4" />
                )}

                {/* The actual data line */}
                <Line
                    type="monotone"
                    dataKey={dataKey}
                    name={name} // Name shown in Tooltip
                    stroke={strokeColor}
                    strokeWidth={2}
                    dot={false} // Disable dots for many data points
                    connectNulls={false} // Don't connect lines across missing data (null values)
                />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default IndicatorTimeSeriesChart;