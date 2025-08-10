// src/lib/types.ts

// --- Enums (Mirroring Prisma Enums) ---

/** Defines the different kinds of blocks available in a strategy */
export enum StrategyBlockType {
    ROOT = 'ROOT',             // The top-level container for a strategy's logic
    WEIGHT = 'WEIGHT',           // Allocates a percentage of capital to the child block(s)
    ASSET = 'ASSET',            // Represents a specific tradable instrument (stock, ETF, crypto, etc.)
    GROUP = 'GROUP',            // A named container to group multiple blocks (often assets)
    CONDITION_IF = 'CONDITION_IF', // Executes child blocks conditionally (IF condition THEN children ELSE...)
    FILTER = 'FILTER',          // Narrows down a set of assets based on criteria
    ACTION = 'ACTION',          // Performs a specific operation (Buy, Sell, Notify, etc.)
}

export enum OperandKind {
    VALUE = 'VALUE',
    TECHNICAL_INDICATOR = 'TECHNICAL_INDICATOR',
    MACRO_INDICATOR = 'MACRO_INDICATOR', // Keep for future
    // Could add 'BLOCK_OUTPUT' later if conditions can reference other block results
}



/** Comparison operators used in Conditions and Filters */
export enum Operator {
    EQUALS = '= (Equals)',
    NOT_EQUALS = '≠ (Not Equals)',
    GREATER_THAN = '> (Greater Than)',
    LESS_THAN = '< (Less Than)',
    GREATER_THAN_OR_EQUAL = '≥ (Greater Than or Equal)',
    LESS_THAN_OR_EQUAL = '≤ (Less Than or Equal)',
    CROSSES_ABOVE = '↗ (Crosses Above)', // Example symbol for "crosses above"
    CROSSES_BELOW = '↘ (Crosses Below)', // Example symbol for "crosses below"
  }

/** Types of specific actions that can be performed */
export enum ActionType {
    BUY = 'BUY',               // Execute a buy order
    SELL = 'SELL',              // Execute a sell order
    NOTIFY = 'NOTIFY',           // Send a notification (email, webhook, etc.)
    REBALANCE = 'REBALANCE',     // Trigger a portfolio or group rebalance
    LOG_MESSAGE = 'LOG_MESSAGE', // Record a custom message in strategy logs
}

/** Defines the possible classes for assets */
export enum AssetClass {
    US_EQUITY = 'us_equity',
    ETF = 'etf',
    CRYPTO = 'crypto',
    BOND = 'bond',
    MUTUAL_FUND = 'mutual_fund',
    OTHER = 'other',
}

/** Defines common time intervals */
export enum TimeInterval {
    MIN_1 = '1min',
    MIN_5 = '5min',
    MIN_15 = '15min',
    MIN_30 = '30min',
    HOUR_1 = '60min',
    DAY_1 = 'daily',
    WEEK_1 = 'weekly',
    MONTH_1 = 'monthly',
}

/** Defines common order types */
export enum OrderType {
    MARKET = 'Market',
    LIMIT = 'Limit',
    STOP = 'Stop',
    STOP_LIMIT = 'Stop Limit',
    TRAILING_STOP = 'Trailing Stop',
}

/** Defines common time-in-force options for orders */
export enum TimeInForce {
    GTC = 'GTC', // Good 'til Canceled
    DAY = 'Day', // Day Order
    IOC = 'IOC', // Immediate or Cancel
    FOK = 'FOK', // Fill or Kill
}

// Technical Indicator Types and Params: 
export enum TechnicalIndicatorType {
    SMA = 'SMA',
    EMA = 'EMA',
    RSI = 'RSI',
    MACD = 'MACD',
    BBANDS = 'BBANDS', // Bollinger Bands
    STOCH = 'STOCH', // Stochastic Oscillator
    ADX = 'ADX', // Average Directional Movement Index
    CCI = 'CCI', // Commodity Channel Index
    AROON = 'AROON', // Aroon Indicator
    OBV = 'OBV', // On Balance Volume
    AD = 'AD', // Chaikin A/D Line
    ATR = 'ATR', // Average True Range
    TRANGE = 'TRANGE', // True Range
    TRIMA = 'TRIMA', // Triangular Moving Average
    TEMA = 'TEMA', // Triple Exponential Moving Average
    DEMA = 'DEMA', // Double Exponential Moving Average
    KAMA = 'KAMA', // Kaufman Adaptive Moving Average
    WMA = 'WMA', // Weighted Moving Average
    
}

/** Supported series types for price-based indicators */
export enum SeriesType {
    CLOSE = 'close',
    OPEN = 'open',
    HIGH = 'high',
    LOW = 'low',
}

interface BaseIndicatorParams {
    // Common optional parameters can go here if any
    // For Alpha Vantage, 'interval' and 'symbol' are often top-level in the operand
}

/** Parameters for SMA */
export interface SmaParameters extends BaseIndicatorParams {
    indicatorType: TechnicalIndicatorType.SMA;
    time_period: number;
    series_type: SeriesType;
    // Optional Alpha Vantage params: month, datatype (usually handled globally)
}

/** Parameters for EMA */
export interface EmaParameters extends BaseIndicatorParams {
    indicatorType: TechnicalIndicatorType.EMA;
    time_period: number;
    series_type: SeriesType;
}

/** Parameters for RSI */
export interface RsiParameters extends BaseIndicatorParams {
    indicatorType: TechnicalIndicatorType.RSI;
    time_period: number;
    series_type: SeriesType; // Alpha Vantage RSI also requires series_type
}

/** Parameters for MACD */
export interface MacdParameters extends BaseIndicatorParams {
    indicatorType: TechnicalIndicatorType.MACD;
    series_type: SeriesType;
    fastperiod?: number; // Defaults often exist in API
    slowperiod?: number;
    signalperiod?: number;
}

/** Parameters for BBANDS */
export interface BBandsParameters extends BaseIndicatorParams {
    indicatorType: TechnicalIndicatorType.BBANDS;
    time_period: number;
    series_type: SeriesType;
    nbdevup?: number; // Std Dev Up
    nbdevdn?: number; // Std Dev Down
    matype?: number; // Moving average type (0=SMA, 1=EMA, etc. - map if needed)
}

/** Discriminated union of all possible technical indicator parameter sets */
export type TechnicalIndicatorParameters =
    | SmaParameters
    | EmaParameters
    | RsiParameters
    | MacdParameters
    | BBandsParameters
    // | OtherIndicatorParameters | ... etc.
    | { indicatorType: Exclude<
        TechnicalIndicatorType, 
        TechnicalIndicatorType.SMA | TechnicalIndicatorType.EMA | 
        TechnicalIndicatorType.RSI | TechnicalIndicatorType.MACD | 
        TechnicalIndicatorType.BBANDS 
        >
    }; // Fallback for un-typed indicators

export interface ValueOperand {
    kind: OperandKind.VALUE;
    value: number | string; // Allow string initially for input flexibility
}

export interface TechnicalIndicatorOperand {
    kind: OperandKind.TECHNICAL_INDICATOR;
    indicatorType: TechnicalIndicatorType; // Use the Enum now
    symbol: string | null; // Symbol might be required depending on indicator
    interval: TimeInterval | null; // Interval might be required depending on indicator
    /** Contains the specific parameters for the chosen indicatorType */
    parameters: TechnicalIndicatorParameters;
}

export interface MacroIndicatorOperand {
    kind: OperandKind.MACRO_INDICATOR;
    indicatorType: string; // Use specific enum later
    dataSource?: string;
    region?: string;
    parameters?: Record<string, any>;
    fredSeriesId?: string | null;
    description?: string | null; // Add description to store alongside ID when selected
}

export type ConditionOperand =
    | ValueOperand
    | TechnicalIndicatorOperand
    | MacroIndicatorOperand
    | { kind: null };

export interface MacroIndicatorMetadata {
    path: string;
    method: 'get';
    description: string;
    fredSeriesId: string;
    tags: string[];
}

// --- Specific Block Parameter Interfaces ---
// These define the expected structure of the `parameters` JSON field for each block type.

/** Parameters for ROOT block (typically none needed) */
export interface RootBlockParameters {
    /** Optional strategy version tracking */
    version?: number;
    /** Enforce empty object if no other params */
    [key: string]: any; // Allow flexibility if needed later, or use `never` for strict empty
}

/** Parameters for WEIGHT block */
export interface WeightBlockParameters {
    /** Allocation percentage (e.g., 50 for 50%). Must be positive. */
    percentage: number;
    /** Optional: Apply leverage (e.g., 2 for 2x). Defaults to 1. */
    leverage?: number;
}

/** Parameters for ASSET block */
export interface AssetBlockParameters {
    /** Ticker symbol or identifier (e.g., "AAPL", "BTC-USD", "EURUSD") */
    symbol: string;
    /** User-friendly name (e.g., "Apple Inc.", "Bitcoin") */
    // name?: string;
    /** Classification of the asset */
    assetClass?: AssetClass;
    /** Optional: Exchange where the asset trades (e.g., "NASDAQ", "NYSE", "BINANCE") */
    exchange?: string;
}

/** Parameters for GROUP block */
export interface GroupBlockParameters {
    /** User-defined name for the group (e.g., "Tech Stocks", "Defensive") */
    name: string;
    /** Optional description for the group's purpose */
    // description?: string;
}

/**
 * Parameters for CONDITION_IF block.
 * Holds the definition of the condition to be evaluated.
 * Note: This embeds condition logic. The linked `Condition` model might be unused
 * for IF blocks or used only for `targetIndicatorId`.
 */
// export interface ConditionIfBlockParameters {
//     /** Optional user-defined name for this conditional step */
//     name?: string;

//     // --- Condition Definition ---
//     /** Type of indicator/data being checked (e.g., 'Technical', 'Macro', 'Price', 'GeopoliticalEvent') */
//     indicatorType: string; // Change this to specific enum
//     /** Source of the data (e.g., 'FRED', 'TradingView', 'InternalFeed', 'YahooFinance') */
//     dataSource?: string | null; // look into using enums and if we need to provide this to users or just use a black box
//     /** Specific data key within the source (e.g., 'CPI_YOY', 'VIX', 'Price.Close', 'RSI') */
//     dataKey?: string | null;
//     /** Ticker/symbol if the indicator applies to a specific asset (e.g., 'SPY', 'EURUSD') */
//     symbol?: string | null;
//     /** Time interval if applicable (e.g., '1d', '1h') */
//     interval?: TimeInterval | null;
//     /** Nested parameters specific to the indicator (e.g., { period: 14 } for RSI) */
//     indicatorParameters?: Record<string, any>;
//     /** Comparison operator */
//     operator: Operator;
//     /** Static value to compare against (use null if comparing against targetIndicatorId) */
//     targetValue?: number | null;
//     /** Optional: ID of another Condition record to compare against dynamically */
//     targetIndicatorId?: string | null;
// }

export interface ConditionIfBlockParameters {
    name?: string;

    leftOperand: ConditionOperand;
    operator: Operator;
    rightOperand: ConditionOperand;
}

/** Parameters for FILTER block */
export interface FilterBlockParameters {
    /** Optional user-defined name for the filter step */
    name?: string;
    /** The metric to filter on (e.g., "MarketCap", "PE_Ratio", "RSI", "DividendYield") */
    metric: string;
    /** Source of the metric data (helps clarify source, e.g., 'Fundamental', 'Technical', 'Custom') */
    dataSource?: string;
    /** Comparison operator */
    operator: Operator;
    /** The value to compare the metric against */
    value: string | number; // Use string | number for flexibility
}

// --- Parameters for ACTION Block (using Discriminated Union based on actionType) ---

/** Base parameters potentially common to all actions */
export interface BaseActionParams {
    /** Optional user-defined name for this specific action step */
    name?: string;
}

/** Parameters specific to BUY or SELL actions */ // tie it w/ existing function from Alpaca, see which options to provide in different contexts
export interface BuySellActionParams extends BaseActionParams {
actionType: ActionType.BUY | ActionType.SELL;
    /** The symbol of the asset to trade */
    symbol: string;
    /** Specific number of units/shares. Cannot be used if 'percentage' is set. */
    quantity?: number;
    /**
     * Percentage of portfolio value, available cash, or current position size.
     * Cannot be used if 'quantity' is set. Interpretation depends on execution engine.
     */
    // percentage?: number;
    /** Type of order to place (Market, Limit, etc.) */
    orderType?: OrderType;
    /** Required price for Limit or Stop Limit orders */
    limitPrice?: number;
    /** Required price for Stop or Stop Limit orders */
    stopPrice?: number;
    /** Optional: Price offset or percentage for Trailing Stop orders */
    trailingStopValue?: number;
    /** Optional: Specify if trailing stop value is a percentage */
    trailingStopUnit?: 'Amount' | 'Percent';
    /** Time the order remains active (e.g., GTC, Day) */
    timeInForce?: TimeInForce;
    /** Optional: Allow trading during extended hours */
    allowExtendedHours?: boolean;
}

/** Parameters specific to NOTIFY actions */
export interface NotifyActionParams extends BaseActionParams {
    actionType: ActionType.NOTIFY;
    /** The content of the notification message. Can include dynamic variables (e.g., {{symbol}}, {{price}}). */
    message: string;
    /** Target recipient (e.g., email address, webhook URL, user ID) */
    recipient?: string;
    /** Channel for sending the notification */
    channel?: 'Email' | 'SMS' | 'Webhook' | 'Platform'; // Add more as needed
}

/** Parameters specific to LOG_MESSAGE actions */
export interface LogMessageActionParams extends BaseActionParams {
    actionType: ActionType.LOG_MESSAGE;
    /** The message to record in the strategy's execution logs. Can include dynamic variables. */
    message: string;
    /** Severity level for the log entry */
    level?: 'Info' | 'Warning' | 'Error' | 'Debug';
}

/** Parameters specific to REBALANCE actions */
export interface RebalanceActionParams extends BaseActionParams {
    actionType: ActionType.REBALANCE;
    /** What scope to rebalance ('Portfolio' or a specific 'Group') */
    scope?: 'Portfolio' | 'Group';
    /** ID of the GROUP block to rebalance (required if scope is 'Group') */
    targetGroupId?: string;
    /**
     * Optional: Allowable deviation percentage per asset before rebalancing is triggered.
     * If undefined, rebalancing occurs whenever the action is hit.
     */
    allowDeviation?: number;
    /** Optional: Exclude certain symbols from the rebalance operation */
    excludeSymbols?: string[];
}

/** Discriminated union for all possible ACTION block parameters */
export type ActionBlockParameters =
    | BuySellActionParams
    | NotifyActionParams
    | LogMessageActionParams
    | RebalanceActionParams;

// --- Master Discriminated Union for All Strategy Blocks ---
// This maps each blockType to its specific parameter interface, providing strong typing.

export type TypedStrategyBlock =
    | (Omit<StrategyBlockCore, 'parameters' | 'blockType'> & { blockType: StrategyBlockType.ROOT; parameters: RootBlockParameters; })
    | (Omit<StrategyBlockCore, 'parameters' | 'blockType'> & { blockType: StrategyBlockType.WEIGHT; parameters: WeightBlockParameters; })
    | (Omit<StrategyBlockCore, 'parameters' | 'blockType'> & { blockType: StrategyBlockType.ASSET; parameters: AssetBlockParameters; })
    | (Omit<StrategyBlockCore, 'parameters' | 'blockType'> & { blockType: StrategyBlockType.GROUP; parameters: GroupBlockParameters; })
    | (Omit<StrategyBlockCore, 'parameters' | 'blockType'> & { blockType: StrategyBlockType.CONDITION_IF; parameters: ConditionIfBlockParameters; })
    | (Omit<StrategyBlockCore, 'parameters' | 'blockType'> & { blockType: StrategyBlockType.FILTER; parameters: FilterBlockParameters; })
    | (Omit<StrategyBlockCore, 'parameters' | 'blockType'> & { blockType: StrategyBlockType.ACTION; parameters: ActionBlockParameters; });


// --- Core Model Interfaces (Based on Prisma Schema + API Responses - Updated) ---

/** Represents the data for a Condition (potentially linked or used for comparison targets) */
export interface Condition {
    id: string;
    indicatorType: string;
    dataSource?: string | null;
    dataKey?: string | null;
    symbol?: string | null;
    interval?: TimeInterval | null; // Use TimeInterval enum
    parameters: Record<string, any>; // Specific indicator params (e.g., period)
    operator: Operator;
    targetValue?: number | null;
    targetIndicatorId?: string | null;
    createdAt: string;
    updatedAt: string;
}

/** Represents the data for an Action (potentially linked, though params often in block) */
export interface Action {
    id: string;
    actionType: ActionType;
    parameters: Record<string, any>; // Holds specific action details if not in block params
    order: number;
    createdAt: string;
    updatedAt: string;
}

/**
 * Base structure of a strategy block from the database.
 * Primarily used internally for constructing the TypedStrategyBlock.
 */
interface StrategyBlockCore {
    id: string;
    strategyId: string;
    blockType: StrategyBlockType;
    /** Generic JSON parameter object from DB - Use TypedStrategyBlock for specific structure */
    parameters: Record<string, any>;
    parentId?: string | null;
    /** ID of a linked Condition record (may be unused for CONDITION_IF if params embed logic) */
    conditionId?: string | null;
    /** ID of a linked Action record (may be unused for ACTION if params embed logic) */
    actionId?: string | null;
    order: number; // Execution/display order among siblings
    createdAt: string;
    updatedAt: string;
}

/**
 * Recursive type representing a Strategy Block with its specific parameters typed,
 * potentially linked Condition/Action data, and nested children.
 * This is the primary type used for rendering and manipulation in the frontend.
 */
export type StrategyBlockWithChildren = TypedStrategyBlock & {
    /** Populated linked Condition data, if available and applicable */
    condition?: Condition | null;
    /** Populated linked Action data, if available and applicable */
    action?: Action | null;
    /** Nested child blocks, also strongly typed */
    children?: StrategyBlockWithChildren[] | null;
};

/** Represents a complete Strategy definition, including its entry point (rootBlock) */
export interface Strategy {
    id: string;
    userId: string;
    name: string;
    description?: string | null;
    isActive: boolean;
    allocatedAmount?: number | null; // Amount user has allocated to this strategy
    rootBlockId?: string | null;
    /** The root of the strategy logic tree, using the strongly-typed  block structure */
    rootBlock?: StrategyBlockWithChildren | null;
    createdAt: string;
    updatedAt: string;
    tradingFrequency?: string | null; // Example if you want to fetch this
}

/** Basic User information */
export interface User {
    id: string;
    email: string;
    createdAt: string;
    updatedAt: string;
}

/** Interface for user's allocation summary */
export interface AllocationSummary {
    availableFunds: number;
    totalAllocated: number;
    availableToAllocate: number;
    allocations: Array<{
        id: string;
        name: string;
        allocatedAmount: number | null;
        isActive: boolean;
    }>;
    summary: {
        totalStrategies: number;
        activeStrategies: number;
        strategiesWithAllocation: number;
    };
}

// --- Input/DTO Types (For API Requests - Mirroring Backend DTOs) ---
// These interfaces define the shape of data sent TO the backend API.

/** Data needed to create/define a Condition (used within CreateBlockDto or separate endpoint) */
export interface ConditionInputDto {
    indicatorType: string;
    dataSource?: string;
    dataKey?: string;
    symbol?: string;
    interval?: TimeInterval; // Use TimeInterval enum
    parameters: Record<string, any>; // e.g., { period: 14 }
    operator: Operator;
    targetValue?: number;
    targetIndicatorId?: string;
}

/** Data needed to create/define an Action (used within CreateBlockDto or separate endpoint) */
export interface ActionInputDto {
    actionType: ActionType;
    parameters: Record<string, any>; // Should align with ActionBlockParameters structure for the type
    order?: number;
}

/** Data needed to create a new Strategy Block */
export interface CreateBlockDto {
    blockType: StrategyBlockType;
    /**
     * Generic JSON object. The frontend component is responsible for ensuring
     * this object's structure matches the specific parameter interface
     * (e.g., WeightBlockParameters) for the given blockType before sending.
     * Backend should validate the received structure.
     */
    parameters: Record<string, any>;
    parentId?: string | null;
    order?: number;
    /** Optional: If creating a linked Condition simultaneously */
    conditionDetails?: ConditionInputDto;
    /** Optional: If creating a linked Action simultaneously */
    actionDetails?: ActionInputDto;
}

/** Data needed to update an existing Strategy Block */
export interface UpdateBlockDto {
    /**
     * Generic JSON object for updating parameters. Frontend ensures structure
     * matches the specific type for the block being updated.
     * Only fields to be changed need to be included (partial update).
     */
    parameters?: Record<string, any>;
    /** Update parent relationship (can be set to null) */
    parentId?: string | null;
    /** Update execution/display order */
    order?: number;
    // Potential future: update linked condition/action details via block endpoint
    // conditionDetails?: Partial<ConditionInputDto>;
    // actionDetails?: Partial<ActionInputDto>;
}

/** Data needed to create a new Strategy */
export interface CreateStrategyDto {
    userId: string;
    name: string;
    description?: string;
}

/** Data needed to update Strategy metadata */
export interface UpdateStrategyDto {
    name?: string;
    description?: string;
    isActive?: boolean;
    allocatedAmount?: number; // Amount to allocate to this strategy
    tradingFrequency?: string | null; // Example if you want to update this
}

export interface FredEndpointInfo {
    path: string;        // e.g., "/api/fred/gdp"
    method: 'get';       // Assuming always GET for discovery
    description: string; // e.g., "Gross Domestic Product (GDP)"
    fredSeriesId: string;// e.g., "GDP"
    tags: string[];      // e.g., ["gdp", "national accounts"]
}

export interface FredDataPoint {
    date: string;       // e.g., "2023-01-01"
    value: string | number;      // FRED often returns values as strings, but we may convert to numbers
}

// Type for metadata used within the detail page component
export interface IndicatorMetadata extends FredEndpointInfo {
    // We can reuse FredEndpointInfo directly or extend/map it
    // Add any frontend-specific fields if needed
    name?: string; // Maybe use description as name?
}