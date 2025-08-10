import { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { getBrokerAlpacaAuth, ALPACA_BASE_URL } from '../../utils/authUtils';

dotenv.config();

// Get Instant Funding Limits
export const getInstantFundingLimits = async (req: Request, res: Response) => {
    const { account_id } = req.params;

    try {
        const response = await axios.get(
            `${ALPACA_BASE_URL}/accounts/${account_id}/instant_funding_limits`,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({
            error: error.response?.data || error.message
        });
    }
};

// Get Instant Funding Account Limits
export const getInstantFundingAccountLimits = async (req: Request, res: Response) => {
    const { account_id } = req.params;

    try {
        const response = await axios.get(
            `${ALPACA_BASE_URL}/accounts/${account_id}/instant_funding_account_limits`,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({
            error: error.response?.data || error.message
        });
    }
};

// Get Instant Funding Report
export const getInstantFundingReport = async (req: Request, res: Response) => {
    const { account_id } = req.params;

    try {
        const response = await axios.get(
            `${ALPACA_BASE_URL}/accounts/${account_id}/instant_funding_report`,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({
            error: error.response?.data || error.message
        });
    }
};

// Cancel an Instant Funding Request
export const cancelInstantFundingRequest = async (req: Request, res: Response) => {
    const { account_id, transfer_id } = req.params;

    try {
        const response = await axios.delete(
            `${ALPACA_BASE_URL}/accounts/${account_id}/transfers/${transfer_id}`,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({
            error: error.response?.data || error.message
        });
    }
};

// List Settlements
export const listSettlements = async (req: Request, res: Response) => {
    const { account_id } = req.params;

    try {
        const response = await axios.get(
            `${ALPACA_BASE_URL}/accounts/${account_id}/settlements`,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({
            error: error.response?.data || error.message
        });
    }
};

// Create a New Settlement
export const createSettlement = async (req: Request, res: Response) => {
    const { account_id } = req.params;
    const settlementData = req.body;

    try {
        const response = await axios.post(
            `${ALPACA_BASE_URL}/accounts/${account_id}/settlements`,
            settlementData,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        );
        res.status(201).json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({
            error: error.response?.data || error.message
        });
    }
};

// Get a Single Settlement
export const getSettlementById = async (req: Request, res: Response) => {
    const { account_id, settlement_id } = req.params;

    try {
        const response = await axios.get(
            `${ALPACA_BASE_URL}/accounts/${account_id}/settlements/${settlement_id}`,
            {
                headers: {
                    Authorization: getBrokerAlpacaAuth(),
                    'Accept': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({
            error: error.response?.data || error.message
        });
    }
};