// src/utils/authUtils.ts
import dotenv from 'dotenv';

dotenv.config();

const ALPACA_BROKER_API_KEY = process.env.ALPACA_BROKER_API_KEY;
const ALPACA_BROKER_API_SECRET = process.env.ALPACA_BROKER_API_SECRET;
const ALPACA_MARKET_API_KEY = process.env.ALPACA_MARKET_API_KEY;
const ALPACA_MARKET_API_SECRET = process.env.ALPACA_MARKET_SECRET_KEY;


if (!ALPACA_BROKER_API_KEY || !ALPACA_BROKER_API_SECRET) {
    throw new Error('Alpaca API credentials are not properly configured in environment variables. BROKER API KEY not equal to BROKER API SECRET');
}
if (!ALPACA_MARKET_API_KEY || !ALPACA_MARKET_API_SECRET) {
    throw new Error('Alpaca API credentials are not properly configured in environment variables. MARKET API KEY not equal to MARKET API SECRET');
}

const BROKER_AUTH_VALUE = `Basic ${Buffer.from(`${ALPACA_BROKER_API_KEY}:${ALPACA_BROKER_API_SECRET}`).toString('base64')}`;
// const MARKET_AUTH_VALUE = `Basic ${Buffer.from(`${ALPACA_MARKET_API_KEY}:${ALPACA_MARKET_API_SECRET}`).toString('base64')}`;

export const getAlpacaMarketAuth = () => {
    return {
        'APCA-API-KEY-ID': ALPACA_MARKET_API_KEY,
        'APCA-API-SECRET-KEY': ALPACA_MARKET_API_SECRET,
    }
}
/**
 * Returns the cached Basic Auth value for Alpaca API requests
 * @returns {string} The Authorization header value (e.g., "Basic <base64>")
 */
export const getBrokerAlpacaAuth = (): string => BROKER_AUTH_VALUE;
// export const getAlpacaMarketAuth = (): string => MARKET_AUTH_VALUE;
/**
 * Base URL for Alpaca sandbox environment
 */

export const ALPACA_BASE_URL = 'https://broker-api.sandbox.alpaca.markets/v1';
export const ALPACA_HISTORICAL_DATA_BASE_URL = 'https://data.alpaca.markets/v2';
export const ALPACA_CRYPTO_DATA_BASE_URL = `https://data.alpaca.markets/v1beta3/crypto`;
export const ALPACA_WSS_STOCK_BASE_URL = 'wss://stream.data.alpaca.markets/v2/iex';
export const ALPACA_WSS_CRYPTO_BASE_URL = 'wss://stream.data.alpaca.markets/v1beta3/crypto/us';
export const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
export const REDIS_PORT = process.env.REDIS_PORT || 6379;