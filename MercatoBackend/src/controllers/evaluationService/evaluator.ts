// src/controllers/evaluationService/evaluator.ts
import {
    PrismaClient, Operator, Condition, StrategyBlock, Action, ActionType, StrategyBlockType, Prisma // Added Prisma for types
} from '@prisma/client';
import { getCachedIndicatorEntry, generateCacheKey } from '../technicalIndicators/cache';
import { publishActionRequired } from '../scheduler/redisStream';
import {
    IndicatorUpdatePayload, ActionRequiredPayload, StrategyBlockWithNestedDetails // Import types
} from '../strategyAPI/strategyApiTypes'; // Assuming this path is correct
import { getRedisClient } from '../../utils/redisClient'; // Import Redis client getter

const prisma = new PrismaClient();

// --- Helper Functions (getLatestIndicatorValue, getPreviousIndicatorValue) ---
// (Keep these as they were in your provided code)
const getLatestIndicatorValue = (indicatorData: any): number | null => {
    if (!indicatorData || typeof indicatorData !== 'object') return null;
    const dates = Object.keys(indicatorData).sort().reverse();
    if (dates.length === 0) return null;
    const latestDateData = indicatorData[dates[0]];
    if (typeof latestDateData !== 'object' || latestDateData === null) return null;
    const valueKey = Object.keys(latestDateData).find(k => !isNaN(parseFloat(latestDateData[k])));
    return valueKey && !isNaN(parseFloat(latestDateData[valueKey])) ? parseFloat(latestDateData[valueKey]) : null;
};

const getPreviousIndicatorValue = (indicatorData: any): number | null => {
    if (!indicatorData || typeof indicatorData !== 'object') return null;
    const dates = Object.keys(indicatorData).sort().reverse();
    if (dates.length < 2) return null;
    const previousDateData = indicatorData[dates[1]];
    if (typeof previousDateData !== 'object' || previousDateData === null) return null;
    const valueKey = Object.keys(previousDateData).find(k => !isNaN(parseFloat(previousDateData[k])));
    return valueKey && !isNaN(parseFloat(previousDateData[valueKey])) ? parseFloat(previousDateData[valueKey]) : null;
};


// Type for the evaluation context passed down the recursion
interface EvaluationContext {
    strategyId: string;
    userId: string; // Assuming userId is available on strategy
    // accountId removed - not on Strategy model
    triggeringIndicator: IndicatorUpdatePayload; // The update that started this evaluation
    indicatorValues: Map<string, { latest: number | null; previous: number | null }>; // Pre-fetched values keyed by cacheKey
    actionsTriggered: Set<string>; // Keep track of actions already triggered in this run
}

// --- Action Throttling ---
// (Keep getActionThrottleKey and checkActionThrottle as they were)
const ACTION_THROTTLE_PREFIX = 'actionThrottle:';
const getActionThrottleKey = (strategyId: string, actionId: string): string =>
    `${ACTION_THROTTLE_PREFIX}${strategyId}:${actionId}`;

const checkActionThrottle = async (strategyId: string, actionId: string, cooldownSeconds: number): Promise<boolean> => {
    const redisClient = getRedisClient();
    const throttleKey = getActionThrottleKey(strategyId, actionId);
    const lastTriggered = await redisClient.get(throttleKey);

    if (lastTriggered) {
        // console.log(`   Action ${actionId} for strategy ${strategyId} was triggered recently. Throttled.`);
        return false; // Action is throttled
    }
    await redisClient.set(throttleKey, new Date().toISOString(), { EX: cooldownSeconds });
    // console.log(`   Action ${actionId} for strategy ${strategyId} allowed. Setting throttle for ${cooldownSeconds}s.`);
    return true; // Action allowed
};


// --- Condition Evaluation ---
const evaluateSingleConditionLogic = async (
    condition: Condition, // Use Prisma's Condition type
    context: EvaluationContext
): Promise<boolean> => {
    // Generate cache key for the *left* operand's indicator
    const leftCacheKeyParams = {
        indicatorType: condition.indicatorType,
        symbol: condition.symbol || '', // Provide a default empty string if symbol is null
        interval: condition.interval || '', // Provide a default empty string if interval is null
        parameters: condition.parameters || {}, // Use Prisma.JsonNull for empty/null JSON
        dataSource: condition.dataSource || '', // Provide a default empty string if dataSource is null
    };
    const leftCacheKey = generateCacheKey(leftCacheKeyParams);
    const leftValues = context.indicatorValues.get(leftCacheKey);

    if (!leftValues || leftValues.latest === null) {
        console.warn(`   Cond ${condition.id}: Left operand data missing/null (${leftCacheKey}). Eval fails.`);
        return false;
    }
    const leftCurrentValue = leftValues.latest;
    const leftPreviousValue = leftValues.previous;

    let targetValue: number | null = null;
    let targetPreviousValue: number | null = null; // Needed for cross comparisons

    // Determine the target (right operand)
    if (condition.targetIndicatorId) {
         // Fetch target condition details (requires an async call here)
        const targetCondition = await prisma.condition.findUnique({
             where: { id: condition.targetIndicatorId },
             // Select fields needed for cache key generation
             select: { indicatorType: true, symbol: true, interval: true, parameters: true, dataSource: true }
        });

        if (!targetCondition) {
            console.warn(`   Cond ${condition.id}: Target indicator condition ${condition.targetIndicatorId} not found. Eval fails.`);
            return false;
        }
        const targetCacheKeyParams = {
            indicatorType: targetCondition.indicatorType,
            symbol: targetCondition.symbol || '',
            interval: targetCondition.interval || '',
            parameters: targetCondition.parameters || {},
            dataSource: targetCondition.dataSource || '',
        };
        const targetCacheKey = generateCacheKey(targetCacheKeyParams);
        const targetValues = context.indicatorValues.get(targetCacheKey);

        if (!targetValues || targetValues.latest === null) {
            console.warn(`   Cond ${condition.id}: Target operand data missing/null (${targetCacheKey}). Eval fails.`);
            return false;
        }
        targetValue = targetValues.latest;
        targetPreviousValue = targetValues.previous;

    } else if (condition.targetValue !== null && condition.targetValue !== undefined) {
        targetValue = condition.targetValue;
        targetPreviousValue = targetValue; // Previous is same as current for static value
    } else {
        console.warn(`   Cond ${condition.id}: Has neither targetValue nor targetIndicatorId. Eval fails.`);
        return false;
    }

    // Perform the comparison
    const operator = condition.operator;
    // console.log(`   Eval Cond ${condition.id}: [${leftCacheKey}] ${leftCurrentValue} (Prev: ${leftPreviousValue ?? 'N/A'}) ${operator} Target: ${targetValue} (Prev Target: ${targetPreviousValue ?? 'N/A'})`);

    switch (operator) {
        case Operator.GREATER_THAN:          return leftCurrentValue > targetValue;
        case Operator.LESS_THAN:             return leftCurrentValue < targetValue;
        case Operator.EQUALS:                return Math.abs(leftCurrentValue - targetValue) < 0.0001; // Epsilon
        case Operator.NOT_EQUALS:            return Math.abs(leftCurrentValue - targetValue) >= 0.0001;
        case Operator.GREATER_THAN_OR_EQUAL: return leftCurrentValue >= targetValue;
        case Operator.LESS_THAN_OR_EQUAL:    return leftCurrentValue <= targetValue;
        case Operator.CROSSES_ABOVE:
            if (leftPreviousValue === null || targetPreviousValue === null) return false; // Cannot determine cross
            return leftPreviousValue <= targetPreviousValue && leftCurrentValue > targetValue;
        case Operator.CROSSES_BELOW:
            if (leftPreviousValue === null || targetPreviousValue === null) return false; // Cannot determine cross
            return leftPreviousValue >= targetPreviousValue && leftCurrentValue < targetValue;
        default:
            console.warn(`   Unsupported operator: ${operator} in condition ${condition.id}`);
            return false;
    }
};

// --- Recursive Block Evaluation ---
async function evaluateBlockRecursively(
    block: StrategyBlockWithNestedDetails, // Use the defined recursive type
    context: EvaluationContext
): Promise<boolean> { // Returns true if evaluation led to an action trigger, false otherwise

    // console.log(`  -> Evaluating Block ${block.id} (Type: ${block.blockType})`); // Verbose
    let actionTriggeredDownPath = false; // Track if any action was triggered *from this block or its descendants*

    switch (block.blockType) {
        case StrategyBlockType.ROOT:
        case StrategyBlockType.GROUP:
            // Assuming GROUP implies AND logic unless specified otherwise in parameters
            const isOrLogic = (block.parameters as Record<string, any>)?.logic === 'OR';
            let groupOutcome = isOrLogic ? false : true; // Start appropriately for AND/OR

            const sortedChildren = block.children.sort((a, b) => a.order - b.order);
            for (const child of sortedChildren) {
                 // Ensure child is correctly typed for recursion
                const childActionResult = await evaluateBlockRecursively(child as StrategyBlockWithNestedDetails, context);
                actionTriggeredDownPath = actionTriggeredDownPath || childActionResult; // Accumulate if any action triggered

                 // Logic for group success based on child *evaluation* result (if needed)
                 // This part is complex and depends on what a 'successful' evaluation means for non-action blocks
                 // For now, we focus on whether actions were triggered. Let's assume group always "succeeds" in evaluation
                 // unless a child explicitly needs to block (e.g., a failing filter)
            }
            // return groupOutcome; // Return based on AND/OR logic if needed
            return actionTriggeredDownPath; // Return true if any descendant triggered an action

        case StrategyBlockType.CONDITION_IF:
            if (!block.conditionId || !block.condition) {
                console.warn(`   Block ${block.id}: CONDITION_IF type but no condition linked. Skipping.`);
                return false; // Cannot evaluate, no action triggered from here
            }
            const conditionMet = await evaluateSingleConditionLogic(block.condition, context);
            console.log(`   Block ${block.id}: Condition ${block.conditionId} Result: ${conditionMet}`);

            let branchChildren = [];
            if (conditionMet) {
                branchChildren = block.children.sort((a, b) => a.order - b.order);
            } else {
                branchChildren = block.children
                    .filter(c => c.order === 1)
                    .sort((a, b) => a.order - b.order);
            }

            if (branchChildren.length > 0) {
                 // console.log(`   Block ${block.id}: Evaluating ${conditionMet ? 'THEN' : 'ELSE'} branch (${branchChildren.length} children)`);
                 for (const child of branchChildren) {
                     const childActionResult = await evaluateBlockRecursively(child as StrategyBlockWithNestedDetails, context);
                     actionTriggeredDownPath = actionTriggeredDownPath || childActionResult; // Accumulate results
                 }
            } else {
                // console.log(`   Block ${block.id}: No children found for ${conditionMet ? 'THEN' : 'ELSE'} branch.`);
            }
            return actionTriggeredDownPath; // Return true if any action triggered in the executed branch

        case StrategyBlockType.ACTION:
            if (!block.actionId || !block.action) {
                console.warn(`   Block ${block.id}: ACTION type but no action linked. Skipping.`);
                return false; // No action to perform
            }

            // --- Action Throttling Check ---
             let cooldownSeconds = 60 * 5; // Default 5 mins
             const triggerInterval = context.triggeringIndicator.interval;
             if (triggerInterval === 'daily') cooldownSeconds = 60 * 60 * 23; // ~23 hours
             else if (triggerInterval === 'weekly') cooldownSeconds = 60 * 60 * 24 * 6; // ~6 days
             else if (triggerInterval === 'monthly') cooldownSeconds = 60 * 60 * 24 * 27; // ~27 days
             else if (triggerInterval && ['1min', '5min', '15min', '30min', '60min'].includes(triggerInterval)) {
                  const intervalMins = parseInt(triggerInterval.replace('min', ''), 10);
                  if (!isNaN(intervalMins)) cooldownSeconds = Math.max(60, intervalMins * 60 * 2); // Ensure at least 1 min
             }

            const isAllowed = await checkActionThrottle(context.strategyId, block.actionId, cooldownSeconds);

            if (isAllowed && !context.actionsTriggered.has(block.actionId)) {
                 const actionPayload: ActionRequiredPayload = {
                     actionId: block.actionId,
                     actionType: block.action.actionType,
                     parameters: typeof block.action.parameters === 'object' && block.action.parameters !== null
                                    ? block.action.parameters as Record<string, any>
                                    : {}, // Handle null JSON
                     strategyId: context.strategyId,
                     userId: context.userId, // Pass userId from context
                     // accountId removed
                     triggeringIndicator: context.triggeringIndicator,
                 };
                 await publishActionRequired(actionPayload);
                 context.actionsTriggered.add(block.actionId);
                 console.log(`   Block ${block.id}: Action ${block.actionId} (${actionPayload.actionType}) published.`);
                 return true; // Signal that an action was triggered
            } else if (context.actionsTriggered.has(block.actionId)) {
                // console.log(`   Block ${block.id}: Action ${block.actionId} already triggered in this evaluation run. Skipping.`);
                return false; // Already triggered in this specific run
            } else {
                 // console.log(`   Block ${block.id}: Action ${block.actionId} throttled. Skipping.`);
                 return false; // Throttled
            }

        // --- Add cases for other block types (FILTER, WEIGHT, ASSET) ---
        case StrategyBlockType.FILTER:
        case StrategyBlockType.WEIGHT:
        case StrategyBlockType.ASSET:
             console.warn(`   Block ${block.id}: Evaluation logic for type ${block.blockType} not yet implemented. Passing through.`);
             // Default: evaluate children as if AND group
             let passThroughResult = false;
             const sortedPassThroughChildren = block.children.sort((a, b) => a.order - b.order);
             for (const child of sortedPassThroughChildren) {
                 const childResult = await evaluateBlockRecursively(child as StrategyBlockWithNestedDetails, context);
                 passThroughResult = passThroughResult || childResult; // Track triggered actions
             }
             return passThroughResult;

        default:
            console.warn(`   Block ${block.id}: Unknown block type ${block.blockType}. Skipping.`);
            return false; // No action triggered
    }
}


// --- Main Evaluation Entry Point ---
export const evaluateStrategiesTriggeredByIndicator = async (indicatorUpdatePayload: IndicatorUpdatePayload) => {
    const {
        cacheKey: updatedCacheKey,
        indicatorType,
        symbol,
        interval,
        parameters: updatedCalcParams, // This is the calculation parameters object
        dataSource,
        // dataKey, // Not directly used in initial condition matching
    } = indicatorUpdatePayload;

    // console.log(`\n--- Evaluating Strategies Triggered By: ${updatedCacheKey} ---`);

    // 1. Find conditions matching the updated indicator profile EXACTLY
    //    This query now accurately matches the incoming update payload structure.
    const matchingConditions = await prisma.condition.findMany({
        where: {
            indicatorType: indicatorType,
            symbol: symbol,
            interval: interval,
            dataSource: dataSource,
            parameters: { equals: updatedCalcParams || Prisma.JsonNull }, // Use the parameters from the payload
            // Ensure linked to an active strategy
            strategyBlocks: {
                some: {
                    strategy: {
                        isActive: true,
                    },
                },
            },
        },
        // Select the strategy details needed for evaluation context
        select: {
            id: true, // Condition ID
            strategyBlocks: {
                select: {
                    strategyId: true,
                    strategy: {
                        select: {
                            id: true,
                            userId: true,
                            isActive: true, // Keep checking isActive
                            // NO accountId here
                        }
                    }
                }
            }
        }
    });


    if (matchingConditions.length === 0) {
        console.log(`No active strategy conditions found matching the exact profile: ${updatedCacheKey}`);
        return;
    }

    // 2. Collect unique active strategy IDs to evaluate
    const strategiesToEvaluate = new Map<string, { userId: string }>(); // Map strategyId -> {userId}
    for (const condition of matchingConditions) {
        for (const block of condition.strategyBlocks) {
             // Ensure strategy exists and is active before adding
            if (block.strategy?.isActive && !strategiesToEvaluate.has(block.strategyId)) {
                 strategiesToEvaluate.set(block.strategyId, {
                      userId: block.strategy.userId,
                 });
                 // console.log(`Strategy ${block.strategyId} queued for evaluation triggered by condition ${condition.id}`);
            }
        }
    }


    if (strategiesToEvaluate.size === 0) {
        console.log(`No unique active strategies identified for evaluation based on conditions matching ${updatedCacheKey}.`);
        return;
    }
    console.log(`Found ${strategiesToEvaluate.size} strategies to evaluate triggered by ${updatedCacheKey}`);

    // 3. Evaluate each identified strategy
    for (const [strategyId, strategyMeta] of strategiesToEvaluate.entries()) {
        console.log(`\n---> Evaluating Strategy ID: ${strategyId} (User: ${strategyMeta.userId})`);
        try {
            // Fetch the entire block tree with necessary includes
            // Define the recursive include structure needed for the evaluator
            const blockIncludeRecursive: Prisma.StrategyBlockInclude = {
                 condition: true, // Include condition linked at this level
                 action: true,    // Include action linked at this level
                 children: {      // Recursively include children
                     orderBy: { order: 'asc' },
                     include: { // What to include for each child
                         condition: true,
                         action: true,
                         children: { // Go deeper...
                             orderBy: { order: 'asc' },
                             include: {
                                 condition: true,
                                 action: true,
                                 children: { // Even deeper... adjust depth as necessary
                                     orderBy: { order: 'asc' },
                                     include: {
                                         condition: true,
                                         action: true,
                                         // children: true // Prisma doesn't easily support infinite recursion here in type generation
                                         // Need to explicitly define depth or handle loading dynamically if needed
                                     }
                                 }
                             }
                         }
                     }
                 }
            };

             const strategyData = await prisma.strategy.findUnique({
                  where: { id: strategyId },
                  include: {
                      rootBlock: { // Start fetching from the root
                          include: blockIncludeRecursive // Apply the recursive include
                      }
                  }
             });

            if (!strategyData || !strategyData.rootBlock) {
                console.warn(`   Strategy ${strategyId} not found or has no root block. Skipping.`);
                continue;
            }

            // --- Important Type Casting ---
            // Cast the fetched rootBlock to the type expected by the recursive function
            // This assumes your StrategyBlockWithNestedDetails is defined correctly to match the include structure
            const rootBlock = strategyData.rootBlock as unknown as StrategyBlockWithNestedDetails;

            // Pre-fetch all required indicator data for this strategy's conditions
            const requiredIndicatorKeys = new Set<string>();
            await collectRequiredIndicatorKeys(rootBlock, requiredIndicatorKeys); // Make async to handle target fetches

            const indicatorValues = new Map<string, { latest: number | null; previous: number | null }>();
            console.log(`   Pre-fetching data for ${requiredIndicatorKeys.size} unique indicators needed by strategy ${strategyId}...`);
            for (const cacheKey of requiredIndicatorKeys) {
                 // console.log(`     Fetching/Checking cache for: ${cacheKey}`); // Verbose log
                 const cachedEntry = await getCachedIndicatorEntry<any>(cacheKey);
                 const latest = cachedEntry?.data ? getLatestIndicatorValue(cachedEntry.data) : null;
                 const previous = cachedEntry?.data ? getPreviousIndicatorValue(cachedEntry.data) : null;
                 indicatorValues.set(cacheKey, { latest, previous });
                 if (latest === null) {
                     console.warn(`     Data missing or unparsable for required indicator ${cacheKey}. Evaluation might fail.`);
                 }
            }
            console.log(`   Finished pre-fetching data.`);


            // Create evaluation context
            const context: EvaluationContext = {
                strategyId: strategyId,
                userId: strategyMeta.userId,
                // accountId removed
                triggeringIndicator: indicatorUpdatePayload,
                indicatorValues: indicatorValues,
                actionsTriggered: new Set<string>(), // Reset for each strategy evaluation run
            };

            // Start recursive evaluation from the root
            await evaluateBlockRecursively(rootBlock, context);
            console.log(`<--- Finished Evaluation for Strategy ID: ${strategyId}. Actions Triggered This Run: ${context.actionsTriggered.size}`);

        } catch (error) {
            console.error(`   Error evaluating strategy ${strategyId}:`, error);
            // Continue to the next strategy
        }
    } // End loop through strategies
};

// Helper function to recursively find all condition cache keys needed
async function collectRequiredIndicatorKeys(block: StrategyBlockWithNestedDetails | null, keys: Set<string>): Promise<void> {
    if (!block) return;

    if (block.condition) {
         const condition = block.condition;
         // Key for the primary (left) indicator
         const primaryCacheKeyParams = {
            indicatorType: condition.indicatorType,
            symbol: condition.symbol || '',
            interval: condition.interval || '',
            parameters: condition.parameters || {},
            dataSource: condition.dataSource || '',
         };
         keys.add(generateCacheKey(primaryCacheKeyParams));

         // If it compares against another indicator, get its key too
         if (condition.targetIndicatorId) {
             // Fetch the target condition details to generate its key accurately
             const targetCondition = await prisma.condition.findUnique({
                 where: { id: condition.targetIndicatorId },
                 select: { indicatorType: true, symbol: true, interval: true, parameters: true, dataSource: true }
             });
             if (targetCondition) {
                  const targetCacheKeyParams = {
                     indicatorType: targetCondition.indicatorType,
                     symbol: targetCondition.symbol || '',
                     interval: targetCondition.interval || '',
                     parameters: targetCondition.parameters || {},
                     dataSource: targetCondition.dataSource || '',
                  };
                 keys.add(generateCacheKey(targetCacheKeyParams));
             } else {
                 console.warn(`Could not find target condition ${condition.targetIndicatorId} while collecting keys.`);
             }
         }
    }

    // Recurse through children (making the recursive call await)
    if (block.children && block.children.length > 0) {
        for (const child of block.children) {
            await collectRequiredIndicatorKeys(child as unknown as StrategyBlockWithNestedDetails, keys);
        }
    }
}