// import { Router } from 'express';
// import { getPolymarketEvents, getPolymarketMarkets, getPolymarketEventById, getPolymarketMarketById, getPolymarketCategories } from '../../controllers/polymarketAPI/gammaMarket';

// const router = Router();

// router.get('/events', getPolymarketEvents);
// router.get('/markets', getPolymarketMarkets); 


// router.get('/markets/:id', getPolymarketMarketById);
// router.get('/events/:id', getPolymarketEventById);

// router.get('/markets/categories', getPolymarketCategories)

// export default router;

// sphereBackend/src/routes/polymarketRoutes/polymarketRoutes.ts
import { Router } from 'express'
import {
  getPolymarketEventsFromDB,
  triggerManualPolymarketFetch,
  deleteAllPolymarketEvents
} from '../../controllers/polymarketAPI/polymarketController'

const router = Router()

// Fetch from DB
router.get('/stored-events', getPolymarketEventsFromDB)

// Trigger a one-off pull + store
router.post('/fetch', triggerManualPolymarketFetch)

router.delete('/delete-all', deleteAllPolymarketEvents)

export default router