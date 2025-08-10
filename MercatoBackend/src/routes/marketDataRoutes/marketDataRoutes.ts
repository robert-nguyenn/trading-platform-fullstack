import { Router } from 'express';
import { getExchangeCodes, getStockAuctionData, getStockBars, getLatestBars, getConditionCodes, getHistoricalQuotes, getLatestQuotes, getSnapshots, getHistoricalTrades, getLatestTrades } from '../../controllers/marketDataAPI/stockController';
import { getHistoricalBarsCrypto, getLatestBarsCrypto, getLatestOrderBookCrypto, getLatestQuotesCrypto, getLatestTradesCrypto, getHistoricalQuotesCrypto, getHistoricalTradesCrypto, getSnapshotsCrypto } from '../../controllers/marketDataAPI/cryptoController';
import { getMostActiveStocks, getNews, getTopMarketMovers } from '../../controllers/marketDataAPI/miscController';

const router = Router();

router.get('/stocks/:symbols/auctions', getStockAuctionData);
router.get('/stocks/bars', getStockBars);
router.get('/stocks/bars/latest', getLatestBars);
router.get('/stocks/meta/conditions/:ticktype', getConditionCodes);
router.get('/stocks/quotes', getHistoricalQuotes);
router.get('/stocks/meta/exchanges', getExchangeCodes);
router.get('/stocks/quotes/latest', getLatestQuotes);
router.get('/stocks/snapshots', getSnapshots);
router.get('/stocks/trades', getHistoricalTrades);
router.get('/stocks/trades/latest', getLatestTrades);

router.get('/crypto/:loc/bars', getHistoricalBarsCrypto)
router.get('/crypto/:loc/latest/bars', getLatestBarsCrypto)
router.get('/crypto/:loc/latest/orderbooks', getLatestOrderBookCrypto)
router.get('/crypto/:loc/latest/quotes', getLatestQuotesCrypto)
router.get('/crypto/:loc/latest/trades', getLatestTradesCrypto)
router.get('/crypto/:loc/quotes', getHistoricalQuotesCrypto)
router.get('/crypto/:loc/snapshots', getSnapshotsCrypto)
router.get('/crypto/:loc/trades', getHistoricalTradesCrypto)

router.get('/screener/stocks/most_actives', getMostActiveStocks);
router.get('/screener/:market/movers', getTopMarketMovers);
router.get('/news', getNews);

export default router;