// app/discover/macro/[indicatorId]/page.tsx
import React from 'react';
import { notFound } from 'next/navigation'; // Use Next.js notFound for 404
import type { FredEndpointInfo, FredDataPoint, IndicatorMetadata } from '@/lib/types'; // Adjust path
import IndicatorTimeSeriesChart from '@/components/charts/IndicatorTimeSeriesChart';

// TODO: Import your actual chart component
// import IndicatorChart from '@/components/charts/IndicatorChart';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper function to provide detailed descriptions for each indicator (same as in discover page)
function getIndicatorDescription(fredSeriesId: string): string {
    const descriptions: Record<string, string> = {
        'GDP': 'Measures the total monetary value of all goods and services produced within a country. A key indicator of economic health and growth, used by investors to gauge market conditions and economic trends.',
        'UNRATE': 'The percentage of the labor force that is unemployed and actively seeking employment. A critical metric for assessing economic health, labor market strength, and potential policy changes.',
        'CPIAUCSL': 'Tracks the average change in prices of goods and services consumed by households. Essential for understanding inflation trends and purchasing power, directly impacting investment strategies.',
        'FEDFUNDS': 'The interest rate at which banks lend to each other overnight. A primary tool of monetary policy that influences borrowing costs, investment decisions, and currency values.',
        'UMCSENT': 'Measures how optimistic consumers feel about the economy and their financial situation. Strong predictor of consumer spending patterns and economic activity.',
        'ISM': 'A leading indicator of economic activity in the manufacturing sector. Values above 50 indicate expansion, below 50 indicate contraction. Crucial for understanding business cycle trends.',
        'BOPGSTB': 'The difference between a country\'s exports and imports. Positive values indicate trade surplus, negative indicate deficit. Important for currency valuation and economic policy.',
        'GFDEBTN': 'Total federal government debt held by the public. Critical for understanding fiscal health, government borrowing capacity, and potential economic policy constraints.',
        'FYFSD': 'Annual federal budget balance showing surplus (positive) or deficit (negative). Key indicator of government fiscal position and potential policy changes.',
        'HOUST': 'Number of new residential construction projects started monthly. Leading indicator of economic activity, employment, and real estate market health.',
        'EXHOSLUSM495S': 'Monthly sales of previously owned homes. Important gauge of housing market activity, consumer confidence, and economic momentum.',
        'HSN1F': 'Monthly sales of newly built homes. Forward-looking indicator of housing demand, construction activity, and economic growth.',
        'MCOILWTICO': 'Price per barrel of West Texas Intermediate crude oil. Major commodity affecting inflation, transportation costs, and energy sector investments.',
        'GOLDAMGBD228NLBM': 'Daily gold price in USD per troy ounce. Traditional safe-haven asset and hedge against inflation and currency devaluation.',
        'RSAFS': 'Monthly retail trade sales excluding automobiles. Direct measure of consumer spending strength and economic activity.',
        'INDPRO': 'Measures real output of manufacturing, mining, and utilities. Key indicator of economic production capacity and industrial strength.',
        'DEXUSEU': 'US Dollar to Euro exchange rate. Critical for international trade, investment decisions, and currency hedging strategies.',
        'PPIACO': 'Measures average change in selling prices from domestic producers. Leading indicator of consumer price inflation and business cost pressures.',
        'T10Y2Y': 'Difference between 10-year and 2-year Treasury yields. Negative values (yield curve inversion) historically predict economic recessions.'
    };
    
    return descriptions[fredSeriesId] || 'This economic indicator provides valuable insights into market conditions and economic trends. Historical data can help inform investment strategies and market analysis.';
}

// --- Data Fetching Functions ---

// Fetches metadata for ONE indicator by filtering the full list
// Consider a dedicated backend endpoint for better performance with many indicators
async function getIndicatorMetadata(indicatorId: string): Promise<IndicatorMetadata | null> {
    console.log(`Fetching metadata for: ${indicatorId}`);
    try {
        // Fetch the full list (cache recommended for production)
        const res = await fetch(`${API_BASE_URL}/api/fred/endpoints`, {
            // cache: 'no-store', // Dev
             next: { revalidate: 3600 } // Prod (cache for 1 hour)
        });
        if (!res.ok) {
            console.error(`Failed to fetch endpoints list: ${res.status}`);
            return null;
        }
        const allIndicators: FredEndpointInfo[] = await res.json();

        // Find the specific indicator by fredSeriesId
        const metadata = allIndicators.find(ind => ind.fredSeriesId === indicatorId);

        if (!metadata) {
            console.warn(`Metadata not found for ID: ${indicatorId}`);
            return null;
        }

        // Map to IndicatorMetadata (or just return metadata if types match)
        return {
            ...metadata,
            name: metadata.description, // Use description as name for display
            // Add any other derived fields if needed
        };
    } catch (error) {
        console.error(`Error fetching metadata for ${indicatorId}:`, error);
        return null;
    }
}

interface FredApiResponse {
    realtime_start: string;
    realtime_end: string;
    observation_start: string;
    observation_end: string;
    units: string;
    output_type: number;
    file_type: string;
    order_by: string;
    sort_order: string;
    count: number;
    offset: number;
    limit: number;
    observations: FredDataPoint[]; // This is the key part
}

async function getIndicatorData(apiPath: string): Promise<FredDataPoint[]> {
    console.log(`Fetching data from: ${apiPath}`);
    if (!apiPath || !apiPath.startsWith('/api/fred/')) {
        console.error('Invalid API path provided for getIndicatorData:', apiPath);
        return [];
    }
    try {
        const res = await fetch(`${API_BASE_URL}${apiPath}`, { cache: 'no-store' });
        if (!res.ok) {
            console.error(`Failed to fetch data from ${apiPath}: ${res.status}`);
            return [];
        }
        const data: FredApiResponse = await res.json(); // Expect the full structure

        // ** Check if observations exist and return them **
        if (data && Array.isArray(data.observations)) {
            return data.observations;
        } else {
            console.warn(`No 'observations' array found in response from ${apiPath}`);
            return [];
        }

    } catch (error) {
        console.error(`Error fetching or parsing data from ${apiPath}:`, error);
        return [];
    }
}

// --- The Page Component ---

interface IndicatorPageProps {
    params: {
        indicatorId: string; // This matches the folder name [indicatorId]
    };
}

export default async function IndicatorDetailPage({ params }: IndicatorPageProps) {
    const { indicatorId } = params;

    const metadata = await getIndicatorMetadata(indicatorId);
    if (!metadata) {
        notFound();
    }

    // Fetch the raw observations data
    const rawObservations = await getIndicatorData(metadata.path);

    // ** Process observations for the chart **
    const chartData = rawObservations
        .map(obs => ({
            date: obs.date,
            // Convert value: parse string to float, handle FRED's "." for missing data
            value: (typeof obs.value === 'string' && obs.value !== '.')
                       ? parseFloat(obs.value)
                       : (typeof obs.value === 'number' ? obs.value : null) // Keep numbers, null otherwise
        }))
        // Optional: Filter out initial nulls if they cause issues, but keeping them
        // might be better for showing data gaps if connectNulls={false} is used.
        // .filter(d => d.value !== null)
        // Sort by date just in case API doesn't guarantee order (FRED usually does)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header Section */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-3 text-gray-900 dark:text-gray-100">
                    {metadata.description}
                </h1>
                <div className="flex flex-wrap gap-2 mb-4">
                    {metadata.tags?.map(tag => (
                        <span key={tag} className="text-sm bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full font-medium">
                            {tag}
                        </span>
                    ))}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        Series ID: {metadata.fredSeriesId}
                    </span>
                </div>
            </div>

            {/* Chart Section */}
            <div className="mb-8 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Historical Data</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                        <span>{metadata.fredSeriesId}</span>
                    </div>
                </div>
                <div className="h-96 w-full rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <IndicatorTimeSeriesChart
                        data={chartData}
                        name={metadata.fredSeriesId}
                        strokeColor="#10b981" // Emerald-500 to match the theme
                    />
                </div>
            </div>

            {/* Description Section */}
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-8 bg-emerald-500 rounded-full"></div>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">About This Indicator</h2>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border-l-4 border-emerald-500">
                            <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200 mb-2">
                                {metadata.description}
                            </h3>
                            <p className="text-emerald-700 dark:text-emerald-300 leading-relaxed">
                                {getIndicatorDescription(metadata.fredSeriesId)}
                            </p>
                        </div>
                        
                        {/* Investment Insights Section */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
                            <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                                Investment Relevance
                            </h4>
                            <p className="text-blue-700 dark:text-blue-300 text-sm">
                                This indicator helps investors understand market trends, economic cycles, and potential investment opportunities. Monitor changes for insights into sector performance and economic health.
                            </p>
                        </div>
                        
                        {/* Technical Details */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Technical Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[80px]">Series ID:</span>
                                        <span className="text-sm font-mono bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded">
                                            {metadata.fredSeriesId}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[80px]">Data Source:</span>
                                        <span className="text-sm text-gray-800 dark:text-gray-200">FRED (Federal Reserve)</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[80px] mt-1">Categories:</span>
                                        <div className="flex flex-wrap gap-1">
                                            {metadata.tags?.slice(0, 2).map(tag => (
                                                <span key={tag} className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[80px]">Update Freq:</span>
                                        <span className="text-sm text-gray-800 dark:text-gray-200">Varies</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Generate dynamic metadata for SEO using fetched data
export async function generateMetadata({ params }: IndicatorPageProps): Promise<{ title: string, description: string } | {}> {
    const metadata = await getIndicatorMetadata(params.indicatorId);
    if (!metadata) {
        return {
            title: 'Indicator Not Found | Sphere',
            description: 'The requested indicator could not be found.',
        };
    }
    return {
        title: `${metadata.description} (${metadata.fredSeriesId}) | Sphere Discover`,
        description: metadata.description.substring(0, 160),
    };
}

// Optional: Pre-render pages at build time
export async function generateStaticParams() {
    try {
         console.log("Generating static params for macro indicators...");
         const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'; // Ensure API_BASE_URL is defined here too
         const res = await fetch(`${API_BASE_URL}/api/fred/endpoints`);
 
         if (!res.ok) {
             console.error(`generateStaticParams: Failed to fetch endpoints list: ${res.status}`);
             return [];
         }
 
         const indicators: FredEndpointInfo[] = await res.json();
 
         // --- Add Filter ---
         const validIndicators = indicators.filter(ind =>
             ind && typeof ind.fredSeriesId === 'string' && ind.fredSeriesId.length > 0
         );
 
         if (validIndicators.length !== indicators.length) {
             console.warn(`generateStaticParams: Filtered out ${indicators.length - validIndicators.length} indicators with missing or invalid fredSeriesId.`);
              // Optional: Log the invalid indicators for debugging
              // const invalidIndicators = indicators.filter(ind => !(ind && typeof ind.fredSeriesId === 'string' && ind.fredSeriesId.length > 0));
              // console.log("Invalid indicators:", JSON.stringify(invalidIndicators, null, 2));
         }
         // --- End Filter ---
 
         // Map only the valid indicators
         const paths = validIndicators.map((ind) => ({
             indicatorId: ind.fredSeriesId, // Now guaranteed to be a string
         }));
 
         console.log(`Found ${paths.length} valid indicators to generate static pages for.`);
         return paths;
 
    } catch (error) {
        console.error("Failed to generate static params:", error);
        return [];
    }
 }