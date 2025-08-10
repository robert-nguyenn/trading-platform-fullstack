import express from 'express';
import alpaca from '../../services/alpacaClient';

const router = express.Router();

router.get('/', async (req, res) => {
    try{
        const calendar = await alpaca.getCalendar({
            start: req.query.start?.toString(),
            end: req.query.end?.toString()
        });
        res.json(calendar);
    } catch (error) {
        console.error('Error fetching Alpaca calendar:', error);
        res.status(500).json({ error: 'Failed to fetch calendar' });
    }
})

export default router;