import express from 'express';
import alpaca from '../../services/alpacaClient';

const router = express.Router();

router.get('/', async (req, res) => {
    try{
        const clock = await alpaca.getClock();
        res.json(clock);
    } catch (error) {
        console.error('Error fetching Alpaca clock:', error);
        res.status(500).json({ error: 'Failed to fetch clock' });
    }
})

export default router;