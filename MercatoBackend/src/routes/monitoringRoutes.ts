/**
 * Trading Monitoring Routes
 * Real-time monitoring endpoints for portfolios and market conditions
 */

import { Router, Request, Response } from 'express';
import { getTradingMonitor } from '../services/tradingMonitor';
import { firebaseAuthMiddleware } from '../middlewares/firebaseAuthMiddleware';

const router = Router();

// Apply authentication middleware to protected routes
const tradingMonitor = getTradingMonitor();

/**
 * GET /api/monitoring/health
 * Get system health and monitoring status
 */
router.get('/health', async (req: Request, res: Response) => {
    try {
        const health = await tradingMonitor.getSystemHealth();
        res.json({
            success: true,
            data: health
        });
    } catch (error) {
        console.error('Error getting system health:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get system health'
        });
    }
});

/**
 * GET /api/monitoring/market
 * Get current market conditions
 */
router.get('/market', async (req: Request, res: Response) => {
    try {
        const marketConditions = await tradingMonitor.getMarketConditions();
        
        if (!marketConditions) {
            return res.status(404).json({
                success: false,
                error: 'Market conditions not available'
            });
        }

        res.json({
            success: true,
            data: marketConditions
        });
    } catch (error) {
        console.error('Error getting market conditions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get market conditions'
        });
    }
});

/**
 * GET /api/monitoring/portfolio
 * Get real-time portfolio snapshot for authenticated user
 */
router.get('/portfolio', firebaseAuthMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const snapshot = await tradingMonitor.getPortfolioSnapshot(userId);
        
        if (!snapshot) {
            return res.status(404).json({
                success: false,
                error: 'Portfolio snapshot not available'
            });
        }

        res.json({
            success: true,
            data: snapshot
        });
    } catch (error) {
        console.error('Error getting portfolio snapshot:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get portfolio snapshot'
        });
    }
});

/**
 * POST /api/monitoring/start
 * Start the monitoring service (admin only)
 */
router.post('/start', async (req: Request, res: Response) => {
    try {
        await tradingMonitor.start();
        res.json({
            success: true,
            message: 'Monitoring service started'
        });
    } catch (error) {
        console.error('Error starting monitoring service:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start monitoring service'
        });
    }
});

/**
 * POST /api/monitoring/stop
 * Stop the monitoring service (admin only)
 */
router.post('/stop', async (req: Request, res: Response) => {
    try {
        await tradingMonitor.stop();
        res.json({
            success: true,
            message: 'Monitoring service stopped'
        });
    } catch (error) {
        console.error('Error stopping monitoring service:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to stop monitoring service'
        });
    }
});

/**
 * WebSocket endpoint for real-time updates
 * This would be implemented with Socket.IO or WebSockets
 */
router.get('/stream', (req: Request, res: Response) => {
    res.json({
        success: false,
        message: 'WebSocket streaming not implemented yet. Use Server-Sent Events or implement Socket.IO'
    });
});

export default router;
