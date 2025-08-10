import { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { getBrokerAlpacaAuth, ALPACA_BASE_URL } from '../../utils/authUtils';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

dotenv.config();

export const listOpenPositions = async (req: Request, res: Response) => {
    try {
        // Get user ID from authenticated user object (populated by middleware)
        const firebaseUser = req.user; // Assuming middleware adds 'user' to Request
        const userId = firebaseUser?.uid;

        if (!userId) {
            res.status(400).json({ error: 'User ID is required.' });
            return;
        }

        // Fetch the user from the database to get the tradingID
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.tradingId) {
            res.status(404).json({ error: 'User or trading ID not found.' });
            return;
        }

        const tradingID = user.tradingId;

        // Call Alpaca's /v1/trading/accounts/{tradingID}/positions endpoint
        const response = await axios.get(
            `${ALPACA_BASE_URL}/trading/accounts/${tradingID}/positions`,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};

// Close All Positions for an Account
export const closeAllPositions = async (req: Request, res: Response) => {
    const { account_id } = req.params;

    try {
        const response = await axios.delete(
            `${ALPACA_BASE_URL}/trading/accounts/${account_id}/positions`,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};

// Get an Open Position for account by Symbol or AssetId
export const getOpenPositionBySymbolOrAssetId = async (req: Request, res: Response) => {
    const { account_id, symbol_or_asset_id } = req.params;

    try {
        const response = await axios.get(
            `${ALPACA_BASE_URL}/trading/accounts/${account_id}/positions/${symbol_or_asset_id}`,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};

// Close a Position for an Account
export const closePosition = async (req: Request, res: Response) => {
    const { account_id, symbol_or_asset_id } = req.params;

    try {
        const response = await axios.delete(
            `${ALPACA_BASE_URL}/trading/accounts/${account_id}/positions/${symbol_or_asset_id}`,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};

// Retrieve an Order by its ID
export const getOrderById = async (req: Request, res: Response) => {
    const { account_id, order_id } = req.params;

    try {
        const response = await axios.get(
            `${ALPACA_BASE_URL}/trading/accounts/${account_id}/orders/${order_id}`,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};

// Replace an Order
export const replaceOrder = async (req: Request, res: Response) => {
    const { account_id, order_id } = req.params;
    const orderData = req.body;

    try {
        const response = await axios.patch(
            `${ALPACA_BASE_URL}/trading/accounts/${account_id}/orders/${order_id}`,
            orderData,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};

// Cancel an Open Order
export const cancelOrder = async (req: Request, res: Response) => {
    const { account_id, order_id } = req.params;

    try {
        const response = await axios.delete(
            `${ALPACA_BASE_URL}/trading/accounts/${account_id}/orders/${order_id}`,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};

// Retrieve a List of Orders
export const getOrders = async (req: Request, res: Response) => {
    const { account_id } = req.params;

    try {
        const response = await axios.get(
            `${ALPACA_BASE_URL}/trading/accounts/${account_id}/orders`,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};

// Create an Order for an Account
export const createOrder = async (req: Request, res: Response) => {
    const { account_id } = req.params;
    const orderData = req.body;

    try {
        const response = await axios.post(
            `${ALPACA_BASE_URL}/trading/accounts/${account_id}/orders`,
            orderData,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};

// Cancel all Open Orders For an Account
export const cancelAllOrders = async (req: Request, res: Response) => {
    const { account_id } = req.params;

    try {
        const response = await axios.delete(
            `${ALPACA_BASE_URL}/trading/accounts/${account_id}/orders`,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};

// Estimate an Order
export const estimateOrder = async (req: Request, res: Response) => {
    const { account_id } = req.params;
    const orderData = req.body;

    try {
        const response = await axios.post(
            `${ALPACA_BASE_URL}/trading/accounts/${account_id}/orders/estimation`,
            orderData,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};

// Get Account Portfolio History
export const getAccountPortfolioHistory = async (req: Request, res: Response) => {
    const { account_id } = req.params;
    const { intraday_reporting, pnl_reset } = req.query;

    try {
        const response = await axios.get(
            `${ALPACA_BASE_URL}/trading/accounts/${account_id}/account/portfolio/history`,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json'
                },
                params: {
                    intraday_reporting,
                    pnl_reset
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};

// Get Portfolio History for Authenticated User
export const getUserPortfolioHistory = async (req: Request, res: Response) => {
    try {
        // Get user ID from authenticated user object (populated by middleware)
        const firebaseUser = req.user;
        const userId = firebaseUser?.uid;

        if (!userId) {
            res.status(400).json({ error: 'User ID is required.' });
            return;
        }

        // Fetch the user from the database to get the tradingID
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.tradingId) {
            res.status(404).json({ error: 'User or trading ID not found.' });
            return;
        }

        const tradingID = user.tradingId;
        const { timeframe, period, intraday_reporting, pnl_reset } = req.query;

        // Call Alpaca's portfolio history endpoint
        const response = await axios.get(
            `${ALPACA_BASE_URL}/trading/accounts/${tradingID}/account/portfolio/history`,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json'
                },
                params: {
                    timeframe,
                    period,
                    intraday_reporting,
                    pnl_reset
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};

// Update Trading Configurations for an Account
export const updateTradingConfigurations = async (req: Request, res: Response) => {
    const { account_id } = req.params;
    const configData = req.body;

    try {
        const response = await axios.patch(
            `${ALPACA_BASE_URL}/trading/accounts/${account_id}/account/configurations`,
            configData,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};

// Retrieve real-time Trading Limits for an Account
export const getTradingLimits = async (req: Request, res: Response) => {
    const { account_id } = req.params;

    try {
        const response = await axios.get(
            `${ALPACA_BASE_URL}/trading/accounts/${account_id}/limits`,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};