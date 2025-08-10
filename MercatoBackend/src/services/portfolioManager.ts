/**
 * Advanced Portfolio Management Service
 * Provides comprehensive portfolio analytics, risk management, and performance tracking
 * 
 * Features:
 * - Real-time P&L calculations
 * - Risk metrics (VaR, Sharpe, Sortino, etc.)
 * - Position sizing and exposure limits
 * - Portfolio optimization
 * - Performance attribution
 */

import { PrismaClient } from '@prisma/client';
import { getRedisClient } from '../utils/redisClient';
import alpaca from '../services/alpacaClient';

const prisma = new PrismaClient();

export interface Position {
    symbol: string;
    quantity: number;
    averagePrice: number;
    currentPrice: number;
    marketValue: number;
    unrealizedPnl: number;
    unrealizedPnlPercent: number;
    dayChange: number;
    dayChangePercent: number;
    allocation: number; // Percentage of portfolio
}

export interface PortfolioSummary {
    totalValue: number;
    cash: number;
    positionsValue: number;
    dayChange: number;
    dayChangePercent: number;
    totalReturn: number;
    totalReturnPercent: number;
    unrealizedPnl: number;
    realizedPnl: number;
}

export interface RiskMetrics {
    portfolioValue: number;
    var95: number; // Value at Risk 95%
    var99: number; // Value at Risk 99%
    expectedShortfall: number; // Conditional VaR
    sharpeRatio: number;
    sortinoRatio: number;
    maxDrawdown: number;
    volatility: number;
    beta: number;
    alpha: number;
    correlationWithMarket: number;
    concentrationRisk: number; // Largest position as % of portfolio
    sectorExposure: Record<string, number>;
}

export interface PerformanceMetrics {
    period: string;
    returns: number;
    benchmark: number;
    alpha: number;
    beta: number;
    sharpe: number;
    sortino: number;
    volatility: number;
    maxDrawdown: number;
    winRate: number;
    profitFactor: number;
    calmarRatio: number;
}

export interface RiskLimits {
    maxPositionSize: number; // Maximum % of portfolio in single position
    maxSectorExposure: number; // Maximum % exposure to single sector
    maxVaR: number; // Maximum Value at Risk
    maxDrawdown: number; // Maximum allowed drawdown
    maxLeverage: number; // Maximum leverage ratio
    stopLossPercent: number; // Automatic stop loss percentage
}

class PortfolioManager {
    private userId: string;
    private riskLimits: RiskLimits;

    constructor(userId: string, riskLimits: Partial<RiskLimits> = {}) {
        this.userId = userId;
        this.riskLimits = {
            maxPositionSize: 0.1, // 10%
            maxSectorExposure: 0.3, // 30%
            maxVaR: 0.05, // 5%
            maxDrawdown: 0.2, // 20%
            maxLeverage: 1.0, // No leverage by default
            stopLossPercent: 0.15, // 15%
            ...riskLimits
        };
    }

    /**
     * Get current portfolio positions
     */
    async getPositions(): Promise<Position[]> {
        try {
            // Get positions from Alpaca
            const alpacaPositions = await alpaca.getPositions();
            const positions: Position[] = [];

            for (const position of alpacaPositions) {
                const quantity = parseFloat(position.qty);
                const averagePrice = parseFloat(position.avg_cost);
                const currentPrice = parseFloat(position.current_price);
                
                const marketValue = quantity * currentPrice;
                const unrealizedPnl = marketValue - (quantity * averagePrice);
                const unrealizedPnlPercent = averagePrice > 0 ? unrealizedPnl / (quantity * averagePrice) : 0;

                // Calculate day change (using unrealized_intraday_pl for daily P&L)
                const dayChange = parseFloat(position.unrealized_intraday_pl || '0');
                const dayChangePercent = marketValue > 0 ? dayChange / (marketValue - dayChange) : 0;

                positions.push({
                    symbol: position.symbol,
                    quantity: quantity,
                    averagePrice: averagePrice,
                    currentPrice: currentPrice,
                    marketValue: marketValue,
                    unrealizedPnl: unrealizedPnl,
                    unrealizedPnlPercent: unrealizedPnlPercent,
                    dayChange: dayChange,
                    dayChangePercent: dayChangePercent,
                    allocation: 0 // Will be calculated in portfolio summary
                });
            }

            return positions;

        } catch (error) {
            console.error('[Portfolio] Error getting positions:', error);
            return [];
        }
    }

    /**
     * Calculate portfolio summary
     */
    async getPortfolioSummary(): Promise<PortfolioSummary> {
        try {
            const account = await alpaca.getAccount();
            const positions = await this.getPositions();

            const cash = parseFloat(account.cash);
            const positionsValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
            const totalValue = cash + positionsValue;

            const dayChange = positions.reduce((sum, pos) => sum + pos.dayChange, 0);
            const dayChangePercent = totalValue > 0 ? dayChange / totalValue : 0;

            const unrealizedPnl = positions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0);
            const totalReturn = parseFloat(account.portfolio_value) - parseFloat(account.last_equity);
            const totalReturnPercent = parseFloat(account.last_equity) > 0 ? 
                totalReturn / parseFloat(account.last_equity) : 0;

            // Update allocation percentages
            positions.forEach(pos => {
                pos.allocation = totalValue > 0 ? pos.marketValue / totalValue : 0;
            });

            return {
                totalValue: totalValue,
                cash: cash,
                positionsValue: positionsValue,
                dayChange: dayChange,
                dayChangePercent: dayChangePercent,
                totalReturn: totalReturn,
                totalReturnPercent: totalReturnPercent,
                unrealizedPnl: unrealizedPnl,
                realizedPnl: parseFloat(account.daytrading_buying_power) - parseFloat(account.cash) // Simplified
            };

        } catch (error) {
            console.error('[Portfolio] Error calculating portfolio summary:', error);
            throw error;
        }
    }

    /**
     * Calculate comprehensive risk metrics
     */
    async calculateRiskMetrics(): Promise<RiskMetrics> {
        try {
            const positions = await this.getPositions();
            const summary = await this.getPortfolioSummary();
            
            // Get historical returns for risk calculations
            const returns = await this.getHistoricalReturns(252); // 1 year of daily returns
            const marketReturns = await this.getMarketReturns(252); // SPY returns

            // Calculate VaR using historical simulation
            const sortedReturns = returns.sort((a, b) => a - b);
            const var95Index = Math.floor(returns.length * 0.05);
            const var99Index = Math.floor(returns.length * 0.01);
            
            const var95 = summary.totalValue * Math.abs(sortedReturns[var95Index] || 0.05);
            const var99 = summary.totalValue * Math.abs(sortedReturns[var99Index] || 0.1);

            // Expected Shortfall (Conditional VaR)
            const expectedShortfall = summary.totalValue * Math.abs(
                sortedReturns.slice(0, var95Index).reduce((sum, ret) => sum + ret, 0) / var95Index
            );

            // Calculate Sharpe and Sortino ratios
            const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
            const volatility = this.calculateVolatility(returns);
            const riskFreeRate = 0.02 / 252; // Assume 2% annual risk-free rate
            
            const sharpeRatio = volatility > 0 ? (avgReturn - riskFreeRate) / volatility : 0;
            
            const downsideReturns = returns.filter(ret => ret < 0);
            const downsideVolatility = downsideReturns.length > 0 ? 
                this.calculateVolatility(downsideReturns) : volatility;
            const sortinoRatio = downsideVolatility > 0 ? (avgReturn - riskFreeRate) / downsideVolatility : 0;

            // Calculate Beta and Alpha
            const beta = this.calculateBeta(returns, marketReturns);
            const marketAvgReturn = marketReturns.reduce((sum, ret) => sum + ret, 0) / marketReturns.length;
            const alpha = avgReturn - (riskFreeRate + beta * (marketAvgReturn - riskFreeRate));

            // Calculate Maximum Drawdown
            const maxDrawdown = this.calculateMaxDrawdown(returns);

            // Calculate correlation with market
            const correlation = this.calculateCorrelation(returns, marketReturns);

            // Concentration risk (largest position)
            const concentrationRisk = positions.length > 0 ? 
                Math.max(...positions.map(pos => pos.allocation)) : 0;

            // Sector exposure (simplified - would use actual sector classification)
            const sectorExposure = this.calculateSectorExposure(positions);

            return {
                portfolioValue: summary.totalValue,
                var95: var95,
                var99: var99,
                expectedShortfall: expectedShortfall,
                sharpeRatio: sharpeRatio,
                sortinoRatio: sortinoRatio,
                maxDrawdown: maxDrawdown,
                volatility: volatility * Math.sqrt(252), // Annualized
                beta: beta,
                alpha: alpha * 252, // Annualized
                correlationWithMarket: correlation,
                concentrationRisk: concentrationRisk,
                sectorExposure: sectorExposure
            };

        } catch (error) {
            console.error('[Portfolio] Error calculating risk metrics:', error);
            throw error;
        }
    }

    /**
     * Check if a trade violates risk limits
     */
    async checkRiskLimits(symbol: string, quantity: number, price: number): Promise<{
        allowed: boolean;
        violations: string[];
        suggestions: string[];
    }> {
        const violations: string[] = [];
        const suggestions: string[] = [];

        try {
            const summary = await this.getPortfolioSummary();
            const positions = await this.getPositions();
            const riskMetrics = await this.calculateRiskMetrics();

            const tradeValue = Math.abs(quantity * price);
            const newPositionAllocation = tradeValue / summary.totalValue;

            // Check position size limit
            if (newPositionAllocation > this.riskLimits.maxPositionSize) {
                violations.push(`Position size ${(newPositionAllocation * 100).toFixed(1)}% exceeds limit of ${(this.riskLimits.maxPositionSize * 100).toFixed(1)}%`);
                suggestions.push(`Reduce quantity to ${Math.floor(summary.totalValue * this.riskLimits.maxPositionSize / price)} shares`);
            }

            // Check VaR limit
            if (riskMetrics.var95 / summary.totalValue > this.riskLimits.maxVaR) {
                violations.push(`Portfolio VaR ${(riskMetrics.var95 / summary.totalValue * 100).toFixed(1)}% exceeds limit of ${(this.riskLimits.maxVaR * 100).toFixed(1)}%`);
                suggestions.push('Consider reducing overall portfolio risk before adding new positions');
            }

            // Check maximum drawdown
            if (riskMetrics.maxDrawdown > this.riskLimits.maxDrawdown) {
                violations.push(`Portfolio drawdown ${(riskMetrics.maxDrawdown * 100).toFixed(1)}% exceeds limit of ${(this.riskLimits.maxDrawdown * 100).toFixed(1)}%`);
                suggestions.push('Portfolio is experiencing high drawdown - consider risk reduction');
            }

            // Check concentration risk
            if (riskMetrics.concentrationRisk > this.riskLimits.maxPositionSize) {
                violations.push(`Concentration risk ${(riskMetrics.concentrationRisk * 100).toFixed(1)}% exceeds limit`);
                suggestions.push('Consider diversifying across more positions');
            }

            return {
                allowed: violations.length === 0,
                violations: violations,
                suggestions: suggestions
            };

        } catch (error) {
            console.error('[Portfolio] Error checking risk limits:', error);
            return {
                allowed: false,
                violations: ['Error checking risk limits'],
                suggestions: ['Please try again']
            };
        }
    }

    /**
     * Calculate optimal position size based on Kelly Criterion
     */
    async calculateOptimalPositionSize(symbol: string, expectedReturn: number, winRate: number): Promise<{
        kellyPercent: number;
        recommendedShares: number;
        riskAdjustedShares: number;
    }> {
        try {
            const summary = await this.getPortfolioSummary();
            
            // Get historical volatility for the symbol
            const symbolReturns = await this.getSymbolReturns(symbol, 60); // 60 days
            const volatility = this.calculateVolatility(symbolReturns);
            
            // Kelly Criterion: f = (bp - q) / b
            // where f = fraction of capital to wager
            // b = odds received on the wager (expected return / risk)
            // p = probability of winning (win rate)
            // q = probability of losing (1 - win rate)
            
            const avgLoss = volatility; // Simplified - use volatility as average loss
            const kellyPercent = Math.max(0, Math.min(0.25, // Cap at 25%
                (expectedReturn * winRate - (1 - winRate) * avgLoss) / avgLoss
            ));
            
            // Apply risk limit constraints
            const constrainedPercent = Math.min(kellyPercent, this.riskLimits.maxPositionSize);
            
            // Use current price from position data or get latest quote
            let currentPrice = 0;
            try {
                const quote = await alpaca.getLatestQuote(symbol);
                currentPrice = quote.AskPrice || quote.BidPrice || 0;
            } catch (error) {
                console.error(`Error getting quote for ${symbol}:`, error);
                return {
                    kellyPercent: kellyPercent,
                    recommendedShares: 0,
                    riskAdjustedShares: 0
                };
            }
            
            if (currentPrice === 0) {
                throw new Error(`Unable to get current price for ${symbol}`);
            }
            
            const recommendedShares = Math.floor(summary.totalValue * kellyPercent / currentPrice);
            const riskAdjustedShares = Math.floor(summary.totalValue * constrainedPercent / currentPrice);
            
            return {
                kellyPercent: kellyPercent,
                recommendedShares: recommendedShares,
                riskAdjustedShares: riskAdjustedShares
            };

        } catch (error) {
            console.error('[Portfolio] Error calculating optimal position size:', error);
            throw error;
        }
    }

    /**
     * Store portfolio snapshot for historical tracking
     */
    async storePortfolioSnapshot(): Promise<void> {
        try {
            const summary = await this.getPortfolioSummary();
            const positions = await this.getPositions();
            const riskMetrics = await this.calculateRiskMetrics();

            // Store in database
            await prisma.portfolioHistory.create({
                data: {
                    userId: this.userId,
                    timestamp: new Date(),
                    totalValue: summary.totalValue,
                    cash: summary.cash,
                    positions: JSON.stringify(positions),
                    dayChange: summary.dayChange,
                    dayChangePercent: summary.dayChangePercent,
                    unrealizedPnl: summary.unrealizedPnl,
                    realizedPnl: summary.realizedPnl
                }
            });

            // Store performance metrics
            await prisma.performanceMetrics.create({
                data: {
                    strategyId: `portfolio_${this.userId}`, // Use a portfolio identifier
                    userId: this.userId,
                    date: new Date(),
                    totalValue: summary.totalValue,
                    dayReturn: summary.dayChangePercent,
                    cumulativeReturn: summary.totalReturnPercent,
                    sharpeRatio: riskMetrics.sharpeRatio,
                    volatility: riskMetrics.volatility,
                    maxDrawdown: riskMetrics.maxDrawdown,
                    beta: riskMetrics.beta,
                    alpha: riskMetrics.alpha,
                    var95: riskMetrics.var95,
                    var99: riskMetrics.var99
                }
            });

            console.log(`[Portfolio] Stored portfolio snapshot for user ${this.userId}`);

        } catch (error) {
            console.error('[Portfolio] Error storing portfolio snapshot:', error);
        }
    }

    /**
     * Private helper methods
     */

    private async getHistoricalReturns(days: number): Promise<number[]> {
        // This would fetch actual portfolio historical returns
        // For now, return mock data
        return Array.from({ length: days }, () => (Math.random() - 0.5) * 0.04);
    }

    private async getMarketReturns(days: number): Promise<number[]> {
        // This would fetch SPY returns from Alpaca
        // For now, return mock data
        return Array.from({ length: days }, () => (Math.random() - 0.5) * 0.02);
    }

    private async getSymbolReturns(symbol: string, days: number): Promise<number[]> {
        try {
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
            
            const bars = await alpaca.getBarsV2(symbol, {
                start: startDate.toISOString(),
                end: endDate.toISOString(),
                timeframe: '1Day'
            });

            const prices = [];
            for await (const bar of bars) {
                prices.push(bar.ClosePrice);
            }

            const returns = [];
            for (let i = 1; i < prices.length; i++) {
                returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
            }

            return returns;

        } catch (error) {
            console.error(`Error getting returns for ${symbol}:`, error);
            return [];
        }
    }

    private calculateVolatility(returns: number[]): number {
        if (returns.length === 0) return 0;
        
        const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
        return Math.sqrt(variance);
    }

    private calculateBeta(portfolioReturns: number[], marketReturns: number[]): number {
        if (portfolioReturns.length !== marketReturns.length || portfolioReturns.length === 0) {
            return 1.0; // Default beta
        }

        const portfolioMean = portfolioReturns.reduce((sum, ret) => sum + ret, 0) / portfolioReturns.length;
        const marketMean = marketReturns.reduce((sum, ret) => sum + ret, 0) / marketReturns.length;

        let covariance = 0;
        let marketVariance = 0;

        for (let i = 0; i < portfolioReturns.length; i++) {
            const portfolioDiff = portfolioReturns[i] - portfolioMean;
            const marketDiff = marketReturns[i] - marketMean;
            
            covariance += portfolioDiff * marketDiff;
            marketVariance += marketDiff * marketDiff;
        }

        covariance /= portfolioReturns.length;
        marketVariance /= marketReturns.length;

        return marketVariance !== 0 ? covariance / marketVariance : 1.0;
    }

    private calculateCorrelation(returns1: number[], returns2: number[]): number {
        if (returns1.length !== returns2.length || returns1.length === 0) return 0;

        const mean1 = returns1.reduce((sum, ret) => sum + ret, 0) / returns1.length;
        const mean2 = returns2.reduce((sum, ret) => sum + ret, 0) / returns2.length;

        let numerator = 0;
        let sum1Sq = 0;
        let sum2Sq = 0;

        for (let i = 0; i < returns1.length; i++) {
            const diff1 = returns1[i] - mean1;
            const diff2 = returns2[i] - mean2;
            
            numerator += diff1 * diff2;
            sum1Sq += diff1 * diff1;
            sum2Sq += diff2 * diff2;
        }

        const denominator = Math.sqrt(sum1Sq * sum2Sq);
        return denominator !== 0 ? numerator / denominator : 0;
    }

    private calculateMaxDrawdown(returns: number[]): number {
        let maxDrawdown = 0;
        let peak = 1;
        let value = 1;

        for (const ret of returns) {
            value *= (1 + ret);
            if (value > peak) {
                peak = value;
            }
            const drawdown = (peak - value) / peak;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }

        return maxDrawdown;
    }

    private calculateSectorExposure(positions: Position[]): Record<string, number> {
        // Simplified sector classification - in reality, you'd use a proper sector mapping
        const sectorMap: Record<string, string> = {
            'AAPL': 'Technology',
            'MSFT': 'Technology',
            'NVDA': 'Technology',
            'TSLA': 'Consumer Discretionary',
            'SPY': 'Diversified',
            'QQQ': 'Technology',
            // Add more mappings as needed
        };

        const sectorExposure: Record<string, number> = {};

        for (const position of positions) {
            const sector = sectorMap[position.symbol] || 'Other';
            sectorExposure[sector] = (sectorExposure[sector] || 0) + position.allocation;
        }

        return sectorExposure;
    }
}

export { PortfolioManager };
