import { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { getAlpacaMarketAuth, ALPACA_HISTORICAL_DATA_BASE_URL  } from '../../utils/authUtils';

dotenv.config();

export const getStockAuctionData = async (req: Request, res: Response) => {
    const symbols = req.query.symbols as string | string[];
    const symbolParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
    try {
        const response = await axios.get(`${ALPACA_HISTORICAL_DATA_BASE_URL}/stocks/auctions`, {
            headers: {
                ...getAlpacaMarketAuth(),
                'Accept': 'application/json',
            },
            params: {
                symbols: symbolParam
            }
        });
        res.json(response.data);
    } catch (error: any) {
        res.status(500).json({ error: error.response?.data || error.message });
    }
}

export const getStockBars = async (req: Request, res: Response) => {
    const symbols = req.query.symbols as string | string[];
    const symbolParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
    const timeframParam = req.query.timeframe as string;
    try {
        const response = await axios.get(`${ALPACA_HISTORICAL_DATA_BASE_URL}/stocks/bars`, {
            headers: {
                ...getAlpacaMarketAuth(),
                'Accept': 'application/json',
            },
            params: {
                symbols: symbolParam,
                timeframe : timeframParam
            }
        });
        res.json(response.data);
    } catch (error: any) {
        res.status(500).json({ error: error.response?.data || error.message });
    }
}

export const getLatestBars = async (req: Request, res: Response) => {
    const symbols = req.query.symbols as string | string[];
    const symbolParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
    try {
        const response = await axios.get(`${ALPACA_HISTORICAL_DATA_BASE_URL}/stocks/bars/latest`, {
            headers: {
                ...getAlpacaMarketAuth(),
                'Accept': 'application/json',
            },
            params: {
                symbols: symbolParam
            }
        });
        res.json(response.data);
    } catch (error: any) {
        res.status(500).json({ error: error.response?.data || error.message });
    }
}


export const getConditionCodes = async (req: Request, res: Response) => {
    const {ticktype} = req.params;
    const {tape} = req.query;
    try {
        const response = await axios.get(
            `${ALPACA_HISTORICAL_DATA_BASE_URL}/stocks/meta/conditions/${ticktype}`,
            {
                headers: {
                    ...getAlpacaMarketAuth(),
                    'Accept': 'application/json',
                },
                params: tape? {tape:tape as string}: {},
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(500).json({ error: error.response?.data || error.message });
    }
};

export const getExchangeCodes = async (req: Request, res: Response) => {
    try {
        const response = await axios.get(`${ALPACA_HISTORICAL_DATA_BASE_URL}/stocks/meta/exchanges`, {
            headers: {
                ...getAlpacaMarketAuth(),
                'Accept': 'application/json',
            }
        });
        
        res.json(response.data);
    } catch (error: any) {
        res.status(500).json({ error: error.response?.data || error.message });
    }
}

export const getHistoricalQuotes = async (req: Request, res: Response) => {
    const symbols = req.query.symbols as string | string[];
    const symbolParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
    try {
        const response = await axios.get(`${ALPACA_HISTORICAL_DATA_BASE_URL}/stocks/quotes`, {
            headers: {
                ...getAlpacaMarketAuth(),
                'Accept': 'application/json',
            },
            params: {
                symbols: symbolParam
            }
        });
        res.json(response.data);
    } catch (error: any) {
        res.status(500).json({ error: error.response?.data || error.message });
    }
}

export const getLatestQuotes = async (req: Request, res: Response) => {
    const symbols = req.query.symbols as string | string[];
    const symbolParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
    try {
        const response = await axios.get(`${ALPACA_HISTORICAL_DATA_BASE_URL}/stocks/quotes/latest`, {
            headers: {
                ...getAlpacaMarketAuth(),
                'Accept': 'application/json',
            },
            params: {
                symbols: symbolParam
            }
        });
        res.json(response.data);
    } catch (error: any) {
        res.status(500).json({ error: error.response?.data || error.message });
    }
}

export const getSnapshots = async (req: Request, res: Response) => {
    const symbols = req.query.symbols as string | string[];
    const symbolParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
    try {
        const response = await axios.get(`${ALPACA_HISTORICAL_DATA_BASE_URL}/stocks/snapshots`, {
            headers: {
                ...getAlpacaMarketAuth(),
                'Accept': 'application/json',
            },
            params: {
                symbols: symbolParam
            }
        });
        res.json(response.data);
    } catch (error: any) {
        res.status(500).json({ error: error.response?.data || error.message });
    }
}

export const getHistoricalTrades = async (req: Request, res: Response) => {
    const symbols = req.query.symbols as string | string[];
    const symbolParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
    try {
        const response = await axios.get(`${ALPACA_HISTORICAL_DATA_BASE_URL}/stocks/trades`, {
            headers: {
                ...getAlpacaMarketAuth(),
                'Accept': 'application/json',
            },
            params: {
                symbols: symbolParam
            }
        });
        res.json(response.data);
    } catch (error: any) {
        res.status(500).json({ error: error.response?.data || error.message });
    }
}

export const getLatestTrades = async (req: Request, res: Response) => {
    const symbols = req.query.symbols as string | string[];
    const symbolParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
    try {
        const response = await axios.get(`${ALPACA_HISTORICAL_DATA_BASE_URL}/stocks/trades/latest`, {
            headers: {
                ...getAlpacaMarketAuth(),
                'Accept': 'application/json',
            },
            params: {
                symbols: symbolParam
            }
        });
        res.json(response.data);
    } catch (error: any) {
        res.status(500).json({ error: error.response?.data || error.message });
    }
}