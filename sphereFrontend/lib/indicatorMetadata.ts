/**
 * This file defines the metadata for technical indicators used in financial analysis.
 * It provides structured information about each indicator, including:
 *  - User-friendly names
 *  - Required parameters and their constraints
 *  - Default values for parameters
 *  - UI input types for parameters
 * 
 * The metadata is used to dynamically generate UI controls and validate parameters
 * before sending API requests for indicator calculations.
 */

import { TechnicalIndicatorType, TimeInterval, SeriesType } from './types';

/**
 * Defines the structure for each parameter of a technical indicator.
 * This is used to generate form inputs in the UI and validate user input.
 */
export interface IndicatorParameterMetadata {
    paramName: string;     // The key in the parameters object (e.g., 'time_period')
    label: string;         // User-friendly label (e.g., 'Time Period')
    inputType: 'number' | 'select';  // UI input type to render
    required: boolean;     // Whether this parameter must be provided
    defaultValue?: any;    // Default value for the parameter if not provided by user
    placeholder?: string;  // Placeholder text for input fields
    options?: { value: string | number; label: string }[];  // Options for select inputs
    min?: number;          // Minimum allowed value for number inputs
    max?: number;          // Maximum allowed value for number inputs
    step?: number | 'any'; // Step increment for number inputs
    condition?: (params: Record<string, any>) => boolean; // Function to conditionally display parameter
}

/**
 * Defines the structure for the metadata of a technical indicator.
 * This includes the indicator's display name and its required parameters.
 */
export type IndicatorMetadata = {
    label: string;             // User-friendly name for the indicator
    requiresSymbol: boolean;   // Whether the indicator requires a stock symbol
    requiresInterval: boolean; // Whether the indicator requires a time interval
    params: IndicatorParameterMetadata[];  // Array of parameter definitions
};

/**
 * Complete metadata definitions for all supported technical indicators.
 * 
 * Each indicator entry includes:
 * - A descriptive label for the UI
 * - Symbol and interval requirements
 * - Complete parameter definitions with defaults, constraints, and UI guidance
 * 
 * This object serves as the single source of truth for indicator configurations
 * and is used throughout the application for form generation, validation, and API requests.
 */
export const INDICATOR_METADATA: Record<TechnicalIndicatorType, IndicatorMetadata> = {
    // Simple Moving Average - calculates the average of prices over a specified period
    [TechnicalIndicatorType.SMA]: {
        label: 'SMA (Simple Moving Average)',
        requiresSymbol: true,
        requiresInterval: true,
        params: [
            { paramName: 'time_period', label: 'Time Period', inputType: 'number', required: true, defaultValue: 20, placeholder: 'e.g., 20', min: 1, step: 1 },
            { paramName: 'series_type', label: 'Series Type', inputType: 'select', required: true, defaultValue: SeriesType.CLOSE, options: Object.values(SeriesType).map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) })) },
        ],
    },
    
    // Exponential Moving Average - gives more weight to recent prices, making it more responsive to new information
    [TechnicalIndicatorType.EMA]: {
        label: 'EMA (Exponential Moving Average)',
        requiresSymbol: true,
        requiresInterval: true,
        params: [
            { paramName: 'time_period', label: 'Time Period', inputType: 'number', required: true, defaultValue: 20, placeholder: 'e.g., 20', min: 1, step: 1 },
            { paramName: 'series_type', label: 'Series Type', inputType: 'select', required: true, defaultValue: SeriesType.CLOSE, options: Object.values(SeriesType).map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) })) },
        ],
    },
    
    // Relative Strength Index - momentum oscillator measuring speed and change of price movements
    [TechnicalIndicatorType.RSI]: {
        label: 'RSI (Relative Strength Index)',
        requiresSymbol: true,
        requiresInterval: true,
        params: [
            { paramName: 'time_period', label: 'Time Period', inputType: 'number', required: true, defaultValue: 14, placeholder: 'e.g., 14', min: 1, step: 1 },
            { paramName: 'series_type', label: 'Series Type', inputType: 'select', required: true, defaultValue: SeriesType.CLOSE, options: Object.values(SeriesType).map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) })) },
        ],
    },
    
    // Moving Average Convergence Divergence - trend-following momentum indicator showing relationship between two moving averages
    [TechnicalIndicatorType.MACD]: {
        label: 'MACD',
        requiresSymbol: true,
        requiresInterval: true,
        params: [
            { paramName: 'series_type', label: 'Series Type', inputType: 'select', required: true, defaultValue: SeriesType.CLOSE, options: Object.values(SeriesType).map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) })) },
            { paramName: 'fastperiod', label: 'Fast Period', inputType: 'number', required: false, defaultValue: 12, placeholder: 'e.g., 12', min: 1, step: 1 },
            { paramName: 'slowperiod', label: 'Slow Period', inputType: 'number', required: false, defaultValue: 26, placeholder: 'e.g., 26', min: 1, step: 1 },
            { paramName: 'signalperiod', label: 'Signal Period', inputType: 'number', required: false, defaultValue: 9, placeholder: 'e.g., 9', min: 1, step: 1 },
        ],
    },
    
    // Bollinger Bands - volatility bands placed above and below a moving average
    [TechnicalIndicatorType.BBANDS]: {
        label: 'Bollinger Bands',
        requiresSymbol: true,
        requiresInterval: true,
        params: [
            { paramName: 'time_period', label: 'Time Period', inputType: 'number', required: true, defaultValue: 20, placeholder: 'e.g., 20', min: 1, step: 1 },
            { paramName: 'series_type', label: 'Series Type', inputType: 'select', required: true, defaultValue: SeriesType.CLOSE, options: Object.values(SeriesType).map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) })) },
            { paramName: 'nbdevup', label: 'StdDev Up', inputType: 'number', required: false, defaultValue: 2, placeholder: 'e.g., 2', min: 0, step: 0.1 },
            { paramName: 'nbdevdn', label: 'StdDev Down', inputType: 'number', required: false, defaultValue: 2, placeholder: 'e.g., 2', min: 0, step: 0.1 },
            // MA type is commented out, could be implemented later for different moving average types
            // { paramName: 'matype', label: 'MA Type', inputType: 'select', required: false, defaultValue: 0, options: [ { value: 0, label: 'SMA'}, { value: 1, label: 'EMA'} /* ... add others */ ] },
        ],
    },
    
    // Stochastic Oscillator - momentum indicator comparing price close to price range over time
    [TechnicalIndicatorType.STOCH]: {
        label: 'Stochastic Oscillator',
        requiresSymbol: true,
        requiresInterval: true,
        params: [
            { paramName: 'fastkperiod', label: 'Fast K Period', inputType: 'number', required: false, defaultValue: 5, placeholder: 'e.g., 5', min: 1, step: 1 },
            { paramName: 'slowkperiod', label: 'Slow K Period', inputType: 'number', required: false, defaultValue: 3, placeholder: 'e.g., 3', min: 1, step: 1 },
            { paramName: 'slowdperiod', label: 'Slow D Period', inputType: 'number', required: false, defaultValue: 3, placeholder: 'e.g., 3', min: 1, step: 1 },
            { paramName: 'slowkmatype', label: 'Slow K MA Type', inputType: 'select', required: false, defaultValue: 0, 
              options: [
                { value: 0, label: 'SMA' },
                { value: 1, label: 'EMA' },
                { value: 2, label: 'WMA' },
                { value: 3, label: 'DEMA' },
                { value: 4, label: 'TEMA' },
                { value: 5, label: 'TRIMA' },
                { value: 6, label: 'T3' },
                { value: 7, label: 'KAMA' },
                { value: 8, label: 'MAMA' }
              ]
            },
            { paramName: 'slowdmatype', label: 'Slow D MA Type', inputType: 'select', required: false, defaultValue: 0, 
              options: [
                { value: 0, label: 'SMA' },
                { value: 1, label: 'EMA' },
                { value: 2, label: 'WMA' },
                { value: 3, label: 'DEMA' },
                { value: 4, label: 'TEMA' },
                { value: 5, label: 'TRIMA' },
                { value: 6, label: 'T3' },
                { value: 7, label: 'KAMA' },
                { value: 8, label: 'MAMA' }
              ]
            }
        ],
    },
    
    // Average Directional Index - measures strength of trend regardless of direction
    [TechnicalIndicatorType.ADX]: {
        label: 'ADX (Average Directional Movement Index)',
        requiresSymbol: true,
        requiresInterval: true,
        params: [
            { paramName: 'time_period', label: 'Time Period', inputType: 'number', required: true, defaultValue: 14, placeholder: 'e.g., 14', min: 1, step: 1 }
        ],
    },
    
    // Commodity Channel Index - identifies cyclical trends in price
    [TechnicalIndicatorType.CCI]: {
        label: 'CCI (Commodity Channel Index)',
        requiresSymbol: true,
        requiresInterval: true,
        params: [
            { paramName: 'time_period', label: 'Time Period', inputType: 'number', required: true, defaultValue: 20, placeholder: 'e.g., 20', min: 1, step: 1 }
        ],
    },
    
    // Aroon Indicator - identifies trend changes and strength
    [TechnicalIndicatorType.AROON]: {
        label: 'Aroon Indicator',
        requiresSymbol: true,
        requiresInterval: true,
        params: [
            { paramName: 'time_period', label: 'Time Period', inputType: 'number', required: true, defaultValue: 14, placeholder: 'e.g., 14', min: 1, step: 1 }
        ],
    },
    
    // On Balance Volume - measures buying and selling pressure as a cumulative indicator
    [TechnicalIndicatorType.OBV]: {
        label: 'OBV (On Balance Volume)',
        requiresSymbol: true,
        requiresInterval: true,
        params: [], // OBV doesn't require additional parameters beyond symbol and interval
    },
    
    // Chaikin A/D Line - measures the volume flow of money into and out of a security
    [TechnicalIndicatorType.AD]: {
        label: 'Chaikin A/D Line',
        requiresSymbol: true,
        requiresInterval: true,
        params: [], // AD doesn't require additional parameters beyond symbol and interval
    },
    
    // Average True Range - measures market volatility
    [TechnicalIndicatorType.ATR]: {
        label: 'ATR (Average True Range)',
        requiresSymbol: true,
        requiresInterval: true,
        params: [
            { paramName: 'time_period', label: 'Time Period', inputType: 'number', required: true, defaultValue: 14, placeholder: 'e.g., 14', min: 1, step: 1 }
        ],
    },
    
    // True Range - measures the market's volatility without using any moving averages
    [TechnicalIndicatorType.TRANGE]: {
        label: 'True Range',
        requiresSymbol: true,
        requiresInterval: true,
        params: [], // TRANGE doesn't require additional parameters beyond symbol and interval
    },
    
    // Triangular Moving Average - weighted moving average giving more weight to middle portion of time period
    [TechnicalIndicatorType.TRIMA]: {
        label: 'TRIMA (Triangular Moving Average)',
        requiresSymbol: true,
        requiresInterval: true,
        params: [
            { paramName: 'time_period', label: 'Time Period', inputType: 'number', required: true, defaultValue: 20, placeholder: 'e.g., 20', min: 1, step: 1 },
            { paramName: 'series_type', label: 'Series Type', inputType: 'select', required: true, defaultValue: SeriesType.CLOSE, options: Object.values(SeriesType).map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) })) }
        ],
    },
    
    // Triple Exponential Moving Average - attempts to eliminate lag in traditional moving averages
    [TechnicalIndicatorType.TEMA]: {
        label: 'TEMA (Triple Exponential Moving Average)',
        requiresSymbol: true,
        requiresInterval: true,
        params: [
            { paramName: 'time_period', label: 'Time Period', inputType: 'number', required: true, defaultValue: 20, placeholder: 'e.g., 20', min: 1, step: 1 },
            { paramName: 'series_type', label: 'Series Type', inputType: 'select', required: true, defaultValue: SeriesType.CLOSE, options: Object.values(SeriesType).map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) })) }
        ],
    },
    
    // Double Exponential Moving Average - reduces lag by applying EMA twice
    [TechnicalIndicatorType.DEMA]: {
        label: 'DEMA (Double Exponential Moving Average)',
        requiresSymbol: true,
        requiresInterval: true,
        params: [
            { paramName: 'time_period', label: 'Time Period', inputType: 'number', required: true, defaultValue: 20, placeholder: 'e.g., 20', min: 1, step: 1 },
            { paramName: 'series_type', label: 'Series Type', inputType: 'select', required: true, defaultValue: SeriesType.CLOSE, options: Object.values(SeriesType).map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) })) }
        ],
    },
    
    // Kaufman Adaptive Moving Average - adjusts sensitivity to volatility
    [TechnicalIndicatorType.KAMA]: {
        label: 'KAMA (Kaufman Adaptive Moving Average)',
        requiresSymbol: true,
        requiresInterval: true,
        params: [
            { paramName: 'time_period', label: 'Time Period', inputType: 'number', required: true, defaultValue: 20, placeholder: 'e.g., 20', min: 1, step: 1 },
            { paramName: 'series_type', label: 'Series Type', inputType: 'select', required: true, defaultValue: SeriesType.CLOSE, options: Object.values(SeriesType).map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) })) }
        ],
    },
    
    // Weighted Moving Average - gives more weight to recent data and less weight to older data
    [TechnicalIndicatorType.WMA]: {
        label: 'WMA (Weighted Moving Average)',
        requiresSymbol: true,
        requiresInterval: true,
        params: [
            { paramName: 'time_period', label: 'Time Period', inputType: 'number', required: true, defaultValue: 20, placeholder: 'e.g., 20', min: 1, step: 1 },
            { paramName: 'series_type', label: 'Series Type', inputType: 'select', required: true, defaultValue: SeriesType.CLOSE, options: Object.values(SeriesType).map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) })) }
        ],
    },
};

/**
 * Helper function to get default parameters for an indicator type.
 * This is useful when initializing forms or API requests with sensible defaults.
 * 
 * @param indicatorType - The type of indicator to get default parameters for
 * @returns An object with the default parameter values for the specified indicator
 */
export const getDefaultIndicatorParams = (indicatorType: TechnicalIndicatorType): Record<string, any> => {
    const metadata = INDICATOR_METADATA[indicatorType];
    if (!metadata) return {};
    
    // Initialize with the indicator type itself
    const defaults: Record<string, any> = { indicatorType };
    
    // Add each parameter's default value
    metadata.params.forEach(p => {
        if (p.defaultValue !== undefined) {
            defaults[p.paramName] = p.defaultValue;
        }
    });
    
    return defaults;
};