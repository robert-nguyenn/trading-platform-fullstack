import express from 'express';
import { getPortfolioHistory } from '../../controllers/tradingAPI/portfolioHistoryController';
const router = express.Router();

router.get('/history', getPortfolioHistory);

export default router;