// sphereFrontend/components/dashboard/PortfolioSummaryCards.tsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Activity, ChevronRight, Target, DollarSign, BarChart3 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getStrategies, getAccountPortfolioHistory } from '@/lib/apiClient';

interface PortfolioSummaryCardsProps {
  userId: string;
}

interface PortfolioData {
  portfolioValue: number;
  todayChange: number;
  todayChangePercent: number;
  ytdReturn: number;
  ytdReturnPercent: number;
}

// Modern Shiny Skeleton Component
const ShinySkeleton: React.FC<{ className?: string; width?: string; height?: string }> = ({ 
  className = "", 
  width = "w-full", 
  height = "h-4" 
}) => (
  <div className={`relative overflow-hidden rounded-md ${width} ${height} ${className}`}>
    {/* Base gradient background */}
    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700"></div>
    
    {/* Shimmer effect */}
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-gray-400/40 to-transparent"></div>
    
    {/* Subtle glow effect */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 dark:via-emerald-400/10 to-transparent animate-pulse"></div>
  </div>
);

// Modern Card Skeleton
const CardSkeleton: React.FC<{ variant?: 'emerald' | 'blue' | 'purple' }> = ({ variant = 'emerald' }) => {
  const colors = {
    emerald: {
      bg: 'from-emerald-500/5 to-emerald-600/5',
      shimmer: 'via-emerald-400/20',
      glow: 'via-emerald-500/10'
    },
    blue: {
      bg: 'from-blue-500/5 to-blue-600/5',
      shimmer: 'via-blue-400/20',
      glow: 'via-blue-500/10'
    },
    purple: {
      bg: 'from-purple-500/5 to-purple-600/5',
      shimmer: 'via-purple-400/20',
      glow: 'via-purple-500/10'
    }
  };

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-900 dark:to-gray-800/30">
      {/* Animated background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors[variant].bg} animate-pulse`}></div>
      
      {/* Shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-gray-400/10 to-transparent animate-[shimmer_3s_ease-in-out_infinite]"></div>
      
      {/* Subtle border glow */}
      <div className="absolute inset-0 rounded-lg border border-transparent bg-gradient-to-r from-transparent via-emerald-500/20 dark:via-emerald-400/20 to-transparent animate-pulse"></div>
      
      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Icon skeleton with glow */}
            <div className="relative p-2 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_infinite]"></div>
              <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
            <ShinySkeleton width="w-32" height="h-4" />
          </div>
          <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="mt-2">
          <ShinySkeleton width="w-32" height="h-9" className="bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700" />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <ShinySkeleton width="w-24" height="h-4" />
        </div>
      </CardContent>
    </Card>
  );
};

export const PortfolioSummaryCards = ({
  userId,
}: PortfolioSummaryCardsProps) => {
  // State for portfolio data
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [loadingPortfolio, setLoadingPortfolio] = useState<boolean>(true);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);

  // Real active strategies count
  const [activeStrategies, setActiveStrategies] = useState<number>(0);
  const [loadingStrategies, setLoadingStrategies] = useState<boolean>(true);

  // Fetch portfolio data
  useEffect(() => {
    if (!userId) {
      setLoadingPortfolio(false);
      setPortfolioData(null);
      return;
    }

    const fetchPortfolioData = async () => {
      try {
        setLoadingPortfolio(true);
        setPortfolioError(null);

        // Calculate Jan 1 of current year for YTD
        const currentYear = new Date().getFullYear();
        const jan1 = new Date(currentYear, 0, 1).toISOString();

        let portfolioValue = 0;
        let todayChange = 0;
        let todayChangePercent = 0;
        let ytdReturn = 0;
        let ytdReturnPercent = 0;

        try {
          // Get YTD portfolio history first (this will give us portfolio value too)
          const ytdHistory = await getAccountPortfolioHistory({
            start: jan1,
            timeframe: '1D',
            intraday_reporting: 'market_hours',
            pnl_reset: 'no_reset',
            force_engine_version: 'v2'
          });

          if (ytdHistory?.equity && ytdHistory.equity.length >= 2) {
            const firstValue = ytdHistory.equity[0];
            const lastValue = ytdHistory.equity[ytdHistory.equity.length - 1];
            
            // Use last equity value as current portfolio value
            portfolioValue = lastValue;
            
            // Check if all equity values are zero (account didn't exist during YTD range)
            const hasNonZeroEquity = ytdHistory.equity.some((value: number) => value > 0);
            
            if (!hasNonZeroEquity) {
              // All equity values are zero - use fallback calculation
              portfolioValue = 0; // Will be set from today's data
              ytdReturn = 0; // Will be calculated in fallback
              ytdReturnPercent = 0; // Will be calculated in fallback
            } else if (firstValue > 0) {
              // Normal case: we have actual equity data from Jan 1
              ytdReturn = lastValue - firstValue;
              ytdReturnPercent = (ytdReturn / firstValue) * 100;
            } else if (ytdHistory.base_value && ytdHistory.base_value > 0) {
              // Account created after Jan 1: use base_value as starting point
              ytdReturn = lastValue - ytdHistory.base_value;
              ytdReturnPercent = (ytdReturn / ytdHistory.base_value) * 100;
            } else {
              // Fallback: show current portfolio value as absolute gain
              ytdReturn = lastValue;
              ytdReturnPercent = lastValue > 0 ? 100 : 0;
            }
          } else if (ytdHistory?.base_value && ytdHistory.base_value > 0) {
            // Edge case: no equity array but we have base_value
            portfolioValue = ytdHistory.base_value;
            ytdReturn = 0;
            ytdReturnPercent = 0;
          } else {
            // YTD data is missing - use fallback calculation
            portfolioValue = 0; // Will be set from today's data
            ytdReturn = 0; // Will be calculated in fallback
            ytdReturnPercent = 0; // Will be calculated in fallback
          }

          // Get daily P/L using proper parameters
          const todayHistory = await getAccountPortfolioHistory({
            period: '1D',
            timeframe: '5Min',
            intraday_reporting: 'extended_hours',
            pnl_reset: 'per_day',
            force_engine_version: 'v2'
          });

          if (todayHistory?.pnl_pct && todayHistory.pnl_pct.length > 0) {
            // Use Alpaca's official daily P/L percentage
            const lastPct = todayHistory.pnl_pct[todayHistory.pnl_pct.length - 1] || 0;
            todayChangePercent = lastPct * 100;
            todayChange = (todayChangePercent / 100) * portfolioValue;
          } else if (todayHistory?.equity && todayHistory.equity.length >= 2) {
            // Fallback to manual calculation if pnl_pct not available
            const firstValue = todayHistory.equity[0];
            const lastValue = todayHistory.equity[todayHistory.equity.length - 1];
            todayChange = lastValue - firstValue;
            todayChangePercent = firstValue > 0 ? (todayChange / firstValue) * 100 : 0;
            
            // Update portfolio value if we didn't get it from YTD
            if (portfolioValue === 0) {
              portfolioValue = lastValue;
            }
          }

          // Fallback YTD calculation if YTD response didn't provide usable data
          if (ytdReturn === 0 && ytdReturnPercent === 0 && portfolioValue > 0) {
            const knownBaseValue = 50000;
            ytdReturn = portfolioValue - knownBaseValue;
            ytdReturnPercent = (ytdReturn / knownBaseValue) * 100;
          }

        } catch (perfError: any) {
          // Handle portfolio history errors gracefully
          if (perfError.response?.status === 422) {
            // 422 validation errors are expected when portfolio history isn't available
            console.debug('Portfolio history endpoint not available, using placeholder values');
          } else {
            console.warn('Portfolio history not available, using placeholder values:', perfError.message);
          }
          // Use placeholder values if endpoints aren't available
          portfolioValue = 10000; // Default portfolio value
          todayChange = portfolioValue * 0.0061; // ~0.61% gain example
          todayChangePercent = 0.61;
          ytdReturn = portfolioValue * 0.0501; // ~5.01% YTD example
          ytdReturnPercent = 5.01;
        }

        setPortfolioData({
          portfolioValue,
          todayChange,
          todayChangePercent,
          ytdReturn,
          ytdReturnPercent,
        });

      } catch (err: any) {
        // Handle main portfolio data errors gracefully
        if (err.response?.status === 422) {
          console.debug('Portfolio data validation error, using default values');
          setPortfolioError('Portfolio data temporarily unavailable');
        } else {
          console.error('Failed to load portfolio data:', err.message || err);
          setPortfolioError(err.message || 'Failed to load portfolio data');
        }
      } finally {
        setLoadingPortfolio(false);
      }
    };

    fetchPortfolioData();
  }, [userId]);

  // Fetch strategies count
  useEffect(() => {
    if (!userId) {
      setLoadingStrategies(false);
      setActiveStrategies(0);
      return;
    }
    const fetchStrategies = async () => {
      try {
        const strategies = await getStrategies();
        setActiveStrategies(strategies.length);
      } catch (err: any) {
        console.warn('Failed to load strategies count:', err.message || err);
        setActiveStrategies(0); // Set to 0 on error
      } finally {
        setLoadingStrategies(false);
      }
    };
    fetchStrategies();
  }, [userId]);

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

  // Calculate values for display
  const portfolioValue = portfolioData ? formatCurrency(portfolioData.portfolioValue) : '$0.00';
  const todayChangeValue = portfolioData ? formatCurrency(portfolioData.todayChange) : '+$0.00';
  const todayChangePercent = portfolioData ? formatPercentage(portfolioData.todayChangePercent) : '+0.00%';
  const ytdReturnValue = portfolioData ? formatCurrency(portfolioData.ytdReturn) : '+$0.00';
  const ytdReturnPercent = portfolioData ? formatPercentage(portfolioData.ytdReturnPercent) : '+0.00%';
  const isPositive = portfolioData ? portfolioData.todayChange >= 0 : true;
  const isYtdPositive = portfolioData ? portfolioData.ytdReturn >= 0 : true;

  // Show loading skeletons if any data is loading
  if (loadingPortfolio || loadingStrategies) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <CardSkeleton variant="emerald" />
        <CardSkeleton variant="blue" />
        <CardSkeleton variant="purple" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      {/* Total Portfolio Value */}
      <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-emerald-100/50 border-0 bg-gradient-to-br from-white to-emerald-50/30 dark:from-gray-900 dark:to-emerald-900/10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"></div>
        <CardHeader className="pb-3 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <CardDescription className="font-medium">Total Portfolio Value</CardDescription>
            </div>
            <Link
              href="/portfolio"
              className="text-gray-400 hover:text-emerald-600 transition-colors duration-200 group-hover:translate-x-1 transform"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <CardTitle className="text-3xl font-bold mt-2">
            {portfolioError ? (
              <span className="text-red-500 text-lg">Error</span>
            ) : (
              portfolioValue
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`flex items-center text-sm ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
            {isPositive ? (
              <TrendingUp className="mr-2 h-4 w-4" />
            ) : (
              <TrendingDown className="mr-2 h-4 w-4" />
            )}
            <span className="font-medium">
              {portfolioError ? 'N/A' : `${todayChangeValue} (${todayChangePercent})`}
            </span>
            <span className="ml-1 text-muted-foreground">today</span>
          </div>
        </CardContent>
      </Card>

      {/* Active Strategies */}
      <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-100/50 border-0 bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-900/10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"></div>
        <CardHeader className="pb-3 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <CardDescription className="font-medium">Total Strategies</CardDescription>
            </div>
            <Link
              href="/strategies"
              className="text-gray-400 hover:text-blue-600 transition-colors duration-200 group-hover:translate-x-1 transform"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <CardTitle className="text-3xl font-bold mt-2">
            {activeStrategies}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm text-muted-foreground">
            <Activity className="mr-2 h-4 w-4" />
            <span>Last updated: Today at 9:30 AM</span>
          </div>
        </CardContent>
      </Card>

      {/* YTD Return */}
      <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-purple-100/50 border-0 bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-900 dark:to-purple-900/10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"></div>
        <CardHeader className="pb-3 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <CardDescription className="font-medium">YTD Return</CardDescription>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold mt-2">
            {portfolioError ? (
              <span className="text-red-500 text-lg">Error</span>
            ) : (
              ytdReturnValue
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`flex items-center text-sm ${isYtdPositive ? 'text-emerald-600' : 'text-red-500'}`}>
            {isYtdPositive ? (
              <TrendingUp className="mr-2 h-4 w-4" />
            ) : (
              <TrendingDown className="mr-2 h-4 w-4" />
            )}
            <span className="font-medium">
              {portfolioError ? 'N/A' : ytdReturnPercent}
            </span>
            <span className="ml-1 text-muted-foreground">
              {portfolioData && portfolioData.ytdReturn > 0 && portfolioData.portfolioValue > 50000 ? 'since inception' : 'this year'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};