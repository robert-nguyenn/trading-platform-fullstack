// This code defines a function to retrieve active technical indicators from a database using Prisma.
// It queries for conditions associated with active strategies, ensuring uniqueness by distinct fields.
// The function returns a list of unique technical indicators, each represented by a specific set of attributes.

import { PrismaClient, Prisma} from '@prisma/client';

const prisma = new PrismaClient();

export interface ActiveIndicator {
    // function: string;
    indicatorType: string;
    symbol?: string | null; // optional for macro
    interval?: string | null; // optional for macro
    parameters: Record<string, any>; // Prisma stores Json as object
    dataSource?: string | null; 
    dataKey?: string | null;
}

export const getTechnicalActiveIndicators = async (): Promise<ActiveIndicator[]> => {
    const activeConditions = await prisma.condition.findMany({
        where: {
            // Ensure the condition is actually used in an active strategy's block tree
            strategyBlocks: {
                some: { // Check if this condition is linked to AT LEAST ONE block...
                    strategy: { // ...where that block's strategy...
                        isActive: true, // ...is active.
                    },
                },
            },
            // Add filters for specific indicator types if needed, e.g.,
            // NOT: { indicatorType: 'STOCK_PRICE' } // if stock price isn't fetched this way
        },
        select: {
            indicatorType: true,
            symbol: true,
            interval: true,
            parameters: true,
            dataSource: true, // Include new fields if needed by caching/fetching
            dataKey: true,
        },
        // Distinct based on the unique properties of the data source needed
        distinct: ['indicatorType', 'symbol', 'interval', 'parameters', 'dataSource', 'dataKey'],
    });

    // Post-fetch filtering for robustness (especially with JSON parameters)
    const uniqueIndicators = new Map<string, ActiveIndicator>();
    for (const cond of activeConditions) {
        // Ensure parameters is a valid object for key generation and storage
        const parametersObject = (typeof cond.parameters === 'object' && cond.parameters !== null && !Array.isArray(cond.parameters))
            ? cond.parameters as Record<string, any>
            : {}; // Default to empty object if not a valid object

        // Generate a stable key including sorted parameters
        // Reuse generateCacheKey logic indirectly by providing the necessary fields
        const keyParamsForKey = {
             indicatorType: cond.indicatorType,
             symbol: cond.symbol,
             interval: cond.interval,
             parameters: parametersObject, // Use the validated/defaulted object
             dataSource: cond.dataSource,
             // dataKey: cond.dataKey // Decide if dataKey should be part of uniqueness
         };
         // We need a function similar to generateCacheKey here, or adapt generateCacheKey
         // Let's create a simple stable key generator here for demonstration:
         const sortedParamKeys = Object.keys(parametersObject).sort();
         const paramString = sortedParamKeys.map(k => `${k}:${parametersObject[k]}`).join(',');
         const key = `${cond.indicatorType}|${cond.dataSource || 'DEF_SOURCE'}|${cond.symbol || 'NO_SYM'}|${cond.interval || 'NO_INT'}|params:{${paramString}}`; // Example key

        if (!uniqueIndicators.has(key)) {
            // Validate required fields based on type if necessary
            // Example: Technical indicators might require symbol & interval
            if ((cond.dataSource === 'AlphaVantage' || !cond.dataSource) && (!cond.symbol || !cond.interval)) {
                 console.warn(`Skipping indicator due to missing symbol/interval for potential technical indicator:`, cond);
                 continue;
            }

            uniqueIndicators.set(key, {
                indicatorType: cond.indicatorType,
                symbol: cond.symbol,
                interval: cond.interval,
                parameters: parametersObject, // Store the validated/defaulted object
                dataSource: cond.dataSource,
                dataKey: cond.dataKey,
            });
        }
    }

    return Array.from(uniqueIndicators.values());
};