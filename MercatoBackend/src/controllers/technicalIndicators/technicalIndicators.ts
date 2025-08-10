/**
 * This module is responsible for fetching technical indicator data from the Alpha Vantage API.
 * It handles caching the response data in Redis to minimize redundant API calls and improve performance.
 * Upon successfully fetching and caching new data, it publishes an "IndicatorDataUpdated" message to a Redis stream.
 * 
 * Technical Perspective:
 * - Caches responses in Redis with a time-to-live (TTL) based on the indicator's interval.
 * - Publishes updates to a Redis stream to notify other services of new data availability.
 * - Ensures timely and efficient retrieval of market data for user strategies.
 * - Reduces operational costs by minimizing API calls through effective caching.
 * - Provides real-time updates to downstream systems, enhancing the platform's responsiveness to market changes.
 */

import axios from 'axios';
import dotenv from 'dotenv';
import { generateCacheKey, setCachedIndicatorData, getCachedIndicatorEntry } from "./cache"; 
import { initRedis } from "../../utils/redisClient";
import { publishIndicatorUpdate } from '../scheduler/redisStream'; 
import { IndicatorUpdatePayload } from '../strategyAPI/strategyApiTypes';

dotenv.config();

const alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY;
// console.log(apikey);
const alphaVantageBaseUrl = 'https://www.alphavantage.co/query';

export interface FetchIndicatorParams {
    indicatorType: string; // Function name for AlphaVantage (e.g., SMA, EMA)
    symbol: string;        // Stock ticker
    interval: string;      // e.g., 1min, 5min, daily
    parameters: {         // Calculation-specific parameters
        time_period?: number;
        series_type?: string;
        // Add other possible AV params: fastperiod, slowperiod, nbdevup, nbdevdn etc.
        [key: string]: any; // Allow flexibility
    };
    dataSource?: string; // Expected to be 'AlphaVantage' or similar if handled here
    dataKey?: string; 
}

export const getTechnicalIndicator = async (
    params: FetchIndicatorParams, // Use the updated interface
    forceRefresh: boolean = false
): Promise<any> => { // Return type is the actual indicator data object
    if (!alphaVantageApiKey) {
        console.error("ALPHA_VANTAGE_API_KEY is not set in environment variables.");
        throw new Error("API key configuration error.");
    }
    await initRedis(); // Ensure Redis is ready

    // Use the parameters structure expected by generateCacheKey
    const cacheKeyParams = {
        indicatorType: params.indicatorType,
        symbol: params.symbol,
        interval: params.interval,
        parameters: params.parameters, // Pass the calculation parameters directly
        dataSource: params.dataSource || 'AlphaVantage', // Default dataSource if needed
    };
    const cacheKey = generateCacheKey(cacheKeyParams);

    if (!forceRefresh) {
        const cachedEntry = await getCachedIndicatorEntry<any>(cacheKey);
        if (cachedEntry) {
            // console.log(`Cache hit for ${cacheKey}`);
            // Optionally add staleness check based on metadata here
            return cachedEntry.data;
        }
        // console.log(`Cache miss for ${cacheKey}`);
    } else {
        console.log(`Forcing refresh for ${cacheKey}`);
    }

    try {
        // Construct API parameters for Alpha Vantage
        const apiParams: Record<string, string | number> = {
            function: params.indicatorType, // Use indicatorType as AV function name
            symbol: params.symbol,
            interval: params.interval,
            apikey: alphaVantageApiKey,
            // Spread the calculation-specific parameters
            ...params.parameters,
        };

        // Default series_type if not provided and function requires it (common case)
        if (['SMA', 'EMA', 'BBANDS', 'MACD', 'RSI', 'TEMA', 'TRIMA', 'DEMA', 'KAMA', 'WMA'].includes(params.indicatorType) && !apiParams.series_type) {
            apiParams.series_type = 'close';
        }

        console.log(`Fetching fresh data from AlphaVantage for ${cacheKey}. API Params:`, apiParams);
        const response = await axios.get(alphaVantageBaseUrl, { params: apiParams });
        const responseData = response.data;

        // --- Robust Error Handling ---
        if (!responseData || typeof responseData !== 'object') {
             throw new Error(`Invalid response received from Alpha Vantage for ${cacheKey}: Not an object.`);
        }
        if (responseData["Error Message"]) {
             throw new Error(`Alpha Vantage API Error for ${cacheKey}: ${responseData["Error Message"]}`);
        }
        // Check for rate limiting note
        const note = responseData["Note"] || responseData["Information"];
        if (note && typeof note === 'string' && note.includes("API call frequency")) {
             console.warn(`Alpha Vantage Rate Limit likely hit for ${cacheKey}. Data not cached or published.`);
             // Consider throwing a specific error type for rate limits if needed downstream
             throw new Error(`Alpha Vantage Rate Limit Hit for ${cacheKey}`);
        }
        if (!responseData['Meta Data']) {
             throw new Error(`Invalid response received from Alpha Vantage for ${cacheKey}: Missing 'Meta Data'. Response: ${JSON.stringify(responseData)}`);
        }
        // --- End Error Handling ---

        const metaData = responseData['Meta Data'];
        // Find the actual indicator data key (e.g., "Technical Analysis: SMA")
        const dataKey = Object.keys(responseData).find(key => key !== 'Meta Data');

        if (!dataKey || typeof responseData[dataKey] !== 'object') {
            throw new Error(`Could not extract indicator data from Alpha Vantage response for ${cacheKey}. Response: ${JSON.stringify(responseData)}`);
        }

        const actualIndicatorData = responseData[dataKey];
        const lastRefreshedAV = metaData['3: Last Refreshed'];

        // --- TTL Calculation (remains the same logic) ---
         let ttlSeconds = 86400; // default: 24 hours
         const intervalMinutes = { '1min': 1, '5min': 5, '15min': 15, '30min': 30, '60min': 60 };
         const intervalKey = params.interval as keyof typeof intervalMinutes;

         if (intervalMinutes[intervalKey]) {
             ttlSeconds = intervalMinutes[intervalKey] * 60 * 2; // Cache for roughly 2 intervals
             // Clamp TTL to a reasonable max if needed, e.g., Math.min(ttlSeconds, 3600) for 1hr max on intraday
         } else if (params.interval === 'daily') {
             ttlSeconds = 86400 + 3600; // > 24h
         } else if (params.interval === 'weekly') {
             ttlSeconds = 86400 * 7 + 3600;
         } else if (params.interval === 'monthly') {
             ttlSeconds = 86400 * 30 + 3600; // Approximation
         }

        // --- Store in Cache ---
        // Include potentially useful metadata from the response
        const cacheMetadata = {
            alphaVantageLastRefreshed: lastRefreshedAV,
            indicatorName: metaData['2: Indicator'],
            // Add other relevant metadata fields from AV if desired
        };
        await setCachedIndicatorData(cacheKey, actualIndicatorData, cacheMetadata, ttlSeconds);

        // --- Publish Update Event ---
        const updatePayload: IndicatorUpdatePayload = {
            cacheKey: cacheKey,
            indicatorType: params.indicatorType,
            symbol: params.symbol || '',
            interval: params.interval,
            parameters: params.parameters, // Pass the calculation params
            dataSource: params.dataSource || 'AlphaVantage',
            dataKey: dataKey, // The actual key found in the response (e.g., "Technical Analysis: SMA")
            lastRefreshed: lastRefreshedAV,
            fetchTime: new Date().toISOString()
        };
        await publishIndicatorUpdate(updatePayload);

        return actualIndicatorData; // Return only the indicator data points

    } catch (error: any) {
        console.error(`Error in getTechnicalIndicator for key ${cacheKey}:`, error.message);
        // Log the error but re-throw it so the worker/caller knows it failed
        throw error;
    }
};

// Simple Moving Average
export const getSMA = (symbol: string, interval: string, time_period: number = 20, series_type: string = 'close'): Promise<any> => {
    return getTechnicalIndicator({
        indicatorType: 'SMA',
        symbol,
        interval,
        parameters: { time_period, series_type }
    });
};

// Exponential Moving Average
export const getEMA = (symbol: string, interval: string, time_period: number = 20, series_type: string = 'close'): Promise<any> => {
    return getTechnicalIndicator({
        indicatorType: 'EMA',
        symbol,
        interval,
        parameters: { time_period, series_type }
    });
};

// Moving Average Convergence Divergence
export const getMACD = (
    symbol: string, 
    interval: string, 
    series_type: string = 'close', 
    fastperiod: number = 12, 
    slowperiod: number = 26, 
    signalperiod: number = 9
): Promise<any> => {
    return getTechnicalIndicator({
        indicatorType: 'MACD',
        symbol,
        interval,
        parameters: { series_type, fastperiod, slowperiod, signalperiod }
    });
};

// Relative Strength Index
export const getRSI = (symbol: string, interval: string, time_period: number = 14, series_type: string = 'close'): Promise<any> => {
    return getTechnicalIndicator({
        indicatorType: 'RSI',
        symbol,
        interval,
        parameters: { time_period, series_type }
    });
};

// Bollinger Bands
export const getBBANDS = (
    symbol: string, 
    interval: string, 
    time_period: number = 20, 
    series_type: string = 'close',
    nbdevup: number = 2,
    nbdevdn: number = 2
): Promise<any> => {
    return getTechnicalIndicator({
        indicatorType: 'BBANDS',
        symbol,
        interval,
        parameters: { time_period, series_type, nbdevup, nbdevdn }
    });
};

// Stochastic Oscillator
export const getSTOCH = (
    symbol: string, 
    interval: string,
    fastkperiod: number = 5,
    slowkperiod: number = 3,
    slowdperiod: number = 3,
    slowkmatype: number = 0,
    slowdmatype: number = 0
): Promise<any> => {
    return getTechnicalIndicator({
        indicatorType: 'STOCH',
        symbol,
        interval,
        parameters: { fastkperiod, slowkperiod, slowdperiod, slowkmatype, slowdmatype }
    });
};

// Average Directional Movement Index
export const getADX = (symbol: string, interval: string, time_period: number = 14): Promise<any> => {
    return getTechnicalIndicator({
        indicatorType: 'ADX',
        symbol,
        interval,
        parameters: { time_period }
    });
};

// Commodity Channel Index
export const getCCI = (symbol: string, interval: string, time_period: number = 20): Promise<any> => {
    return getTechnicalIndicator({
        indicatorType: 'CCI',
        symbol,
        interval,
        parameters: { time_period }
    });
};

// Aroon Indicator
export const getAROON = (symbol: string, interval: string, time_period: number = 14): Promise<any> => {
    return getTechnicalIndicator({
        indicatorType: 'AROON',
        symbol,
        interval,
        parameters: { time_period }
    });
};

// On Balance Volume
export const getOBV = (symbol: string, interval: string): Promise<any> => {
    return getTechnicalIndicator({
        indicatorType: 'OBV',
        symbol,
        interval,
        parameters: {}
    });
};

// Chaikin A/D Line
export const getAD = (symbol: string, interval: string): Promise<any> => {
    return getTechnicalIndicator({
        indicatorType: 'AD',
        symbol,
        interval,
        parameters: {}
    });
};

// Average True Range
export const getATR = (symbol: string, interval: string, time_period: number = 14): Promise<any> => {
    return getTechnicalIndicator({
        indicatorType: 'ATR',
        symbol,
        interval,
        parameters: { time_period }
    });
};

// True Range
export const getTRANGE = (symbol: string, interval: string): Promise<any> => {
    return getTechnicalIndicator({
        indicatorType: 'TRANGE',
        symbol,
        interval,
        parameters: {}
    });
};

// Triangular Moving Average
export const getTRIMA = (symbol: string, interval: string, time_period: number = 20, series_type: string = 'close'): Promise<any> => {
    return getTechnicalIndicator({
        indicatorType: 'TRIMA',
        symbol,
        interval,
        parameters: { time_period, series_type }
    });
};

// Triple Exponential Moving Average
export const getTEMA = (symbol: string, interval: string, time_period: number = 20, series_type: string = 'close'): Promise<any> => {
    return getTechnicalIndicator({
        indicatorType: 'TEMA',
        symbol,
        interval,
        parameters: { time_period, series_type }
    });
};

// Double Exponential Moving Average
export const getDEMA = (symbol: string, interval: string, time_period: number = 20, series_type: string = 'close'): Promise<any> => {
    return getTechnicalIndicator({
        indicatorType: 'DEMA',
        symbol,
        interval,
        parameters: { time_period, series_type }
    });
};

// Kaufman Adaptive Moving Average
export const getKAMA = (symbol: string, interval: string, time_period: number = 20, series_type: string = 'close'): Promise<any> => {
    return getTechnicalIndicator({
        indicatorType: 'KAMA',
        symbol,
        interval,
        parameters: { time_period, series_type }
    });
};

// Weighted Moving Average
export const getWMA = (symbol: string, interval: string, time_period: number = 20, series_type: string = 'close'): Promise<any> => {
    return getTechnicalIndicator({
        indicatorType: 'WMA',
        symbol,
        interval,
        parameters: { time_period, series_type }
    });
};

/**
 * Generic function to get any technical indicator
 * @param indicatorType - The indicator type (e.g., 'SMA', 'RSI')
 * @param symbol - Stock ticker symbol
 * @param interval - Time interval
 * @param parameters - Additional parameters for the indicator
 */
export const getIndicator = (
    indicatorType: string, 
    symbol: string, 
    interval: string, 
    parameters: Record<string, any> = {}
): Promise<any> => {
    return getTechnicalIndicator({
        indicatorType,
        symbol,
        interval,
        parameters
    });
};