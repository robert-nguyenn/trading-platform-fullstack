import { Request, Response } from "express";
import alpaca from '../../services/alpacaClient';

export const getPositions = async (req: Request, res: Response) => {
    try {
        const positions = await alpaca.getPositions();
        res.json(positions);
    } catch (error) {
        console.error('Error fetching Alpaca positions:', error);
        res.status(500).json({ error: 'Failed to fetch positions' });
    }
}