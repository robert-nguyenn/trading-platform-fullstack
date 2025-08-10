/**
 * This module defines a Fetcher Worker using BullMQ to process jobs related to fetching technical indicator data.
 * The worker listens to a queue named 'indicator-fetch-queue' and processes jobs that contain parameters for
 * fetching technical indicators. It utilizes Redis for caching and metadata management to determine if a fetch
 * is necessary, thereby optimizing API calls to external services.
 * 
 * Key functionalities include:
 * - Initializing and managing a BullMQ worker to handle jobs from the queue.
 * - Using metadata checks to decide whether to fetch new data or use cached data.
 * - Fetching, caching, and publishing updates of technical indicator data using the getTechnicalIndicator function.
 * - Handling job completion, failure, and errors with appropriate logging and retry mechanisms.
 * - Managing Redis connections and ensuring proper startup and shutdown of the worker.
 * 
 * This worker is part of a larger system that integrates with Redis and external APIs to provide efficient
 * and timely data retrieval for technical indicators, supporting various strategies and operations.
 */

// src/workers/fetcherWorker.ts
import { Worker, Job } from 'bullmq';
import { initRedis, closeRedis, redisConnectionOptions } from '../utils/redisClient';
import { getTechnicalIndicator, FetchIndicatorParams } from '../controllers/technicalIndicators/technicalIndicators'; // Use FetchIndicatorParams
import { shouldFetchBasedOnMetadata } from '../controllers/scheduler/fetchOrchestrator';
import { generateCacheKey } from '../controllers/technicalIndicators/cache';
import { ActiveIndicator } from '../controllers/scheduler/technicalStrategySource';


const QUEUE_NAME = 'indicator-fetch-queue';
let worker: Worker | null = null;
// job data type should match what the scheduler puts in the queue

async function processIndicatorJob(job: Job<ActiveIndicator>) {
    // The job.data directly contains the ActiveIndicator structure
    const indicatorParams = job.data;

    // Adapt ActiveIndicator to FetchIndicatorParams if needed by getTechnicalIndicator
    // If they are compatible, you can use indicatorParams directly.
    // If not, create the FetchIndicatorParams structure:
    const fetchParams: FetchIndicatorParams = {
         indicatorType: indicatorParams.indicatorType,
         // Ensure symbol and interval are strings, handle potential nulls gracefully
         symbol: indicatorParams.symbol ?? '', // Provide a default or throw if required
         interval: indicatorParams.interval ?? '', // Provide a default or throw if required
         parameters: indicatorParams.parameters, // Already contains calc params
         dataSource: indicatorParams.dataSource ?? undefined, // Pass undefined if null
         dataKey: indicatorParams.dataKey ?? undefined,
    };

    // Ensure required fields for fetch are present
    if (!fetchParams.symbol || !fetchParams.interval) {
         if (fetchParams.dataSource === 'AlphaVantage' || !fetchParams.dataSource) {
             console.warn(`[Fetcher Worker ${process.pid}] Job ${job.id}: Skipping fetch for AlphaVantage indicator due to missing symbol or interval.`);
             // Mark job as completed successfully but indicate skip
             return { skipped: true, reason: 'Missing required symbol/interval for technical indicator' };
         }
         // Allow macro indicators to proceed without symbol/interval if that's valid
    }


    const jobKey = generateCacheKey(fetchParams); // Use the parameters passed to fetcher

    console.log(`[Fetcher Worker ${process.pid}] Received job ${job.id} (${jobKey})`);

    try {
        const needsFetch = await shouldFetchBasedOnMetadata(fetchParams);

        if (needsFetch) {
            console.log(`[Fetcher Worker ${process.pid}] Metadata indicates fetch needed for ${jobKey}. Calling API.`);
            // Pass the correctly structured fetchParams
            const result = await getTechnicalIndicator(fetchParams, true);

            if (result) {
                 console.log(`[Fetcher Worker ${process.pid}] Fetch successful for ${jobKey}.`);
                 return result;
            } else {
                 // getTechnicalIndicator now throws errors on failure
                 // This part might not be reached if errors are thrown properly
                 console.warn(`[Fetcher Worker ${process.pid}] Fetch attempt for ${jobKey} returned null/undefined unexpectedly.`);
                 throw new Error(`Fetch returned no data for ${jobKey}`);
            }
        } else {
            console.log(`[Fetcher Worker ${process.pid}] Metadata indicates data for ${jobKey} is fresh enough. Skipping API call.`);
            return { skipped: true, reason: 'Metadata indicates freshness' };
        }

    } catch (error: any) {
        console.error(`[Fetcher Worker ${process.pid}] Error processing job ${job.id} (${jobKey}):`, error.message);
        // Re-throw the error so BullMQ handles retries/failure based on its configuration
        throw error;
    }
}
export const startFetcherWorker = async () => {
    if (worker) {
        console.log("Fetcher worker already started.");
        return;
    }
    console.log('Attempting to start Fetcher Worker...');
    try {
        await initRedis(); // Ensure Redis is up
        worker = new Worker<ActiveIndicator>(QUEUE_NAME, processIndicatorJob, { // Use ActiveIndicator as Job Data Type
            connection: redisConnectionOptions,
            concurrency: parseInt(process.env.FETCHER_CONCURRENCY || '5', 10),
             limiter: { // Example: Max 10 jobs per 5 seconds (adjust based on API limits)
                 max: 10,
                 duration: 5000,
             },
            removeOnComplete: { age: 3600 }, // Keep completed jobs for 1 hour
            removeOnFail: { age: 24 * 3600 }, // Keep failed jobs for 24 hours
        });

        worker.on('completed', (job: Job, result: any) => {
            const jobKey = generateCacheKey(job.data); // Generate key again for logging
            console.log(`[Fetcher Worker ${process.pid}] Job ${job.id} (${jobKey}) completed. Skipped: ${result?.skipped ?? false}`);
        });

        worker.on('failed', (job: Job | undefined, err: Error) => {
             const jobKey = job ? generateCacheKey(job.data) : 'unknown';
             const jobId = job ? job.id : 'unknown';
             console.error(`[Fetcher Worker ${process.pid}] Job ${jobId} (${jobKey}) failed:`, err.message);
             // Add more details if needed: console.error(err.stack);
        });

        worker.on('error', (err: Error) => {
            // This is for errors in the worker itself, not job processing errors
            console.error(`[Fetcher Worker ${process.pid}] Worker error:`, err);
        });

        console.log(`[Fetcher Worker ${process.pid}] started, listening to queue: ${QUEUE_NAME}. Concurrency: ${parseInt(process.env.FETCHER_CONCURRENCY || '5', 10)}`);

    } catch (error) {
        console.error('Failed to start Fetcher Worker:', error);
        worker = null; // Ensure worker is null if startup fails
        throw error;
    }
};

export const stopFetcherWorker = async () => {
    if (worker) {
        console.log(`[Fetcher Worker ${process.pid}] Stopping...`);
        await worker.close();
        worker = null;
        console.log(`[Fetcher Worker ${process.pid}] stopped.`);
    } else {
        console.log("Fetcher worker not running or already stopped.");
    }
     // Don't close Redis here if other services (scheduler, consumers) might still need it.
     // Close Redis at the application's main shutdown point.
     // await closeRedis();
};