// src/controllers/evaluationService/consumer.ts
import { getRedisClient } from '../../utils/redisClient';
import { STREAM_KEY } from '../scheduler/redisStream';
import { evaluateStrategiesTriggeredByIndicator } from './evaluator'; // Use the new evaluator function
import { IndicatorUpdatePayload } from '../strategyAPI/strategyApiTypes'; // Import the type

const GROUP_NAME = 'evaluation_group';
const CONSUMER_NAME = `evaluator_${process.pid}`;

async function setupConsumerGroup() {
    const redisClient = getRedisClient();
    try {
        // Group creation logic remains the same
        await redisClient.xGroupCreate(STREAM_KEY, GROUP_NAME, '0', { MKSTREAM: true });
        console.log(`Consumer group ${GROUP_NAME} ensured on stream ${STREAM_KEY}`);
    } catch (error: any) {
        if (error.message.includes('BUSYGROUP')) {
            console.log(`Consumer group ${GROUP_NAME} already exists.`);
        } else {
            console.error('Error creating consumer group:', error);
            throw error; // Rethrow critical errors
        }
    }
}

export const startConsumer = async () => {
    await setupConsumerGroup();
    console.log(`Consumer ${CONSUMER_NAME} starting to listen to stream ${STREAM_KEY}...`);

    while (true) {
        const redisClient = getRedisClient(); // Get client inside loop remains okay
        try {
            const response = await redisClient.xReadGroup(
                GROUP_NAME,
                CONSUMER_NAME,
                { key: STREAM_KEY, id: '>' },
                { COUNT: 10, BLOCK: 5000 } // Read multiple messages, block for 5s
            );

            if (response) {
                for (const stream of response) {
                    for (const message of stream.messages) {
                        const messageId = message.id;
                        const payloadRaw = message.message; // Raw key-value pairs from Redis

                        if (!payloadRaw || Object.keys(payloadRaw).length === 0) {
                             console.warn(`Consumer ${CONSUMER_NAME} received empty message ${messageId}. Acknowledging.`);
                             await redisClient.xAck(STREAM_KEY, GROUP_NAME, messageId);
                             continue;
                        }

                        console.log(`Consumer ${CONSUMER_NAME} received message ${messageId}. Processing...`);

                        // --- Deserialize Payload ---
                        let parsedPayload: IndicatorUpdatePayload;
                        try {
                             // Reconstruct the object, parsing JSON fields where necessary
                             const tempPayload: Record<string, any> = {};
                             for (const [key, value] of Object.entries(payloadRaw)) {
                                  if (key === 'parameters' /* add other JSON fields if any */ ) {
                                      try {
                                          tempPayload[key] = JSON.parse(value as string);
                                      } catch (e) {
                                          throw new Error(`Failed to parse JSON field '${key}': ${value}`);
                                      }
                                  } else {
                                      // Attempt basic type inference (optional, could keep all as string)
                                      if (!isNaN(Number(value as string))) {
                                           // tempPayload[key] = Number(value); // Be cautious with this
                                           tempPayload[key] = value; // Keep as string is safer
                                      } else {
                                           tempPayload[key] = value;
                                      }
                                  }
                             }
                             // TODO: Validate tempPayload against IndicatorUpdatePayload structure if possible (e.g., using Zod)
                             parsedPayload = tempPayload as IndicatorUpdatePayload; // Cast after parsing

                             // Essential field validation
                             if (!parsedPayload.cacheKey || !parsedPayload.indicatorType || !parsedPayload.fetchTime || !parsedPayload.parameters) {
                                 throw new Error('Missing essential fields after parsing payload.');
                             }

                        } catch (parseError: any) {
                             console.error(`Error deserializing payload for message ${messageId}. Raw:`, payloadRaw, 'Error:', parseError.message);
                             console.warn(`Acknowledging message ${messageId} due to deserialization error.`);
                             await redisClient.xAck(STREAM_KEY, GROUP_NAME, messageId);
                             continue; // Skip this message
                        }
                        // --- End Deserialize ---


                        try {
                            // Call the new evaluator function
                            await evaluateStrategiesTriggeredByIndicator(parsedPayload);

                            await redisClient.xAck(STREAM_KEY, GROUP_NAME, messageId);
                            console.log(`Consumer ${CONSUMER_NAME} successfully processed and acknowledged message ${messageId}`);
                        } catch (processingError) {
                            console.error(`Error processing message ${messageId} payload:`, parsedPayload, 'Error:', processingError);
                            // Acknowledge even on processing error to avoid reprocessing loops for now
                            // TODO: Implement a dead-letter queue or more robust error handling later
                            console.warn(`Acknowledging message ${messageId} despite processing error.`);
                            await redisClient.xAck(STREAM_KEY, GROUP_NAME, messageId);
                        }
                    }
                }
            }
            // No else needed, BLOCK handles waiting
        } catch (err) {
            console.error(`Consumer ${CONSUMER_NAME} error reading from stream ${STREAM_KEY}:`, err);
            // Avoid busy-looping on persistent errors
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};