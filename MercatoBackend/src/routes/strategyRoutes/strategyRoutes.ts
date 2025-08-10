import { Router } from 'express';
import * as strategyController from '../../controllers/strategyAPI/strategyController'; 
import * as strategyBlockController from '../../controllers/strategyAPI/strategyBlockController';
import { firebaseAuthMiddleware } from '../../middlewares/firebaseAuthMiddleware';

const router = Router();

// Apply firebaseAuthMiddleware to all routes in this router
router.use(firebaseAuthMiddleware);

// --- Strategy Routes ---
router.post('/', strategyController.createStrategy);
router.get('/', strategyController.getStrategies); // Requires ?userId=...
router.get('/allocation-summary', strategyController.getUserAllocationSummary); // New allocation summary endpoint
router.get('/:strategyId', strategyController.getStrategyById);
router.patch('/:strategyId', strategyController.updateStrategy);
router.delete('/:strategyId', strategyController.deleteStrategy);

// --- Strategy Block Routes ---
// Note: These are nested under a specific strategy
router.post('/:strategyId/blocks', strategyBlockController.createStrategyBlock);
router.patch('/:strategyId/blocks/:blockId', strategyBlockController.updateStrategyBlock);
router.delete('/:strategyId/blocks/:blockId', strategyBlockController.deleteStrategyBlock);

export default router;