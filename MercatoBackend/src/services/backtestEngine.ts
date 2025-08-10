/**
 * Advanced Backtesting Engine
 * Provides comprehensive strategy backtesting with realistic market simulation
 * 
 * Features:
 * - Historical data replay
 * - Slippage and commission modeling
 * - Risk-adjusted performance metrics
 * - Portfolio simulation
 * - Benchmark comparison
 */

import { PrismaClient, Strategy, StrategyBlock } from '@prisma/client';
import alpaca from '../services/alpacaClient';
import { getTechnicalIndicator } from '../controllers/technicalIndicators/technicalIndicators';

const prisma = new PrismaClient();

export interface BacktestConfig {
    strategyId: string;
    startDate: Date;
    endDate: Date;
    initialCapital: number;
    commission: number; // Per trade
    slippage: number; // Percentage
    benchmarkSymbol?: string; // Default: SPY
}

export interface Trade {
    id: string;
    timestamp: Date;
    symbol: string;
    action: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    commission: number;
    slippage: number;
    totalCost: number;
    reason: string; // Strategy condition that triggered the trade
}

export interface Position {
    symbol: string;
    quantity: number;
    averagePrice: number;
    marketValue: number;
    unrealizedPnl: number;
    unrealizedPnlPercent: number;
}

export interface PortfolioSnapshot {
    timestamp: Date;
    totalValue: number;
    cash: number;
    positions: Position[];
    dayChange: number;
    dayChangePercent: number;
}

export interface BacktestMetrics {
    totalReturn: number;
    annualizedReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    volatility: number;
    beta: number;
    alpha: number;
    sortino: number;
    calmar: number;
    var95: number; // Value at Risk 95%
    var99: number; // Value at Risk 99%
    winRate: number;
    profitFactor: number;
    avgWin: number;
    avgLoss: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
}

export interface BacktestResult {
    config: BacktestConfig;
    metrics: BacktestMetrics;
    trades: Trade[];
    portfolioHistory: PortfolioSnapshot[];
    benchmarkReturns?: number[];
    dailyReturns: number[];
    drawdownSeries: number[];
}

class BacktestEngine {
    private trades: Trade[] = [];
    private portfolioHistory: PortfolioSnapshot[] = [];
    private positions: Map<string, Position> = new Map();
    private cash: number = 0;
    private config: BacktestConfig;

    constructor(config: BacktestConfig) {
        this.config = config;
        this.cash = config.initialCapital;
    }

    /**
     * Run comprehensive backtest for a strategy
     */
    async runBacktest(strategyId: string): Promise<BacktestResult> {
        console.log(`[Backtest] Starting backtest for strategy ${strategyId}`);
        
        // Initialize
        this.trades = [];
        this.portfolioHistory = [];
        this.positions = new Map();
        this.cash = this.config.initialCapital;

        // Get strategy details
        const strategy = await this.getStrategyWithBlocks(strategyId);
        if (!strategy) {
            throw new Error(`Strategy ${strategyId} not found`);
        }

        // Get historical market data
        const marketData = await this.getHistoricalData(strategy);
        
        // Get benchmark data if specified
        const benchmarkData = this.config.benchmarkSymbol 
            ? await this.getBenchmarkData(this.config.benchmarkSymbol)
            : null;

        // Simulate trading day by day
        const tradingDays = this.getTradingDays(this.config.startDate, this.config.endDate);
        
        for (const date of tradingDays) {
            await this.simulateTradingDay(date, strategy, marketData);
            this.recordPortfolioSnapshot(date, marketData);
        }

        // Calculate performance metrics
        const metrics = await this.calculateMetrics(benchmarkData || undefined);
        
        // Store results in database
        await this.storeBacktestResult(strategyId, metrics);

        console.log(`[Backtest] Completed backtest for strategy ${strategyId}`);
        console.log(`[Backtest] Total Return: ${(metrics.totalReturn * 100).toFixed(2)}%`);
        console.log(`[Backtest] Sharpe Ratio: ${metrics.sharpeRatio.toFixed(2)}`);
        console.log(`[Backtest] Max Drawdown: ${(metrics.maxDrawdown * 100).toFixed(2)}%`);

        return {
            config: this.config,
            metrics,
            trades: this.trades,
            portfolioHistory: this.portfolioHistory,
            benchmarkReturns: benchmarkData?.returns,
            dailyReturns: this.calculateDailyReturns(),
            drawdownSeries: this.calculateDrawdownSeries()
        };
    }

    /**
     * Get strategy with all blocks and conditions
     */
    private async getStrategyWithBlocks(strategyId: string) {
        return await prisma.strategy.findUnique({
            where: { id: strategyId },
            include: {
                blocks: {
                    include: {
                        condition: true,
                        action: true,
                        children: true
                    }
                }
            }
        });
    }

    /**
     * Get historical market data for all assets used in strategy
     */
    private async getHistoricalData(strategy: any): Promise<Map<string, any[]>> {
        const symbols = this.extractSymbolsFromStrategy(strategy);
        const marketData = new Map<string, any[]>();

        for (const symbol of symbols) {
            try {
                // Get daily price data from Alpaca
                const bars = await alpaca.getBarsV2(symbol, {
                    start: this.config.startDate.toISOString(),
                    end: this.config.endDate.toISOString(),
                    timeframe: '1Day',
                    feed: 'iex'
                });

                const priceData = [];
                for await (const bar of bars) {
                    priceData.push({
                        timestamp: new Date(bar.Timestamp),
                        open: bar.OpenPrice,
                        high: bar.HighPrice,
                        low: bar.LowPrice,
                        close: bar.ClosePrice,
                        volume: bar.Volume
                    });
                }

                marketData.set(symbol, priceData);
                console.log(`[Backtest] Loaded ${priceData.length} bars for ${symbol}`);

            } catch (error) {
                console.error(`[Backtest] Error loading data for ${symbol}:`, error);
            }
        }

        return marketData;
    }

    /**
     * Extract all symbols used in strategy conditions
     */
    private extractSymbolsFromStrategy(strategy: any): Set<string> {
        const symbols = new Set<string>();
        
        const processBlock = (block: any) => {
            if (block.condition?.symbol) {
                symbols.add(block.condition.symbol);
            }
            if (block.action?.parameters?.symbol) {
                symbols.add(block.action.parameters.symbol);
            }
            if (block.children) {
                block.children.forEach(processBlock);
            }
        };

        strategy.blocks.forEach(processBlock);
        return symbols;
    }

    /**
     * Get benchmark data for comparison
     */
    private async getBenchmarkData(symbol: string): Promise<{returns: number[], prices: number[]} | null> {
        try {
            const bars = await alpaca.getBarsV2(symbol, {
                start: this.config.startDate.toISOString(),
                end: this.config.endDate.toISOString(),
                timeframe: '1Day',
                feed: 'iex'
            });

            const prices: number[] = [];
            for await (const bar of bars) {
                prices.push(bar.ClosePrice);
            }

            const returns = prices.slice(1).map((price, i) => 
                (price - prices[i]) / prices[i]
            );

            return { returns, prices };

        } catch (error) {
            console.error(`[Backtest] Error loading benchmark data for ${symbol}:`, error);
            return null;
        }
    }

    /**
     * Get trading days between start and end date
     */
    private getTradingDays(startDate: Date, endDate: Date): Date[] {
        const days = [];
        const current = new Date(startDate);
        
        while (current <= endDate) {
            // Skip weekends (0 = Sunday, 6 = Saturday)
            if (current.getDay() !== 0 && current.getDay() !== 6) {
                days.push(new Date(current));
            }
            current.setDate(current.getDate() + 1);
        }
        
        return days;
    }

    /**
     * Simulate trading for a single day
     */
    private async simulateTradingDay(date: Date, strategy: any, marketData: Map<string, any[]>) {
        // Evaluate strategy conditions for this date
        const signals = await this.evaluateStrategyConditions(date, strategy, marketData);
        
        // Execute trades based on signals
        for (const signal of signals) {
            await this.executeTrade(signal, date, marketData);
        }
    }

    /**
     * Evaluate strategy conditions for a specific date
     */
    private async evaluateStrategyConditions(date: Date, strategy: any, marketData: Map<string, any[]>): Promise<any[]> {
        const signals = [];
        
        // This is a simplified version - in a full implementation,
        // you would recursively evaluate the strategy block tree
        for (const block of strategy.blocks) {
            if (block.condition) {
                const conditionMet = await this.evaluateCondition(block.condition, date, marketData);
                if (conditionMet && block.action) {
                    signals.push({
                        action: block.action,
                        reason: `Condition ${block.condition.id} met`,
                        blockId: block.id
                    });
                }
            }
        }
        
        return signals;
    }

    /**
     * Evaluate a single condition for a specific date
     */
    private async evaluateCondition(condition: any, date: Date, marketData: Map<string, any[]>): Promise<boolean> {
        const symbol = condition.symbol;
        if (!symbol || !marketData.has(symbol)) {
            return false;
        }

        const priceData = marketData.get(symbol)!;
        const dateIndex = priceData.findIndex(bar => 
            bar.timestamp.toDateString() === date.toDateString()
        );

        if (dateIndex === -1 || dateIndex < 20) { // Need enough data for indicators
            return false;
        }

        try {
            // Get the relevant price slice up to this date
            const historicalData = priceData.slice(0, dateIndex + 1);
            
            // Calculate technical indicator if needed
            let indicatorValue: number;
            
            if (condition.indicatorType === 'PRICE') {
                indicatorValue = historicalData[dateIndex].close;
            } else {
                // For technical indicators, we would calculate them here
                // This is simplified - you'd use the actual technical indicator functions
                indicatorValue = await this.calculateIndicatorValue(
                    condition.indicatorType, 
                    historicalData, 
                    condition.parameters
                );
            }

            // Compare with target value
            const targetValue = condition.targetValue;
            const operator = condition.operator;

            switch (operator) {
                case 'GREATER_THAN':
                    return indicatorValue > targetValue;
                case 'LESS_THAN':
                    return indicatorValue < targetValue;
                case 'EQUALS':
                    return Math.abs(indicatorValue - targetValue) < 0.01;
                // Add other operators as needed
                default:
                    return false;
            }

        } catch (error) {
            console.error(`[Backtest] Error evaluating condition:`, error);
            return false;
        }
    }

    /**
     * Calculate technical indicator value for historical data
     */
    private async calculateIndicatorValue(indicatorType: string, historicalData: any[], parameters: any): Promise<number> {
        // This would use your existing technical indicator functions
        // For now, return a simple moving average as example
        if (indicatorType === 'SMA') {
            const period = parameters.time_period || 20;
            const slice = historicalData.slice(-period);
            const sum = slice.reduce((acc, bar) => acc + bar.close, 0);
            return sum / slice.length;
        }
        
        // Add other indicators as needed
        return historicalData[historicalData.length - 1].close;
    }

    /**
     * Execute a trade with realistic slippage and commission
     */
    private async executeTrade(signal: any, date: Date, marketData: Map<string, any[]>) {
        const action = signal.action;
        const symbol = action.parameters.symbol;
        const quantity = action.parameters.quantity || 100;
        
        if (!marketData.has(symbol)) {
            return;
        }

        const priceData = marketData.get(symbol)!;
        const dateIndex = priceData.findIndex(bar => 
            bar.timestamp.toDateString() === date.toDateString()
        );

        if (dateIndex === -1) {
            return;
        }

        const marketPrice = priceData[dateIndex].close;
        const slippage = this.config.slippage;
        const commission = this.config.commission;

        // Apply slippage
        const slippageAmount = marketPrice * slippage;
        const executionPrice = action.actionType === 'BUY' 
            ? marketPrice + slippageAmount 
            : marketPrice - slippageAmount;

        const totalCost = (quantity * executionPrice) + commission;

        // Check if we have enough cash for buy orders
        if (action.actionType === 'BUY' && totalCost > this.cash) {
            console.warn(`[Backtest] Insufficient cash for ${symbol} purchase: ${totalCost} > ${this.cash}`);
            return;
        }

        // Create trade record
        const trade: Trade = {
            id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: date,
            symbol,
            action: action.actionType,
            quantity: action.actionType === 'SELL' ? -quantity : quantity,
            price: executionPrice,
            commission,
            slippage: slippageAmount,
            totalCost,
            reason: signal.reason
        };

        // Update positions and cash
        if (action.actionType === 'BUY') {
            this.cash -= totalCost;
            this.updatePosition(symbol, quantity, executionPrice);
        } else if (action.actionType === 'SELL') {
            this.cash += (quantity * executionPrice) - commission;
            this.updatePosition(symbol, -quantity, executionPrice);
        }

        this.trades.push(trade);
        console.log(`[Backtest] Executed ${trade.action} ${trade.quantity} ${trade.symbol} @ ${trade.price.toFixed(2)}`);
    }

    /**
     * Update position tracking
     */
    private updatePosition(symbol: string, quantity: number, price: number) {
        const existing = this.positions.get(symbol);
        
        if (!existing) {
            this.positions.set(symbol, {
                symbol,
                quantity,
                averagePrice: price,
                marketValue: quantity * price,
                unrealizedPnl: 0,
                unrealizedPnlPercent: 0
            });
        } else {
            const newQuantity = existing.quantity + quantity;
            
            if (newQuantity === 0) {
                this.positions.delete(symbol);
            } else if (newQuantity > 0 && existing.quantity > 0) {
                // Adding to existing position
                const totalCost = (existing.quantity * existing.averagePrice) + (quantity * price);
                existing.averagePrice = totalCost / newQuantity;
                existing.quantity = newQuantity;
            } else {
                // Reducing or reversing position
                existing.quantity = newQuantity;
                if (quantity * existing.quantity > 0) {
                    existing.averagePrice = price; // New position in same direction
                }
            }
        }
    }

    /**
     * Record portfolio snapshot for a date
     */
    private recordPortfolioSnapshot(date: Date, marketData: Map<string, any[]>) {
        let totalPositionValue = 0;
        const positions: Position[] = [];

        for (const [symbol, position] of this.positions) {
            const priceData = marketData.get(symbol);
            if (!priceData) continue;

            const dateIndex = priceData.findIndex(bar => 
                bar.timestamp.toDateString() === date.toDateString()
            );

            if (dateIndex === -1) continue;

            const currentPrice = priceData[dateIndex].close;
            const marketValue = position.quantity * currentPrice;
            const unrealizedPnl = marketValue - (position.quantity * position.averagePrice);
            const unrealizedPnlPercent = unrealizedPnl / (position.quantity * position.averagePrice);

            totalPositionValue += marketValue;
            
            positions.push({
                ...position,
                marketValue,
                unrealizedPnl,
                unrealizedPnlPercent
            });
        }

        const totalValue = this.cash + totalPositionValue;
        const previousSnapshot = this.portfolioHistory[this.portfolioHistory.length - 1];
        const dayChange = previousSnapshot ? totalValue - previousSnapshot.totalValue : 0;
        const dayChangePercent = previousSnapshot ? dayChange / previousSnapshot.totalValue : 0;

        this.portfolioHistory.push({
            timestamp: date,
            totalValue,
            cash: this.cash,
            positions,
            dayChange,
            dayChangePercent
        });
    }

    /**
     * Calculate comprehensive performance metrics
     */
    private async calculateMetrics(benchmarkData?: {returns: number[], prices: number[]}): Promise<BacktestMetrics> {
        const dailyReturns = this.calculateDailyReturns();
        const tradingDays = 252; // Annualization factor
        
        // Basic returns
        const totalReturn = (this.getTotalValue() - this.config.initialCapital) / this.config.initialCapital;
        const periods = dailyReturns.length;
        const annualizedReturn = Math.pow(1 + totalReturn, tradingDays / periods) - 1;
        
        // Risk metrics
        const volatility = this.calculateVolatility(dailyReturns) * Math.sqrt(tradingDays);
        const sharpeRatio = volatility > 0 ? (annualizedReturn - 0.02) / volatility : 0; // Assuming 2% risk-free rate
        const maxDrawdown = this.calculateMaxDrawdown();
        
        // Downside metrics
        const downsideReturns = dailyReturns.filter(r => r < 0);
        const downsideVolatility = downsideReturns.length > 0 ? 
            this.calculateVolatility(downsideReturns) * Math.sqrt(tradingDays) : 0;
        const sortino = downsideVolatility > 0 ? (annualizedReturn - 0.02) / downsideVolatility : 0;
        const calmar = maxDrawdown !== 0 ? annualizedReturn / Math.abs(maxDrawdown) : 0;

        // VaR calculations
        const sortedReturns = [...dailyReturns].sort((a, b) => a - b);
        const var95Index = Math.floor(sortedReturns.length * 0.05);
        const var99Index = Math.floor(sortedReturns.length * 0.01);
        const var95 = sortedReturns[var95Index] || 0;
        const var99 = sortedReturns[var99Index] || 0;

        // Beta and Alpha (if benchmark provided)
        let beta = 0;
        let alpha = 0;
        if (benchmarkData && benchmarkData.returns.length > 0) {
            beta = this.calculateBeta(dailyReturns, benchmarkData.returns);
            const benchmarkReturn = benchmarkData.returns.reduce((acc, r) => acc + r, 0) / benchmarkData.returns.length * tradingDays;
            alpha = annualizedReturn - (0.02 + beta * (benchmarkReturn - 0.02));
        }

        // Trade statistics
        const winningTrades = this.trades.filter(t => this.getTradeProfit(t) > 0).length;
        const losingTrades = this.trades.filter(t => this.getTradeProfit(t) < 0).length;
        const winRate = this.trades.length > 0 ? winningTrades / this.trades.length : 0;
        
        const wins = this.trades.filter(t => this.getTradeProfit(t) > 0).map(t => this.getTradeProfit(t));
        const losses = this.trades.filter(t => this.getTradeProfit(t) < 0).map(t => Math.abs(this.getTradeProfit(t)));
        
        const avgWin = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
        const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;
        const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;

        return {
            totalReturn,
            annualizedReturn,
            sharpeRatio,
            maxDrawdown,
            volatility,
            beta,
            alpha,
            sortino,
            calmar,
            var95,
            var99,
            winRate,
            profitFactor,
            avgWin,
            avgLoss,
            totalTrades: this.trades.length,
            winningTrades,
            losingTrades
        };
    }

    private getTotalValue(): number {
        const lastSnapshot = this.portfolioHistory[this.portfolioHistory.length - 1];
        return lastSnapshot ? lastSnapshot.totalValue : this.config.initialCapital;
    }

    private calculateDailyReturns(): number[] {
        const returns = [];
        for (let i = 1; i < this.portfolioHistory.length; i++) {
            const current = this.portfolioHistory[i].totalValue;
            const previous = this.portfolioHistory[i - 1].totalValue;
            returns.push((current - previous) / previous);
        }
        return returns;
    }

    private calculateVolatility(returns: number[]): number {
        if (returns.length === 0) return 0;
        
        const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
        return Math.sqrt(variance);
    }

    private calculateMaxDrawdown(): number {
        let maxDrawdown = 0;
        let peak = this.config.initialCapital;
        
        for (const snapshot of this.portfolioHistory) {
            if (snapshot.totalValue > peak) {
                peak = snapshot.totalValue;
            }
            const drawdown = (peak - snapshot.totalValue) / peak;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }
        
        return maxDrawdown;
    }

    private calculateDrawdownSeries(): number[] {
        const drawdowns = [];
        let peak = this.config.initialCapital;
        
        for (const snapshot of this.portfolioHistory) {
            if (snapshot.totalValue > peak) {
                peak = snapshot.totalValue;
            }
            const drawdown = (peak - snapshot.totalValue) / peak;
            drawdowns.push(drawdown);
        }
        
        return drawdowns;
    }

    private calculateBeta(portfolioReturns: number[], benchmarkReturns: number[]): number {
        if (portfolioReturns.length !== benchmarkReturns.length || portfolioReturns.length === 0) {
            return 0;
        }

        const portfolioMean = portfolioReturns.reduce((sum, r) => sum + r, 0) / portfolioReturns.length;
        const benchmarkMean = benchmarkReturns.reduce((sum, r) => sum + r, 0) / benchmarkReturns.length;

        let covariance = 0;
        let benchmarkVariance = 0;

        for (let i = 0; i < portfolioReturns.length; i++) {
            const portfolioDiff = portfolioReturns[i] - portfolioMean;
            const benchmarkDiff = benchmarkReturns[i] - benchmarkMean;
            
            covariance += portfolioDiff * benchmarkDiff;
            benchmarkVariance += benchmarkDiff * benchmarkDiff;
        }

        covariance /= portfolioReturns.length;
        benchmarkVariance /= benchmarkReturns.length;

        return benchmarkVariance !== 0 ? covariance / benchmarkVariance : 0;
    }

    private getTradeProfit(trade: Trade): number {
        // This is simplified - in reality you'd track the P&L when the position is closed
        return trade.action === 'SELL' ? trade.totalCost : -trade.totalCost;
    }

    /**
     * Store backtest results in database
     */
    private async storeBacktestResult(strategyId: string, metrics: BacktestMetrics): Promise<void> {
        try {
            await prisma.backtestResult.create({
                data: {
                    strategyId,
                    startDate: this.config.startDate,
                    endDate: this.config.endDate,
                    initialCapital: this.config.initialCapital,
                    finalValue: this.getTotalValue(),
                    totalReturn: metrics.totalReturn,
                    annualizedReturn: metrics.annualizedReturn,
                    sharpeRatio: metrics.sharpeRatio,
                    maxDrawdown: metrics.maxDrawdown,
                    winRate: metrics.winRate,
                    totalTrades: metrics.totalTrades,
                    winningTrades: metrics.winningTrades,
                    losingTrades: metrics.losingTrades,
                    avgWin: metrics.avgWin,
                    avgLoss: metrics.avgLoss,
                    parameters: JSON.stringify(this.config),
                    trades: JSON.stringify(this.trades),
                    metrics: JSON.stringify(metrics)
                }
            });

            console.log(`[Backtest] Stored backtest results for strategy ${strategyId}`);

        } catch (error) {
            console.error(`[Backtest] Error storing backtest results:`, error);
        }
    }
}

/**
 * Run backtest for a strategy
 */
export async function runStrategyBacktest(config: BacktestConfig): Promise<BacktestResult> {
    const engine = new BacktestEngine(config);
    return await engine.runBacktest(config.strategyId);
}

/**
 * Get backtest results for a strategy
 */
export async function getBacktestResults(strategyId: string): Promise<any[]> {
    return await prisma.backtestResult.findMany({
        where: { strategyId },
        orderBy: { createdAt: 'desc' }
    });
}
