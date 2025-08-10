import express from 'express';
import { getPositions } from '../../controllers/tradingAPI/positionsController';
const router = express.Router();

router.get('/', getPositions);

export default router;