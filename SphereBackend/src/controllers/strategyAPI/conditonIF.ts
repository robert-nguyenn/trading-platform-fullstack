import { Prisma, StrategyBlock, Condition, Operator, Action, ActionType } from '@prisma/client';
import {
    ConditionIfBlockParameters, // Use the specific type for the block's parameters
    ConditionInputDto,
    Operand,
    ValueOperand,
    TechnicalIndicatorOperand,
    MacroEconomicOperand
} from "./strategyApiTypes";
import prisma from '../../utils/prisma/prisma';

// Map string operator to enum value
const mapToOperatorEnum = (operator: string): Operator => {
    const operatorMapping: Record<string, Operator> = {
        '=': 'EQUALS', // Simplified UI examples
        '!=': 'NOT_EQUALS',
        '>': 'GREATER_THAN',
        '<': 'LESS_THAN',
        '>=': 'GREATER_THAN_OR_EQUAL',
        '<=': 'LESS_THAN_OR_EQUAL',
        'CROSSES_ABOVE': 'CROSSES_ABOVE',
        'CROSSES_BELOW': 'CROSSES_BELOW',
        // Keep original mapping for backward compatibility or more descriptive UI options
        '= (Equals)': 'EQUALS',
        '≠ (Not Equals)': 'NOT_EQUALS',
        '> (Greater Than)': 'GREATER_THAN',
        '< (Less Than)': 'LESS_THAN',
        '≥ (Greater Than or Equal)': 'GREATER_THAN_OR_EQUAL',
        '≤ (Less Than or Equal)': 'LESS_THAN_OR_EQUAL',
        '↗ (Crosses Above)': 'CROSSES_ABOVE',
        '↘ (Crosses Below)': 'CROSSES_BELOW',
    };
    const mappedOperator = operatorMapping[operator];
    if (!mappedOperator) {
      throw new Error(`Invalid operator: ${operator}`);
    }
    return mappedOperator;
};

// Determines if a given operand requires the creation of a separate condition record.
const requiresConditionRecord = (operand: Operand): boolean => {
    switch (operand.kind) {
        case 'TECHNICAL_INDICATOR':
        case 'MACRO_INDICATOR':
            // case 'GEOPOLITICAL': // If added
            return true;
        case 'VALUE':
            return false;
        default:
            // Ensures exhaustive check if new Operand kinds are added
            const _exhaustiveCheck: never = operand;
            throw new Error(`Unsupported operand kind: ${(_exhaustiveCheck as any)?.kind}`);
    }
};

// Updated type guard to allow all supported operand types
export function isParametersType(parameters: any): parameters is ConditionIfBlockParameters {
    return (
      typeof parameters === 'object' &&
      parameters !== null &&
      typeof parameters.name === 'string' &&
      typeof parameters.operator === 'string' &&
      typeof parameters.leftOperand === 'object' &&
      ['TECHNICAL_INDICATOR','MACRO_INDICATOR','VALUE'].includes(parameters.leftOperand.kind) &&
      typeof parameters.rightOperand === 'object' &&
      ['TECHNICAL_INDICATOR','MACRO_INDICATOR','VALUE'].includes(parameters.rightOperand.kind)
    );
}

// Determines if a given operand requires the creation of a separate condition record.
const requiresConditionCreation = (operand: any): boolean => {
    switch (operand.kind) {
        case 'TECHNICAL_INDICATOR':
        case 'MACRO_INDICATOR':
        // case 'GEOPOLITICAL':
            return true;
        case 'VALUE':
            return false;
        default:
            throw new Error(`Unsupported operand kind: ${operand.kind}`);
    }
};

// Updates: Change the type of the 'operator' parameter to Operator instead of string.
const buildConditionInputFromOperand = (
    operand: TechnicalIndicatorOperand | MacroEconomicOperand,
    comparisonOperator: Operator
): Omit<ConditionInputDto, 'targetValue' | 'targetIndicatorId'> => { // Exclude target fields initially
    if (operand.kind === 'TECHNICAL_INDICATOR') {
        return {
            indicatorType: operand.indicatorType, // e.g., SMA
            dataSource: operand.dataSource || 'AlphaVantage',
            dataKey: operand.dataKey || operand.parameters.series_type || 'close', // Default to close if needed
            symbol: operand.symbol,
            interval: operand.interval,
            // Store ONLY calculation parameters
            parameters: operand.parameters || {},
            operator: comparisonOperator, // The operator for the *overall* comparison
        };
    } else if (operand.kind === 'MACRO_INDICATOR') {
        return {
            indicatorType: operand.indicatorType, // e.g., GDP (becomes FRED ID)
            dataSource: operand.dataSource || 'FRED',
            dataKey: operand.dataKey || operand.indicatorType, // Use indicatorType as default dataKey
            symbol: undefined, // No symbol for macro usually
            interval: undefined, // Interval might not apply or is part of params
            // Store ONLY calculation/observation parameters
            parameters: operand.parameters || {},
            operator: comparisonOperator, // The operator for the *overall* comparison
        };
    }
    // Add other kinds like GEOPOLITICAL here if needed
    else {
        // This should ideally not be reached due to requiresConditionRecord check
        throw new Error(`buildConditionInputFromOperand: Unsupported operand kind for condition creation`);
    }
};

// src/controllers/strategyAPI/conditionIF.ts
// ... (keep imports, mapToOperatorEnum, requiresConditionRecord, buildConditionInputFromOperand)

export const createOrUpdateLinkedConditions = async (
    parameters: ConditionIfBlockParameters,
    existingConditionId?: string | null // Pass existing ID if updating the PRIMARY condition
): Promise<string> => {
    const mappedOperator = mapToOperatorEnum(parameters.operator);
    const leftOperand = parameters.leftOperand;
    const rightOperand = parameters.rightOperand;

    let targetConditionId: string | undefined = undefined;
    let targetValue: number | undefined = undefined;

    // --- Determine Target ---
    if (requiresConditionRecord(rightOperand)) {
        // Target is another indicator. **Create** it instead of upserting.
        const targetConditionInput = buildConditionInputFromOperand(
            rightOperand as TechnicalIndicatorOperand | MacroEconomicOperand,
            Operator.EQUALS // Dummy operator, doesn't matter for target definition
        );

        // Create the target condition record
        const newTargetCondition = await prisma.condition.create({
            data: targetConditionInput,
        });
        targetConditionId = newTargetCondition.id;
        console.log(`Created target condition ${newTargetCondition.id} for right operand.`);

    } else if (rightOperand.kind === 'VALUE') {
        targetValue = rightOperand.value;
    } else {
        throw new Error("Invalid right operand state in createOrUpdateLinkedConditions");
    }

    // --- Prepare Primary (Left) Condition Data ---
    if (!requiresConditionRecord(leftOperand)) {
        throw new Error("The left operand must be an Indicator or Macro Economic data point to trigger evaluation.");
    }

    const partialLeftConditionData = buildConditionInputFromOperand(
        leftOperand as TechnicalIndicatorOperand | MacroEconomicOperand,
        mappedOperator // Use the actual comparison operator here
    );
    const fullLeftConditionData = {
        ...partialLeftConditionData,
        targetValue: targetValue,
        targetIndicatorId: targetConditionId, // Link to the newly created target ID if applicable
    };

    // --- Create or Update Primary Condition ---
    let primaryCondition: Condition;
    if (existingConditionId) {
        // Update the existing PRIMARY condition referenced by the StrategyBlock
        console.log(`Updating existing primary condition ${existingConditionId}`);
        primaryCondition = await prisma.condition.update({
            where: { id: existingConditionId },
            data: fullLeftConditionData,
        });
    } else {
        // Create a new PRIMARY condition
        console.log(`Creating new primary condition`);
        // If you wanted to reuse primary conditions, you'd face the same uniqueness issue here.
        // For now, creating a new one for each CONDITION_IF block is standard.
        primaryCondition = await prisma.condition.create({
            data: fullLeftConditionData,
        });
    }

    // console.log(`Upserted primary condition ${primaryCondition.id}`);
    return primaryCondition.id; // Return the ID of the main (left) condition
};