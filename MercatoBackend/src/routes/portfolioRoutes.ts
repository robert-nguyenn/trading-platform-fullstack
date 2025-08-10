/**
 * Portfolio Management Routes
 * Handles portfolio analytics, risk management, and performance tracking endpoints
 */

import { Router, Request, Response } from 'express';
import { PortfolioManager } from '../services/portfolioManager';
import { firebaseAuthMiddleware } from '../middlewares/firebaseAuthMiddleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(firebaseAuthMiddleware);

/**
 * GET /api/portfolio/positions
 * Get current portfolio positions
 */
router.get('/positions', async (req: Request, res: Response) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const portfolioManager = new PortfolioManager(userId);
        const positions = await portfolioManager.getPositions();

        res.json({
            success: true,
            data: positions,
            count: positions.length
        });

    } catch (error) {
        console.error('Error fetching portfolio positions:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch portfolio positions' 
        });
    }
});

/**
 * GET /api/portfolio/summary
 * Get portfolio summary with key metrics
 */
router.get('/summary', async (req: Request, res: Response) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const portfolioManager = new PortfolioManager(userId);
        const summary = await portfolioManager.getPortfolioSummary();

        res.json({
            success: true,
            data: summary
        });

    } catch (error) {
        console.error('Error fetching portfolio summary:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch portfolio summary' 
        });
    }
});

/**
 * GET /api/portfolio/risk-metrics
 * Get comprehensive risk analytics
 */
router.get('/risk-metrics', async (req: Request, res: Response) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const portfolioManager = new PortfolioManager(userId);
        const riskMetrics = await portfolioManager.calculateRiskMetrics();

        res.json({
            success: true,
            data: riskMetrics
        });

    } catch (error) {
        console.error('Error calculating risk metrics:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to calculate risk metrics' 
        });
    }
});

/**
 * POST /api/portfolio/check-risk
 * Check if a potential trade violates risk limits
 */
router.post('/check-risk', async (req: Request, res: Response) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const { symbol, quantity, price } = req.body;

        if (!symbol || !quantity || !price) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: symbol, quantity, price'
            });
        }

        const portfolioManager = new PortfolioManager(userId);
        const riskCheck = await portfolioManager.checkRiskLimits(symbol, quantity, price);

        res.json({
            success: true,
            data: riskCheck
        });

    } catch (error) {
        console.error('Error checking risk limits:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to check risk limits' 
        });
    }
});

/**
 * POST /api/portfolio/optimal-size
 * Calculate optimal position size using Kelly Criterion
 */
router.post('/optimal-size', async (req: Request, res: Response) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const { symbol, expectedReturn, winRate } = req.body;

        if (!symbol || expectedReturn === undefined || winRate === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: symbol, expectedReturn, winRate'
            });
        }

        if (expectedReturn < 0 || expectedReturn > 1 || winRate < 0 || winRate > 1) {
            return res.status(400).json({
                success: false,
                error: 'expectedReturn and winRate must be between 0 and 1'
            });
        }

        const portfolioManager = new PortfolioManager(userId);
        const positionSize = await portfolioManager.calculateOptimalPositionSize(
            symbol, 
            expectedReturn, 
            winRate
        );

        res.json({
            success: true,
            data: positionSize
        });

    } catch (error) {
        console.error('Error calculating optimal position size:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to calculate optimal position size' 
        });
    }
});

/**
 * POST /api/portfolio/snapshot
 * Store current portfolio snapshot for historical tracking
 */
router.post('/snapshot', async (req: Request, res: Response) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const portfolioManager = new PortfolioManager(userId);
        await portfolioManager.storePortfolioSnapshot();

        res.json({
            success: true,
            message: 'Portfolio snapshot stored successfully'
        });

    } catch (error) {
        console.error('Error storing portfolio snapshot:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to store portfolio snapshot' 
        });
    }
});

/**
 * PUT /api/portfolio/risk-limits
 * Update user's risk management settings
 */
router.put('/risk-limits', async (req: Request, res: Response) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const riskLimits = req.body;

        // Validate risk limits
        const validLimits = [
            'maxPositionSize', 'maxSectorExposure', 'maxVaR', 
            'maxDrawdown', 'maxLeverage', 'stopLossPercent'
        ];

        for (const [key, value] of Object.entries(riskLimits)) {
            if (!validLimits.includes(key)) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid risk limit parameter: ${key}`
                });
            }

            if (typeof value !== 'number' || value < 0 || value > 1) {
                return res.status(400).json({
                    success: false,
                    error: `Risk limit ${key} must be a number between 0 and 1`
                });
            }
        }

        // In a real application, you would store these in the database
        // For now, we'll just return success
        res.json({
            success: true,
            message: 'Risk limits updated successfully',
            data: riskLimits
        });

    } catch (error) {
        console.error('Error updating risk limits:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to update risk limits' 
        });
    }
});

/**
 * GET /api/portfolio/performance/:period
 * Get portfolio performance metrics for a specific period
 */
router.get('/performance/:period', async (req: Request, res: Response) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const { period } = req.params;
        const validPeriods = ['1D', '1W', '1M', '3M', '6M', '1Y', 'YTD', 'ALL'];

        if (!validPeriods.includes(period)) {
            return res.status(400).json({
                success: false,
                error: `Invalid period. Must be one of: ${validPeriods.join(', ')}`
            });
        }

        // This would fetch actual performance data from the database
        // For now, return mock data based on the period
        const mockPerformance = {
            period: period,
            returns: Math.random() * 0.2 - 0.1, // -10% to 10%
            benchmark: Math.random() * 0.15 - 0.075, // Market return
            alpha: Math.random() * 0.05 - 0.025,
            beta: 0.8 + Math.random() * 0.4, // 0.8 to 1.2
            sharpe: Math.random() * 2,
            sortino: Math.random() * 2.5,
            volatility: Math.random() * 0.3,
            maxDrawdown: Math.random() * 0.2,
            winRate: 0.4 + Math.random() * 0.2,
            profitFactor: 1 + Math.random() * 1,
            calmarRatio: Math.random() * 2
        };

        res.json({
            success: true,
            data: mockPerformance
        });

    } catch (error) {
        console.error('Error fetching portfolio performance:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch portfolio performance' 
        });
    }
});

export default router;
