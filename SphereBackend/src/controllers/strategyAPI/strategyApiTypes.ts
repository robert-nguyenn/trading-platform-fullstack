// src/types/strategyApiTypes.ts
import { StrategyBlockType, Operator, ActionType, Prisma } from '@prisma/client';

// --- Input DTOs (Data Transfer Objects) ---

export interface CreateStrategyDto {
  userId: string;
  name: string;
  description?: string;
  // Add any additional fields if needed
}

export interface UpdateStrategyDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  allocatedAmount?: number;
  // Add any additional fields if needed
}

// Input for creating a Condition record *when creating a block*
export interface ConditionInputDto {
  indicatorType: string;
  dataSource?: string;
  dataKey?: string;
  symbol?: string; // Ticker
  interval?: string;
  parameters: Prisma.InputJsonValue; // Use Prisma's type for JSON
  operator: Operator;
  targetValue?: number;
  targetIndicatorId?: string; // For comparing against another condition's output
}

// Input for creating an Action record *when creating a block*
export interface ActionInputDto {
  actionType: ActionType;
  parameters: Prisma.InputJsonValue; // Use Prisma's type for JSON
  order?: number;
}

export interface CreateBlockDto {
  blockType: StrategyBlockType;
  parameters: Prisma.InputJsonValue; // Use Prisma's type for JSON
  parentId?: string | null; // Can be null for root, or ID of parent
  order?: number;
  conditionDetails?: ConditionInputDto;
  actionDetails?: ActionInputDto;
  // Ensure these match the controller's expectations
}

export interface UpdateBlockDto {
  parameters?: Prisma.InputJsonValue;
  parentId?: string | null; // Allow moving the block
  order?: number;
  // Add logic if you want to allow updating the linked Condition/Action details
  conditionDetails?: Partial<ConditionInputDto>; // Example for partial updates
  actionDetails?: Partial<ActionInputDto>;
}

// --- Output DTOs (Potentially useful, but often Prisma types are fine) ---
// You might define specific output types if you want to reshape the data
// coming from Prisma before sending it in the response. For now, we'll
// mostly rely on Prisma's generated types for responses.

// Example: Type for returning the block tree structure
// export interface StrategyBlockWithChildren extends Prisma.StrategyBlockGetPayload<{
//   include: { children: true, condition: true, action: true } // Example include
// }> {
//   children: StrategyBlockWithChildren[]; // Recursive type
// }

export interface StrategyBlockWithNestedDetails extends Prisma.StrategyBlockGetPayload<{
  include: {
    condition: true;
    action: true;
    children: true;
  }
}> {
  children: StrategyBlockWithNestedDetails[];
}


export type TechnicalIndicatorOperand = {
  kind: 'TECHNICAL_INDICATOR';
  symbol: string;
  interval: string;
  parameters: {
    series_type?: string;
    time_period?: number;
    // indicatorType: string;
  };
  indicatorType: string;
  dataSource?: string;
  dataKey?: string;
};

export type MacroEconomicOperand = {
  kind: 'MACRO_INDICATOR';
  indicatorType: string; 
  parameters: {
    units?: string; // e.g., 'lin', 'chg'
    frequency?: string; // e.g., 'q', 'm'
    aggregation_method?: string; // e.g., 'avg'
    // Add other relevant FRED observation parameters if needed
  };
  dataSource?: string; // Optional: Defaults to FRED if not provided
  dataKey?: string;    // Optional: Set to the indicatorType (FRED series ID)
};

export type ValueOperand = {
  kind: 'VALUE';
  value: number;
};

export type Operand = TechnicalIndicatorOperand | ValueOperand | MacroEconomicOperand;

// export type ParametersType = {
//   name: string;
//   operator: string;
//   leftOperand: TechnicalIndicatorOperand; // Always a technical indicator per the example
//   rightOperand: Operand; // Can be technical indicator or value
// };

export type ConditionIfBlockParameters = {
  name: string;       // User-friendly name for the condition rule
  operator: string;   // The comparison operator (e.g., '>', '<', 'CROSSES_ABOVE')
  leftOperand: Operand;  // The left side of the comparison
  rightOperand: Operand; // The right side of the comparison
};

export interface ActionBlockParameters {
  actionType: keyof typeof ActionType; // Expects the string name of the enum key (e.g., "BUY", "LOG_MESSAGE")
  // Other parameters specific to the action type will be here
  // Example for BUY/SELL:
  symbol?: string;
  quantity?: number;
  notional?: number; // For notional orders
  orderType?: 'Market' | 'Limit' | 'Stop' | 'StopLimit'; // Example order types
  timeInForce?: 'Day' | 'GTC' | 'IOC' | 'FOK'; // Example TIF
  limitPrice?: number;
  stopPrice?: number;
  // Example for LOG_MESSAGE:
  message?: string;
  // Example for NOTIFY:
  // notificationType?: 'email' | 'sms' | 'push';
  // recipient?: string; // e.g., user ID or specific address
  // ... add other potential parameters for different action types
  [key: string]: any; // Allow flexible parameters
}

// Type guard to check if an object matches the ActionBlockParameters structure


// Updated Type Guard for the new structure
export function isConditionIfBlockParameters(parameters: any): parameters is ConditionIfBlockParameters {
  return (
    typeof parameters === 'object' &&
    parameters !== null &&
    typeof parameters.name === 'string' &&
    typeof parameters.operator === 'string' &&
    typeof parameters.leftOperand === 'object' && parameters.leftOperand !== null && typeof parameters.leftOperand.kind === 'string' &&
    typeof parameters.rightOperand === 'object' && parameters.rightOperand !== null && typeof parameters.rightOperand.kind === 'string'
  );
}

export function isActionBlockParameters(parameters: any): parameters is ActionBlockParameters {
  return (
    typeof parameters === 'object' &&
    parameters !== null &&
    typeof parameters.actionType === 'string' &&
    Object.keys(ActionType).includes(parameters.actionType) // Check if it's a valid ActionType key
  );
}

// --- Payload for Indicator Update Stream ---
// Reflects the simplified parameters structure
export interface IndicatorUpdatePayload {
    cacheKey: string;       // Unique key used for caching this specific indicator
    indicatorType: string;  // e.g., 'SMA', 'GDP'
    symbol?: string;        // Stock/crypto symbol (optional for macro)
    interval?: string;      // e.g., '1min', 'daily' (optional for some macro)
    dataSource?: string;    // Source ('AlphaVantage', 'FRED')
    dataKey?: string;       // Specific data key (e.g., 'close', 'GDP', 'UNRATE')
    // Only calculation parameters included here
    parameters: Record<string, any>;
    lastRefreshed?: string; // Timestamp from the source (e.g., AlphaVantage metadata)
    fetchTime: string;      // Timestamp when our system fetched it
}

// --- Payload for Action Required Stream ---
export interface ActionRequiredPayload {
    actionId: string;
    actionType: ActionType;
    parameters: Record<string, any>; // Params specific to the action (e.g., qty, message)
    strategyId: string;
    userId: string; // Added userId
    // accountId?: string; // Added optional accountId if needed for broker actions
    triggeringIndicator: Record<string, any>; // Context: which indicator update triggered this
}