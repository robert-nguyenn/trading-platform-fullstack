import { Request, Response } from 'express';
import alpaca from '../../services/alpacaClient';

export const getPortfolioHistory = async (req: Request, res: Response) => {
    try {
        const options = {
            period: req.query.period?.toString() || "1M",
            timeframe: req.query.timeframe?.toString() || "1D",
            intraday_reporting: req.query.intraday_reporting?.toString(),
            start: req.query.start?.toString(),
            end: req.query.end?.toString(),
            pnl_reset: req.query.pnl_reset?.toString(),
            cashflow_types: req.query.cashflow_types?.toString(),
            date_start: req.query.start?.toString(), 
            date_end: req.query.end?.toString(), 
            extended_hours: req.query.extended_hours === 'true'
        };

        const portfolioHistory = await alpaca.getPortfolioHistory(options);
        res.json(portfolioHistory);
    } catch (error: any) {
        console.error('Error fetching Alpaca portfolio history:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: error.response?.data || 'Failed to fetch portfolio history' });
    }
}