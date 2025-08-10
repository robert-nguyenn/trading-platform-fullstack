// app/discover/page.tsx
import Link from 'next/link';
import React from 'react';
import type { FredEndpointInfo } from '@/lib/types'; // Adjust import path

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper function to provide detailed descriptions for each indicator
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
    
    return descriptions[fredSeriesId] || 'Economic indicator providing insights into market conditions and economic trends. Click to explore historical data and analysis.';
}

// Helper function to categorize indicators
function categorizeIndicators(indicators: FredEndpointInfo[]) {
    const categories = {
        'Economic Growth & Production': [] as FredEndpointInfo[],
        'Labor Market': [] as FredEndpointInfo[],
        'Inflation & Prices': [] as FredEndpointInfo[],
        'Monetary Policy': [] as FredEndpointInfo[],
        'Housing Market': [] as FredEndpointInfo[],
        'Trade & International': [] as FredEndpointInfo[],
        'Government & Fiscal': [] as FredEndpointInfo[],
        'Commodities': [] as FredEndpointInfo[],
        'Consumer & Business Sentiment': [] as FredEndpointInfo[]
    };

    indicators.forEach(indicator => {
        const tags = indicator.tags;
        if (tags.includes('gdp') || tags.includes('production') || tags.includes('industry') || tags.includes('manufacturing')) {
            categories['Economic Growth & Production'].push(indicator);
        } else if (tags.includes('unemployment') || tags.includes('labor market')) {
            categories['Labor Market'].push(indicator);
        } else if (tags.includes('inflation') || tags.includes('price level') || tags.includes('price')) {
            categories['Inflation & Prices'].push(indicator);
        } else if (tags.includes('interest rate') || tags.includes('monetary policy') || tags.includes('yield curve')) {
            categories['Monetary Policy'].push(indicator);
        } else if (tags.includes('housing') || tags.includes('real estate') || tags.includes('construction')) {
            categories['Housing Market'].push(indicator);
        } else if (tags.includes('trade') || tags.includes('international') || tags.includes('forex') || tags.includes('currency')) {
            categories['Trade & International'].push(indicator);
        } else if (tags.includes('fiscal') || tags.includes('budget') || tags.includes('debt')) {
            categories['Government & Fiscal'].push(indicator);
        } else if (tags.includes('commodity') || tags.includes('energy') || tags.includes('precious metal')) {
            categories['Commodities'].push(indicator);
        } else if (tags.includes('sentiment') || tags.includes('consumer') || tags.includes('spending')) {
            categories['Consumer & Business Sentiment'].push(indicator);
        } else {
            // Default to Economic Growth & Production for uncategorized
            categories['Economic Growth & Production'].push(indicator);
        }
    });

    return categories;
}

async function getMacroIndicators(): Promise<FredEndpointInfo[]> {
    try {
        // Use { cache: 'no-store' } for development to always get fresh data
        // Use { next: { revalidate: 3600 } } for production to cache for 1 hour
        const res = await fetch(`${API_BASE_URL}/api/fred/endpoints`, {
            // cache: 'no-store', // Uncomment for dev
             next: { revalidate: 3600 } // Revalidate data every hour in production
        });

        if (!res.ok) {
            console.error(`Failed to fetch indicators: ${res.status} ${res.statusText}`);
            return []; // Return empty array on error
        }

        const data: FredEndpointInfo[] = await res.json();
        return data;
    } catch (error) {
        console.error('Error fetching macro indicators:', error);
        return []; // Return empty array on network or parsing error
    }
}

// We could also fetch suggestions separately if needed
// async function getSuggestedIndicators(): Promise<FredEndpointInfo[]> { ... }

export default async function DiscoverPage() {
    // Fetch data on the server
    const indicators = await getMacroIndicators();
    const categorizedIndicators = categorizeIndicators(indicators);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-4">Discover Economic Indicators</h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                    Explore key macroeconomic indicators to inform your investment strategies. 
                    Each indicator provides historical data and insights into market conditions.
                </p>
            </div>

            {/* Render each category */}
            {Object.entries(categorizedIndicators).map(([categoryName, categoryIndicators]) => {
                if (categoryIndicators.length === 0) return null;
                
                return (
                    <section key={categoryName} className="mb-12">
                        <div className="flex items-center mb-6">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                {categoryName}
                            </h2>
                            <div className="ml-3 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full">
                                {categoryIndicators.length} indicator{categoryIndicators.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {categoryIndicators.map((indicator) => (
                                <Link
                                    href={`/discover/macro/${indicator.fredSeriesId}`}
                                    key={indicator.fredSeriesId}
                                    className="group block p-6 border rounded-xl hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-900/50 dark:border-gray-800 dark:hover:bg-gray-900/70 hover:border-gray-300 dark:hover:border-gray-700 hover:scale-[1.02]"
                                >
                                    <h3 className="text-lg font-semibold mb-3 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                                        {indicator.description}
                                    </h3>
                                    
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">
                                        {getIndicatorDescription(indicator.fredSeriesId)}
                                    </p>
                                    
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {indicator.tags.map(tag => (
                                            <span key={tag} className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full font-medium">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    
                                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                                        <span className="font-mono">ID: {indicator.fredSeriesId}</span>
                                        <span className="flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                            View Data
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                );
            })}

            {/* Fallback if no indicators */}
            {indicators.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-gray-400 dark:text-gray-600 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No indicators available</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        Could not load economic indicators. Please check your connection and try again.
                    </p>
                </div>
            )}
        </div>
    );
}

export const metadata = {
    title: 'Discover Economic Indicators | Sphere',
    description: 'Explore comprehensive macroeconomic indicators including GDP, inflation, employment, and market data. Make informed investment decisions with real-time economic insights.',
};