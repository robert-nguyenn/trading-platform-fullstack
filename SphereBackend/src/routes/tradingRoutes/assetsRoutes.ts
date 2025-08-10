import express from 'express';
import alpaca from '../../services/alpacaClient';
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const assets = await alpaca.getAssets({ status: 'active', asset_class: 'us_equity' });
        res.json(assets);
    } catch (error) {
        console.error('Error fetching Alpaca assets:', error);
        res.status(500).json({ error: 'Failed to fetch assets' });
    }
})

router.get('/:symbol', async (req, res) => {
    try {
        const {symbol} = req.params;
        const asset = await alpaca.getAsset(symbol.toUpperCase());
        res.json(asset);
    } catch (error: any) {
        console.error(`Error fetching Alpaca asset for ${req.params.symbol}:`, error.response?.data || error.message);
        res.status(500).json({ error: "Asset not found"});
    }
});

export default router;