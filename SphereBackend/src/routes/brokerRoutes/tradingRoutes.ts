import { Router } from 'express';
import {
    listOpenPositions,
    closeAllPositions,
    getOpenPositionBySymbolOrAssetId,
    closePosition,
    getOrderById,
    replaceOrder,
    cancelOrder,
    getOrders,
    createOrder,
    cancelAllOrders,
    estimateOrder,
    getAccountPortfolioHistory,
    getUserPortfolioHistory,
    updateTradingConfigurations,
    getTradingLimits
} from '../../controllers/brokerAPI/trading';
import { firebaseAuthMiddleware } from '../../middlewares/firebaseAuthMiddleware';

const router = Router();

router.get('/user/positions',firebaseAuthMiddleware, listOpenPositions);
router.get('/user/portfolio/history', firebaseAuthMiddleware, getUserPortfolioHistory);
router.delete('/accounts/:account_id/positions', closeAllPositions);
router.get('/accounts/:account_id/positions/:symbol_or_asset_id', getOpenPositionBySymbolOrAssetId);
router.delete('/accounts/:account_id/positions/:symbol_or_asset_id', closePosition);
router.get('/accounts/:account_id/orders/:order_id', getOrderById);
router.patch('/accounts/:account_id/orders/:order_id', replaceOrder);
router.delete('/accounts/:account_id/orders/:order_id', cancelOrder);
router.get('/accounts/:account_id/orders', getOrders);
router.post('/accounts/:account_id/orders', createOrder);
router.delete('/accounts/:account_id/orders', cancelAllOrders);
router.post('/accounts/:account_id/orders/estimation', estimateOrder);
router.get('/accounts/:account_id/account/portfolio/history', getAccountPortfolioHistory);
router.patch('/accounts/:account_id/account/configurations', updateTradingConfigurations);
router.get('/accounts/:account_id/limits', getTradingLimits);

export default router;