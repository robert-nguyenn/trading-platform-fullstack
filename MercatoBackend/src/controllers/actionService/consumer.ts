// src/controllers/actionService/consumer.ts
import { getRedisClient } from "../../utils/redisClient";
import { ACTION_STREAM_KEY } from "../scheduler/redisStream"; // Use constant from scheduler
import { ActionRequiredPayload } from '../strategyAPI/strategyApiTypes'; // Import the specific payload type
import { ActionType, PrismaClient } from '@prisma/client'; // Import Prisma types
import axios from 'axios'; // Import axios for direct API calls
import { getBrokerAlpacaAuth, ALPACA_BASE_URL } from '../../utils/authUtils'; // Import auth utils

const prisma = new PrismaClient(); // Instantiate Prisma client

const ACTION_GROUP_NAME = 'action_group';
const ACTION_CONSUMER_NAME = `action_consumer_${process.pid}`;

// setupActionConsumerGroup remains the same...
async function setupActionConsumerGroup() {
    // Keep Redis client acquisition inside setup for robustness
    const redisClient = getRedisClient();
    try {
        await redisClient.xGroupCreate(ACTION_STREAM_KEY, ACTION_GROUP_NAME, '0', { MKSTREAM: true });
        console.log(`[Action Consumer] Consumer group ${ACTION_GROUP_NAME} ensured on stream ${ACTION_STREAM_KEY}`);
    } catch (error: any) {
        if (error.message.includes('BUSYGROUP')) {
            console.log(`[Action Consumer] Consumer group ${ACTION_GROUP_NAME} already exists.`);
        } else {
            console.error('[Action Consumer] Error creating consumer group:', error);
            throw error; // Critical error
        }
    }
}


// --- Action Execution Logic (Updated) ---
async function executeAction(payload: ActionRequiredPayload, tradingId: string) {
    console.log(`[Action Consumer EXEC] Executing Action ID: ${payload.actionId}, Type: ${payload.actionType}, Strategy: ${payload.strategyId}, User: ${payload.userId}, Trading Account: ${tradingId}`);
    const params = payload.parameters || {}; // Ensure params is an object

    // Construct the correct base URL for trading operations
    const tradingApiUrl = `${ALPACA_BASE_URL}/trading/accounts/${tradingId}`; // Use the user's trading ID

    switch (payload.actionType) {
        case ActionType.BUY:
        case ActionType.SELL:
            console.log(` -->[TRADE] Attempting ${payload.actionType} order. Received Params:`, JSON.stringify(params));

            // --- Parameter Mapping and Validation ---
            const symbol = params.symbol as string;
            // Map 'quantity' from strategy definition to 'qty' for Alpaca
            const qty = params.quantity !== undefined ? String(params.quantity) : undefined;
            const notional = params.notional !== undefined ? String(params.notional) : undefined;
            // Map 'orderType' from strategy definition to 'type' for Alpaca
            const type = params.orderType ? (params.orderType as string).toLowerCase() as 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop' : undefined;
            // Add a default 'time_in_force' if not provided in strategy params
            const time_in_force = params.time_in_force ? (params.time_in_force as string).toLowerCase() as 'day' | 'gtc' | 'opg' | 'ioc' | 'cls' | 'fok' : 'day'; // Default to 'day'

            // Validate using the *expected* Alpaca parameters
            if (!symbol || (!qty && !notional) || !type /* Removed time_in_force from validation as we default it */ ) {
                 const missing = [];
                 if (!symbol) missing.push('symbol');
                 if (!qty && !notional) missing.push('qty/notional (from quantity/notional)');
                 if (!type) missing.push('type (from orderType)');
                 // if (!time_in_force) missing.push('time_in_force'); // No longer strictly needed if default is acceptable

                 const errorMsg = `Action Error (${payload.actionType}): Missing required mapped parameters (${missing.join(', ')}). Original Params: ${JSON.stringify(params)}`;
                 console.error(`      ${errorMsg}`);
                 throw new Error(errorMsg); // Throw error to signal job failure
            }

            try {
                 // Construct order data using mapped/defaulted values and ensure string conversion
                 const orderData: Record<string, any> = { // Use Record for easier dynamic property setting
                     symbol: symbol,
                     qty: qty,
                     notional: notional,
                     side: payload.actionType.toLowerCase() as 'buy' | 'sell',
                     type: type,
                     time_in_force: time_in_force, // Use the mapped or defaulted value
                     limit_price: params.limitPrice !== undefined ? String(params.limitPrice) : undefined, // Use limitPrice, convert to string
                     stop_price: params.stopPrice !== undefined ? String(params.stopPrice) : undefined,   // Use stopPrice, convert to string
                     trail_price: params.trail_price ? String(params.trail_price) : undefined,
                     trail_percent: params.trail_percent ? String(params.trail_percent) : undefined,
                     extended_hours: typeof params.extended_hours === 'boolean' ? params.extended_hours : undefined,
                     client_order_id: params.client_order_id ? String(params.client_order_id) : undefined,
                     order_class: params.order_class as 'simple' | 'bracket' | 'oco' | 'oto' | undefined,
                     take_profit: params.take_profit, // Pass complex objects directly
                     stop_loss: params.stop_loss,     // Pass complex objects directly
                 };

                // Remove undefined keys before sending
                Object.keys(orderData).forEach(key => orderData[key] === undefined && delete orderData[key]);


                 console.log(`   Posting order to: ${tradingApiUrl}/orders`);
                 console.log(`   Order data being sent:`, JSON.stringify(orderData, null, 2)); // Log the final payload

                 // Use axios with the Broker API authentication
                 const orderResponse = await axios.post(
                     `${tradingApiUrl}/orders`, // Endpoint includes tradingId
                     orderData,
                     {
                         headers: {
                             Authorization: getBrokerAlpacaAuth(), // Use Broker auth
                             'Accept': 'application/json',
                             'Content-Type': 'application/json'
                         }
                     }
                 );

                 console.log(`      ${payload.actionType} Order Placed Successfully via Broker API:`, orderResponse.data);
                 return orderResponse.data; // Return result for potential logging

            } catch (orderError: any) {
                 const errorDetails = orderError.response?.data || orderError.message;
                 console.error(`      ${payload.actionType} Order Failed:`, errorDetails);
                 // Re-throw to signal job failure. BullMQ can handle retries based on this.
                 throw new Error(`Failed to place ${payload.actionType} order: ${JSON.stringify(errorDetails)}`);
            }
            break; // BUY/SELL case ends here

        // --- Other Action Types Remain the Same ---
        case ActionType.NOTIFY:
            console.log(`   Notify Action: User=${payload.userId}, Strategy=${payload.strategyId}, Message='${params.message || 'Strategy condition met'}'`);
            console.log(`      (Notification Placeholder for User ${payload.userId})`);
            break;

        case ActionType.LOG_MESSAGE:
            console.log(`   Log Action: User=${payload.userId}, Strategy=${payload.strategyId}, Message='${params.message || 'Condition met'}'`, params);
            break;

        case ActionType.REBALANCE:
             console.warn(`   Action Type ${payload.actionType} not yet implemented.`, params);
             break;

        default:
            const _exhaustiveCheck: never = payload.actionType;
            console.warn(`   Unsupported Action Type encountered: ${payload.actionType}`);
            throw new Error(`Unsupported action type: ${payload.actionType}`);
    }
}

// startActionConsumer function remains largely the same as your working version
// Just ensure the deserialization logic correctly parses 'parameters' and 'triggeringIndicator'
// And that it calls the updated executeAction function above.

export const startActionConsumer = async () => {
    await setupActionConsumerGroup();
    console.log(`[Action Consumer] ${ACTION_CONSUMER_NAME} starting to listen to stream ${ACTION_STREAM_KEY}...`);

    while (true) {
        let redisClient;
        try {
            redisClient = getRedisClient();
            const response = await redisClient.xReadGroup(
                ACTION_GROUP_NAME,
                ACTION_CONSUMER_NAME,
                { key: ACTION_STREAM_KEY, id: '>' },
                { COUNT: 5, BLOCK: 5000 }
            );

            if (response) {
                for (const stream of response) {
                    for (const message of stream.messages) {
                        const messageId = message.id;
                        const payloadRaw = message.message;
                        let acknowledged = false;
                        const ackClient = getRedisClient();

                        try {
                            if (!payloadRaw || Object.keys(payloadRaw).length === 0) {
                                // Handle empty message (same as your working version)
                                console.warn(`[Action Consumer] ${ACTION_CONSUMER_NAME} received empty message ${messageId}. Acknowledging.`);
                                await ackClient.xAck(ACTION_STREAM_KEY, ACTION_GROUP_NAME, messageId);
                                acknowledged = true;
                                continue;
                            }

                            console.log(`[Action Consumer] ${ACTION_CONSUMER_NAME} received message ${messageId}. Processing...`);

                            // --- Deserialize Payload (Same as your working version) ---
                            let parsedPayload: ActionRequiredPayload;
                            try {
                                const tempPayload: Record<string, any> = {};
                                for (const [key, value] of Object.entries(payloadRaw)) {
                                    if (key === 'parameters' || key === 'triggeringIndicator') {
                                        try {
                                            tempPayload[key] = JSON.parse(value);
                                        } catch (e) {
                                            throw new Error(`Failed to parse JSON field '${key}': ${value}. Error: ${(e as Error).message}`);
                                        }
                                    } else {
                                        tempPayload[key] = value;
                                    }
                                }
                                if (!tempPayload.actionId || !tempPayload.actionType || !tempPayload.strategyId || !tempPayload.userId) {
                                   throw new Error('Missing essential fields (actionId, actionType, strategyId, userId) in action payload.');
                                }
                                parsedPayload = tempPayload as ActionRequiredPayload;

                            } catch (parseError: any) {
                                // Handle parse error (same as your working version)
                                console.error(`[Action Consumer] Error deserializing action payload for message ${messageId}. Raw:`, payloadRaw, 'Error:', parseError.message);
                                console.warn(`   Acknowledging message ${messageId} due to deserialization error.`);
                                await ackClient.xAck(ACTION_STREAM_KEY, ACTION_GROUP_NAME, messageId);
                                acknowledged = true;
                                continue;
                            }
                            // --- End Deserialize ---

                            // --- Fetch User Trading ID (Same as your working version) ---
                             const user = await prisma.user.findUnique({
                                 where: { id: parsedPayload.userId },
                                 select: { tradingId: true }
                             });
                             if (!user || !user.tradingId) {
                                 // Handle missing user/tradingId (same as your working version)
                                 const errorMsg = `User ${parsedPayload.userId} or their tradingId not found. Cannot execute action ${parsedPayload.actionId}.`;
                                 console.error(`[Action Consumer] ${errorMsg}`);
                                 await ackClient.xAck(ACTION_STREAM_KEY, ACTION_GROUP_NAME, messageId);
                                 acknowledged = true;
                                 console.warn(`   Acknowledged message ${messageId} due to missing user/tradingId.`);
                                 continue;
                             }
                             const userTradingId = user.tradingId;
                            // --- End Fetch Trading ID ---

                            // --- Execute the *updated* action function ---
                            await executeAction(parsedPayload, userTradingId); // <--- Calls the modified function

                            // --- Acknowledge successful processing ---
                            await ackClient.xAck(ACTION_STREAM_KEY, ACTION_GROUP_NAME, messageId);
                            acknowledged = true;
                            console.log(`   [Action Consumer] Successfully processed and acknowledged message ${messageId}`);

                        } catch (processingError: any) {
                             // Handle processing error (same as your working version)
                            console.error(`[Action Consumer] Error processing action message ${messageId}:`, processingError.message);
                             if (!acknowledged) {
                                 console.warn(`   Acknowledging action message ${messageId} despite processing error to prevent potential loop.`);
                                 try {
                                      await ackClient.xAck(ACTION_STREAM_KEY, ACTION_GROUP_NAME, messageId);
                                      acknowledged = true;
                                 } catch (ackError: any) {
                                      console.error(`   Failed to acknowledge message ${messageId} after processing error:`, ackError.message);
                                 }
                             }
                        } finally {
                             // Final ack check (same as your working version)
                             if (!acknowledged) {
                                 console.warn(`[Action Consumer] Message ${messageId} reached end of loop without being acknowledged. Attempting final acknowledgment.`);
                                 try {
                                     await ackClient.xAck(ACTION_STREAM_KEY, ACTION_GROUP_NAME, messageId);
                                 } catch (finalAckError: any) {
                                     console.error(`   CRITICAL: Failed final acknowledgment attempt for message ${messageId}:`, finalAckError.message);
                                 }
                             }
                        }
                    }
                }
            }
        } catch (err) {
            // Handle read error (same as your working version)
            console.error(`[Action Consumer] ${ACTION_CONSUMER_NAME} error reading from stream ${ACTION_STREAM_KEY}:`, err);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};