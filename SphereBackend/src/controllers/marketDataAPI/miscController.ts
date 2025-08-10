import { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { getAlpacaMarketAuth } from '../../utils/authUtils';

dotenv.config();

// misc controller has: screener, news, corporate action endpoints. 

const ALPACA_SCREENER_BASE_URL = 'https://data.alpaca.markets/v1beta1/screener';
const ALPACA_NEWS_BASE_URL = 'https://data.alpaca.markets/v1beta1/news';
const ALPACA_CORPORATE_ACTIONS_BASE_URL = 'https://data.alpaca.markets/v1/corporate-actions';

export const getMostActiveStocks = async (req: Request, res: Response) => {
    const market: string = req.params.market || 'stocks';
    try {
        const response = await axios.get(`${ALPACA_SCREENER_BASE_URL}/${market}/most-actives`, {
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

export const getTopMarketMovers = async (req: Request, res: Response) => {
    const market: string = req.params.market || 'stocks';
    try {
        const response = await axios.get(`${ALPACA_SCREENER_BASE_URL}/${market}/movers`, {
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

export const getNews = async (req: Request, res: Response) => {
    try {
        const response = await axios.get(`${ALPACA_NEWS_BASE_URL}`, {
            headers: {
                ...getAlpacaMarketAuth(),
                'Accept': 'application/json',
            },
        });
        res.json(response.data);
    } catch (error: any) {
        res.status(500).json({ error: error.response?.data || error.message });
    }
}

// don't understand what this is for and how to use it. 
// export const getCorporateActions = async (req: Request, res: Response) => {
//     try {
//         const response = await axios.get(`${ALPACA_CORPORATE_ACTIONS_BASE_URL}`, {
//             headers: {
//                 ...getAlpacaMarketAuth(),
//                 'Accept': 'application/json',
//             },
//         });
//         res.json(response.data);
//     } catch (error: any) {
//         res.status(500).json({ error: error.response?.data || error.message });
//     }
// }