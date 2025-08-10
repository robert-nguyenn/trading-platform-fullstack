import { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { getAlpacaMarketAuth, ALPACA_CRYPTO_DATA_BASE_URL } from '../../utils/authUtils';


dotenv.config();


export const getHistoricalBarsCrypto = async (req: Request, res: Response) => {
    try {
        const loc: string = req.params.loc || 'us';
        const { symbols, timeframe} = req.query;
        if (!symbols || !timeframe) {
            res.status(400).json({ error: 'Missing required query parameters: symbols and timeframe' });
            return;
        }

        const response = await axios.get(`${ALPACA_CRYPTO_DATA_BASE_URL}/${loc}/bars`, {
            headers: {
                ...getAlpacaMarketAuth(),
                'Accept': 'application/json'
            },
            params: {
                symbols,
                timeframe
            },
        });
        res.json(response.data);
    } catch (error: any) {
        res.status(500).json({ error: error.response?.data || error.message });
    }
};

export const getLatestBarsCrypto = async (req: Request, res: Response) => {
    const symbols = req.query.symbols as string | string[];
    const symbolParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
    const loc: string = req.params.loc || 'us';
    try {
        const response = await axios.get(`${ALPACA_CRYPTO_DATA_BASE_URL}/${loc}/latest/bars`, {
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

export const getLatestOrderBookCrypto = async (req: Request, res: Response) => {
    const symbols = req.query.symbols as string | string[];
    const symbolParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
    const loc: string = req.params.loc || 'us';
    try {
        const response = await axios.get(`${ALPACA_CRYPTO_DATA_BASE_URL}/${loc}/latest/orderbooks`, {
            headers: {
                // ...getAlpacaMarketAuth(),
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

export const getLatestQuotesCrypto = async (req: Request, res: Response) => {
    const symbols = req.query.symbols as string | string[];
    const symbolParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
    const loc: string = req.params.loc || 'us';
    try {
        const response = await axios.get(`${ALPACA_CRYPTO_DATA_BASE_URL}/${loc}/latest/quotes`, {
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

export const getLatestTradesCrypto = async (req: Request, res: Response) => {
    const symbols = req.query.symbols as string | string[];
    const symbolParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
    const loc: string = req.params.loc || 'us';
    try {
        const response = await axios.get(`${ALPACA_CRYPTO_DATA_BASE_URL}/${loc}/latest/trades`, {
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

export const getHistoricalQuotesCrypto = async (req: Request, res: Response) => {
    const symbols = req.query.symbols as string | string[];
    const symbolParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
    const loc: string = req.params.loc || 'us';
    try {
        const response = await axios.get(`${ALPACA_CRYPTO_DATA_BASE_URL}/${loc}/quotes`, {
            headers: {
                ...getAlpacaMarketAuth(),
                'Accept': 'application/json',
            },
            params: {
                symbols: symbolParam
            }
        });
        res.json(response.data);
    }
    catch (error: any) {
        res.status(500).json({ error: error.response?.data || error.message });
    }
}

export const getSnapshotsCrypto = async (req: Request, res: Response) => {
    const symbols = req.query.symbols as string | string[];
    const symbolParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
    const loc: string = req.params.loc || 'us';
    try {
        const response = await axios.get(`${ALPACA_CRYPTO_DATA_BASE_URL}/${loc}/snapshots`, {
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

export const getHistoricalTradesCrypto = async (req: Request, res: Response) => {
    const symbols = req.query.symbols as string | string[];
    const symbolParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
    const loc: string = req.params.loc || 'us';
    try {
        const response = await axios.get(`${ALPACA_CRYPTO_DATA_BASE_URL}/${loc}/trades`, {
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