import { getRedisClient, initRedis } from "../../utils/redisClient";
import { PrismaClient, Prisma, ActionType } from '@prisma/client';
import { IndicatorUpdatePayload, ActionRequiredPayload } from "../strategyAPI/strategyApiTypes";

export const STREAM_KEY = 'indicatorUpdates';
export const ACTION_STREAM_KEY = 'actionRequired';


export const publishIndicatorUpdate = async (payload: IndicatorUpdatePayload) => {
    const redisClient = getRedisClient();
    if (!redisClient || !redisClient.isReady) {
         console.error('Redis client not ready. Cannot publish indicator update.');
         // Optionally throw an error or implement retry logic
         return;
     }

    try {
        // Convert payload correctly for Redis Stream (XADD expects field-value pairs)
        const streamData: Record<string, string> = {}; // Explicitly define as string->string map

        for (const [key, value] of Object.entries(payload as Record<string, any>)) {
            if (value === undefined || value === null) {
                // Skip undefined/null values or decide how to handle them
                continue;
            }

            // Serialize objects (like params) to JSON strings
            if (typeof value === 'object') {
                try{
                    streamData[key] = JSON.stringify(value);
                } catch (stringifyError) {
                    console.error(`Error stringifying value for key ${key} in indicator update payload`, value, stringifyError);
                    //handle: skipkey, use placeholder....
                    continue;
                }
            } else {
                streamData[key] = String(value);
            }
        }

        if (Object.keys(streamData).length === 0) {
            console.warn("[Pub] Skipping publish for indicator update because payload resulted in empty stream data: ", payload);
            return;
        }

        // Debug log to see what's being sent
        // console.log("Publishing streamData:", streamData);

        // Use the correctly prepared streamData object
        await redisClient.xAdd(STREAM_KEY, '*', streamData);
        // Log using a property that is guaranteed to be a simple string, like cacheKey
        console.log(`[Pub] Published update to ${STREAM_KEY} for ${payload.cacheKey}`);
    } catch (error) {
        console.error('[Pub Error] Error publishing to Redis Stream:', error);
        // Consider logging the payload that failed (but be careful with sensitive data)
        console.error('[Pub Error] Failed payload #DEV-DEBUG:', payload); // For debugging
    }
};




export const publishActionRequired = async(payload: ActionRequiredPayload) => {
    const redisClient = getRedisClient();
    if (!redisClient || !redisClient.isReady) {
        console.error("Redis client not ready. Cannot publish required action");
        return;
    }

    try {
        const streamData: Record<string, string> = {};

        for (const [key, value] of Object.entries(payload)) {
            if (value === undefined || value === null) continue;

            //Parameters and triggeringIndicator are likely objects
            if (key === "parameters" || key === "triggeringIndicator") {
                try {
                    streamData[key] = JSON.stringify(value);
                } catch (stringifyError) {
                    console.error(`[Pub Err] Error stringifying value for key ${key} in action required payload: `, value, stringifyError)
                    continue; // Skip this key on err
                }
            }
            else {
                console.warn(`[Pub WARN] Expected object for field '${key}' in action payload, got ${typeof value}. Attempting String().`);
                streamData[key] = String(value);
            }
        }

        if (Object.keys(streamData).length === 0) {
            console.warn("[Pub] Skipping publish for action required because payload resulted in empty stream data:", payload);
            return;
        }

        await redisClient.xAdd(ACTION_STREAM_KEY, "*", streamData);
        console.log(`[Pub] Published action required to ${ACTION_STREAM_KEY} for action ${payload.actionId} (strategy ${payload.strategyId})`);
        } catch (error) {
            console.error(`[Pub ERR] Error publishing action required to Redis Stream ${ACTION_STREAM_KEY}:`, error);
            console.error('[Pub ERR] Failing Payload:', JSON.stringify(payload));
    }
}