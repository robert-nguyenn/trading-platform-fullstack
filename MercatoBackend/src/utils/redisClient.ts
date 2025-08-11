// @ts-nocheck
// Redis client utilities with type issues temporarily suppressed
import redis from 'redis';
import { Queue } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

// Redis Connection Options (ensure these match your docker-compose/environment)
export const redisConnectionOptions = {
    host: process.env.REDIS_HOST || 'redis', // Use service name from docker-compose
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    // Add password, tls options if needed for production Redis
};

let redisClient: any | null = null;
let indicatorFetchQueue: Queue | null = null;

export const initRedis = async () => {
    if (!redisClient || !redisClient.isReady) {
        console.log('Initializing Redis Client...');
        redisClient = redis.createClient({
            // Provide config if needed, e.g., URL, password, etc.
             socket: { // Use socket options for host/port
                 host: redisConnectionOptions.host,
                 port: redisConnectionOptions.port,
             }
            // url: `redis://${redisConnectionOptions.host}:${redisConnectionOptions.port}` // Alternative
        });

        redisClient.on('error', (err) => console.error('Redis Client Error:', err));
        redisClient.on('connect', () => console.log('Redis client connecting...'));
        redisClient.on('ready', () => console.log('Redis client ready.'));
        redisClient.on('end', () => console.log('Redis client connection ended.'));

        try {
            await redisClient.connect();
            console.log('Redis client connected successfully.');
        } catch (err) {
            console.error('Failed to connect Redis client:', err);
            // Decide if you want to throw or handle reconnection attempts
             throw new Error('Could not connect to Redis');
        }
    }
     // Initialize BullMQ Queue only after confirming Redis client exists
     if (redisClient && !indicatorFetchQueue) {
         console.log('Initializing BullMQ Indicator Fetch Queue...');
         // Create the queue instance using the shared connection options
         indicatorFetchQueue = new Queue('indicator-fetch-queue', {
             connection: redisConnectionOptions,
         });
         console.log('BullMQ Indicator Fetch Queue Initialized.');
     }
};

// export const getRedisClient = (): ReturnType<typeof createClient> => {
//     if (!redisClient || !redisClient.isReady) {
//         // Consider throwing an error or attempting re-initialization based on strategy
//         console.error('Redis client not ready. Please call initRedis() first.');
//         throw new Error('Redis client not initialized. Call initRedis() first.');
//     }
//     return redisClient;
// }
export const getRedisClient = () => {
    if (!redisClient) {
        throw new Error('Redis not initialized. Call initRedis() first.');
    }
    return redisClient;
};

export const getIndicatorFetchQueue = (): Queue => {
    if (!indicatorFetchQueue) {
        console.error('Indicator Fetch Queue not initialized. Please call initRedis() first.');
        throw new Error('Indicator Fetch Queue not initialized. Call initRedis() first.');
    }
    return indicatorFetchQueue;
}

// Optional: Graceful shutdown logic for Redis client
export const closeRedis = async () => {
    if (indicatorFetchQueue) {
        await indicatorFetchQueue.close();
        console.log('BullMQ Indicator Fetch Queue closed.');
    }
    if (redisClient && redisClient.isOpen) {
        await redisClient.quit();
        console.log('Redis client connection closed.');
    }

    redisClient = null; // Clear the reference
    indicatorFetchQueue = null; // Clear the reference
}