/**
 * Real-time Trading Monitoring Service
 * Monitors portfolio performance, market conditions, and trading signals
 * 
 * Features:
 * - Real-time portfolio tracking
 * - Risk monitoring and alerts
 * - Performance benchmarking
 * - Market sentiment analysis
 * - Automated reporting
 */

import { PrismaClient } from '@prisma/client';
import { getRedisClient } from '../utils/redisClient';
import { PortfolioManager } from './portfolioManager';
import alpaca from './alpacaClient';
import { EventEmitter } from 'events';

const prisma = new PrismaClient();

export interface MonitoringAlert {
    id: string;
    userId: string;
    type: 'RISK' | 'PERFORMANCE' | 'MARKET' | 'SYSTEM';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    message: string;
    data?: any;
    timestamp: Date;
    acknowledged: boolean;
}

export interface MarketCondition {
    timestamp: Date;
    vix: number; // Market volatility
    spyPrice: number;
    spyChange: number;
    spyVolume: number;
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    sentiment: number; // -1 to 1
}

export interface PortfolioSnapshot {
    userId: string;
    timestamp: Date;
    totalValue: number;
    dayChange: number;
    dayChangePercent: number;
    positions: any[];
    riskMetrics: any;
    alerts: MonitoringAlert[];
}

class TradingMonitor extends EventEmitter {
    private isRunning: boolean = false;
    private monitoringInterval: NodeJS.Timeout | null = null;
    private redis: any;

    constructor() {
        super();
        this.redis = getRedisClient();
    }

    /**
     * Start real-time monitoring
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            console.log('[TradingMonitor] Already running');
            return;
        }

        console.log('[TradingMonitor] Starting real-time monitoring...');
        this.isRunning = true;

        // Monitor portfolios every 30 seconds
        this.monitoringInterval = setInterval(async () => {
            await this.monitorAllPortfolios();
        }, 30000);

        // Monitor market conditions every 60 seconds
        setInterval(async () => {
            await this.updateMarketConditions();
        }, 60000);

        // Generate daily reports at market close (4 PM ET)
        setInterval(async () => {
            const now = new Date();
            if (now.getHours() === 16 && now.getMinutes() === 0) {
                await this.generateDailyReports();
            }
        }, 60000);

        console.log('[TradingMonitor] Monitoring started successfully');
        this.emit('started');
    }

    /**
     * Stop monitoring
     */
    async stop(): Promise<void> {
        if (!this.isRunning) {
            return;
        }

        console.log('[TradingMonitor] Stopping monitoring...');
        this.isRunning = false;

        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }

        console.log('[TradingMonitor] Monitoring stopped');
        this.emit('stopped');
    }

    /**
     * Monitor all active user portfolios
     */
    private async monitorAllPortfolios(): Promise<void> {
        try {
            // Get all users with active strategies
            const users = await prisma.user.findMany({
                where: {
                    strategies: {
                        some: {
                            isActive: true
                        }
                    }
                },
                select: {
                    id: true,
                    email: true
                }
            });

            console.log(`[TradingMonitor] Monitoring ${users.length} active portfolios`);

            const monitoringPromises = users.map(user => 
                this.monitorUserPortfolio(user.id).catch(error => {
                    console.error(`[TradingMonitor] Error monitoring user ${user.id}:`, error);
                })
            );

            await Promise.all(monitoringPromises);

        } catch (error) {
            console.error('[TradingMonitor] Error monitoring portfolios:', error);
        }
    }

    /**
     * Monitor individual user portfolio
     */
    private async monitorUserPortfolio(userId: string): Promise<void> {
        try {
            const portfolioManager = new PortfolioManager(userId);
            const summary = await portfolioManager.getPortfolioSummary();
            const riskMetrics = await portfolioManager.calculateRiskMetrics();
            const positions = await portfolioManager.getPositions();

            // Create portfolio snapshot
            const snapshot: PortfolioSnapshot = {
                userId: userId,
                timestamp: new Date(),
                totalValue: summary.totalValue,
                dayChange: summary.dayChange,
                dayChangePercent: summary.dayChangePercent,
                positions: positions,
                riskMetrics: riskMetrics,
                alerts: []
            };

            // Check for risk alerts
            const alerts = await this.checkRiskAlerts(userId, summary, riskMetrics);
            snapshot.alerts = alerts;

            // Store snapshot in Redis for real-time access
            await this.redis.setex(
                `portfolio:${userId}:snapshot`,
                300, // 5 minutes TTL
                JSON.stringify(snapshot)
            );

            // Store in database for historical tracking
            await portfolioManager.storePortfolioSnapshot();

            // Emit events for real-time updates
            this.emit('portfolioUpdate', snapshot);

            // Send alerts if any
            if (alerts.length > 0) {
                this.emit('alerts', { userId, alerts });
            }

        } catch (error) {
            console.error(`[TradingMonitor] Error monitoring portfolio for user ${userId}:`, error);
        }
    }

    /**
     * Check for risk-based alerts
     */
    private async checkRiskAlerts(
        userId: string,
        summary: any,
        riskMetrics: any
    ): Promise<MonitoringAlert[]> {
        const alerts: MonitoringAlert[] = [];

        // Check VaR limits
        if (riskMetrics.var95 / summary.totalValue > 0.1) { // 10% VaR threshold
            alerts.push({
                id: `var_alert_${Date.now()}`,
                userId: userId,
                type: 'RISK',
                severity: 'HIGH',
                title: 'High Portfolio Risk',
                message: `Portfolio VaR (${(riskMetrics.var95 / summary.totalValue * 100).toFixed(1)}%) exceeds 10% threshold`,
                data: { var95: riskMetrics.var95, portfolioValue: summary.totalValue },
                timestamp: new Date(),
                acknowledged: false
            });
        }

        // Check drawdown
        if (riskMetrics.maxDrawdown > 0.15) { // 15% drawdown threshold
            alerts.push({
                id: `drawdown_alert_${Date.now()}`,
                userId: userId,
                type: 'PERFORMANCE',
                severity: 'MEDIUM',
                title: 'High Drawdown',
                message: `Portfolio experiencing ${(riskMetrics.maxDrawdown * 100).toFixed(1)}% drawdown`,
                data: { maxDrawdown: riskMetrics.maxDrawdown },
                timestamp: new Date(),
                acknowledged: false
            });
        }

        // Check concentration risk
        if (riskMetrics.concentrationRisk > 0.2) { // 20% concentration threshold
            alerts.push({
                id: `concentration_alert_${Date.now()}`,
                userId: userId,
                type: 'RISK',
                severity: 'MEDIUM',
                title: 'High Concentration Risk',
                message: `Largest position represents ${(riskMetrics.concentrationRisk * 100).toFixed(1)}% of portfolio`,
                data: { concentrationRisk: riskMetrics.concentrationRisk },
                timestamp: new Date(),
                acknowledged: false
            });
        }

        // Check large daily losses
        if (summary.dayChangePercent < -0.05) { // 5% daily loss threshold
            alerts.push({
                id: `daily_loss_alert_${Date.now()}`,
                userId: userId,
                type: 'PERFORMANCE',
                severity: summary.dayChangePercent < -0.1 ? 'HIGH' : 'MEDIUM',
                title: 'Large Daily Loss',
                message: `Portfolio down ${Math.abs(summary.dayChangePercent * 100).toFixed(1)}% today`,
                data: { dayChange: summary.dayChange, dayChangePercent: summary.dayChangePercent },
                timestamp: new Date(),
                acknowledged: false
            });
        }

        return alerts;
    }

    /**
     * Update market conditions
     */
    private async updateMarketConditions(): Promise<void> {
        try {
            // Get market data
            const [spySnapshot, vixSnapshot] = await Promise.all([
                alpaca.getSnapshot('SPY').catch(() => null),
                alpaca.getSnapshot('VIX').catch(() => null)
            ]);

            if (!spySnapshot) {
                console.warn('[TradingMonitor] Unable to fetch market data');
                return;
            }

            const spyPrice = spySnapshot.LatestTrade?.Price || 0;
            const spyChange = spySnapshot.DailyBar ? 
                ((spyPrice - (spySnapshot.DailyBar as any).o) / (spySnapshot.DailyBar as any).o) : 0;
            const vix = vixSnapshot?.LatestTrade?.Price || 20; // Default VIX

            // Determine market trend and sentiment
            let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
            let sentiment = 0;

            if (spyChange > 0.01) {
                trend = 'BULLISH';
                sentiment = Math.min(spyChange * 10, 1);
            } else if (spyChange < -0.01) {
                trend = 'BEARISH';
                sentiment = Math.max(spyChange * 10, -1);
            }

            const marketCondition: MarketCondition = {
                timestamp: new Date(),
                vix: vix,
                spyPrice: spyPrice,
                spyChange: spyChange,
                spyVolume: spySnapshot.DailyBar?.Volume || 0,
                trend: trend,
                sentiment: sentiment
            };

            // Store in Redis
            await this.redis.setex(
                'market:conditions',
                300, // 5 minutes TTL
                JSON.stringify(marketCondition)
            );

            // Emit market update
            this.emit('marketUpdate', marketCondition);

            // Check for market alerts
            await this.checkMarketAlerts(marketCondition);

        } catch (error) {
            console.error('[TradingMonitor] Error updating market conditions:', error);
        }
    }

    /**
     * Check for market-based alerts
     */
    private async checkMarketAlerts(marketCondition: MarketCondition): Promise<void> {
        // High volatility alert
        if (marketCondition.vix > 30) {
            this.emit('marketAlert', {
                type: 'MARKET',
                severity: 'HIGH',
                title: 'High Market Volatility',
                message: `VIX at ${marketCondition.vix.toFixed(1)}, indicating high market stress`,
                data: marketCondition
            });
        }

        // Large market moves
        if (Math.abs(marketCondition.spyChange) > 0.02) {
            this.emit('marketAlert', {
                type: 'MARKET',
                severity: 'MEDIUM',
                title: 'Large Market Movement',
                message: `S&P 500 ${marketCondition.spyChange > 0 ? 'up' : 'down'} ${Math.abs(marketCondition.spyChange * 100).toFixed(1)}% today`,
                data: marketCondition
            });
        }
    }

    /**
     * Generate daily performance reports
     */
    private async generateDailyReports(): Promise<void> {
        try {
            console.log('[TradingMonitor] Generating daily reports...');

            const users = await prisma.user.findMany({
                where: {
                    strategies: {
                        some: {
                            isActive: true
                        }
                    }
                }
            });

            for (const user of users) {
                await this.generateUserDailyReport(user.id);
            }

            console.log(`[TradingMonitor] Generated daily reports for ${users.length} users`);

        } catch (error) {
            console.error('[TradingMonitor] Error generating daily reports:', error);
        }
    }

    /**
     * Generate daily report for a specific user
     */
    private async generateUserDailyReport(userId: string): Promise<void> {
        try {
            const portfolioManager = new PortfolioManager(userId);
            const summary = await portfolioManager.getPortfolioSummary();
            const riskMetrics = await portfolioManager.calculateRiskMetrics();

            // Get previous day's data for comparison
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const previousMetrics = await prisma.portfolioHistory.findFirst({
                where: {
                    userId: userId,
                    timestamp: {
                        gte: yesterday,
                        lt: new Date()
                    }
                },
                orderBy: {
                    timestamp: 'desc'
                }
            });

            const report = {
                userId: userId,
                date: new Date().toISOString().split('T')[0],
                summary: summary,
                riskMetrics: riskMetrics,
                previousValue: previousMetrics?.totalValue || summary.totalValue,
                performance: {
                    dailyReturn: summary.dayChangePercent,
                    dailyPnL: summary.dayChange,
                    weeklyReturn: 0, // Would calculate from historical data
                    monthlyReturn: 0, // Would calculate from historical data
                    yearToDateReturn: 0 // Would calculate from historical data
                }
            };

            // Store report in Redis
            await this.redis.setex(
                `report:daily:${userId}:${report.date}`,
                86400 * 7, // 7 days TTL
                JSON.stringify(report)
            );

            this.emit('dailyReport', report);

        } catch (error) {
            console.error(`[TradingMonitor] Error generating daily report for user ${userId}:`, error);
        }
    }

    /**
     * Get real-time portfolio snapshot for a user
     */
    async getPortfolioSnapshot(userId: string): Promise<PortfolioSnapshot | null> {
        try {
            const snapshotData = await this.redis.get(`portfolio:${userId}:snapshot`);
            return snapshotData ? JSON.parse(snapshotData) : null;
        } catch (error) {
            console.error('[TradingMonitor] Error getting portfolio snapshot:', error);
            return null;
        }
    }

    /**
     * Get current market conditions
     */
    async getMarketConditions(): Promise<MarketCondition | null> {
        try {
            const conditionsData = await this.redis.get('market:conditions');
            return conditionsData ? JSON.parse(conditionsData) : null;
        } catch (error) {
            console.error('[TradingMonitor] Error getting market conditions:', error);
            return null;
        }
    }

    /**
     * Get system health metrics
     */
    async getSystemHealth(): Promise<any> {
        try {
            const redis = await this.redis.ping();
            
            return {
                status: 'healthy',
                uptime: process.uptime(),
                monitoring: this.isRunning,
                redis: redis === 'PONG' ? 'connected' : 'disconnected',
                timestamp: new Date()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date()
            };
        }
    }
}

// Singleton instance
let tradingMonitor: TradingMonitor | null = null;

export function getTradingMonitor(): TradingMonitor {
    if (!tradingMonitor) {
        tradingMonitor = new TradingMonitor();
    }
    return tradingMonitor;
}

export { TradingMonitor };
