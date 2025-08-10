// src/controllers/scheduler/schedulerService.ts
import cron from 'node-cron';
import { initRedis, getIndicatorFetchQueue, closeRedis } from '../../utils/redisClient';
import { generateCacheKey } from '../technicalIndicators/cache';
import { getCronPatternForInterval } from './fetchOrchestrator';
import { getTechnicalActiveIndicators, ActiveIndicator } from './technicalStrategySource';
import type { JobSchedulerJson } from 'bullmq';

const INDICATOR_FETCH_JOB_NAME = 'fetch-indicator';
const SCHEDULER_DISCOVERY_INTERVAL = '*/1 * * * *'; // Check every minute for testing/dev

let discoveryCronJob: cron.ScheduledTask | null = null;

/**
 * Upsert a repeatable scheduler using BullMQ’s JobScheduler API.
 * Returns the stable cache-key jobId or null on failure.
 */
async function addOrUpdateRepeatableJob(indicatorParams: ActiveIndicator): Promise<string | null> {
  const queue = getIndicatorFetchQueue();
  const jobId = generateCacheKey({
    indicatorType: indicatorParams.indicatorType,
    symbol: indicatorParams.symbol!,
    interval: indicatorParams.interval!,
    parameters: indicatorParams.parameters,
    dataSource: indicatorParams.dataSource || 'AlphaVantage',
  });
  const cronPattern = indicatorParams.interval
    ? getCronPatternForInterval(indicatorParams.interval)
    : null;

  if (!cronPattern) {
    console.warn(
      `[Scheduler] No valid cron pattern for interval '${indicatorParams.interval}' for job ${jobId}. Skipping.`
    );
    return null;
  }

  try {
    // Use the JobScheduler API to upsert the schedule
    const js = await queue.jobScheduler;
    await js.upsertJobScheduler(
        jobId,                             // your cache‐key
        { pattern: cronPattern },          // use `pattern`, not `cron`
        INDICATOR_FETCH_JOB_NAME,          // the job name
        indicatorParams,                   // the payload
        {                                  // template options
          removeOnComplete: { age: 3600 * 4 },
          removeOnFail:     { age: 3600 * 24 * 7 },
        },
        { override: true }                 // force upsert
      );
    console.log(`[Scheduler] Upserted scheduler: ${jobId} @ ${cronPattern}`);
    return jobId;
  } catch (error: any) {
    console.error(
      `[Scheduler] Error upserting scheduler ${jobId} (Pattern: ${cronPattern}):`,
      error.message
    );
    return null;
  }
}

/**
 * Prune obsolete schedulers: any JobScheduler whose key is not in activeGeneratedJobIds.
 */
async function pruneObsoleteJobs(activeGeneratedJobIds: Set<string>) {
  const queue = getIndicatorFetchQueue();
  try {
    const schedulers: JobSchedulerJson[] = await queue.getJobSchedulers();
    console.log(`[Prune] Found ${schedulers.length} schedulers in BullMQ.`);
    console.log(`[Prune] Active Job IDs expected:`, Array.from(activeGeneratedJobIds));

    const jobsToRemove = schedulers.filter(
      job =>
        job.name === INDICATOR_FETCH_JOB_NAME &&
        !activeGeneratedJobIds.has(job.key)
    );

    if (jobsToRemove.length > 0) {
      console.log(`[Prune] Removing ${jobsToRemove.length} obsolete schedulers...`);
      for (const job of jobsToRemove) {
        try {
          const removed = await queue.removeJobScheduler(job.key);
          if (removed) {
            console.log(`[Prune] Removed scheduler key=${job.key}`);
          } else {
            console.warn(`[Prune] Failed to remove scheduler key=${job.key}`);
          }
        } catch (err: any) {
          console.error(
            `[Prune] Error removing scheduler key=${job.key}:`,
            err.message
          );
        }
      }
    } else {
      console.log(`[Prune] No obsolete schedulers to remove.`);
    }
  } catch (err) {
    console.error('[Prune] Error fetching or pruning obsolete schedulers:', err);
  }
}

/**
 * Fetch active indicators from the DB, upsert their schedulers,
 * then prune anything no longer active.
 */
async function runIndicatorDiscoveryAndScheduling() {
  console.log(`[${new Date().toISOString()}] Running indicator discovery and scheduling...`);
  try {
    const indicatorsToSchedule: ActiveIndicator[] = await getTechnicalActiveIndicators();
    console.log(`[Scheduler] Found ${indicatorsToSchedule.length} active indicators from DB.`);

    const activeJobIds = new Set<string>();

    for (const indicatorParams of indicatorsToSchedule) {
      const expectedJobId = generateCacheKey({
        indicatorType: indicatorParams.indicatorType,
        symbol: indicatorParams.symbol!,
        interval: indicatorParams.interval!,
        parameters: indicatorParams.parameters,
        dataSource: indicatorParams.dataSource || 'AlphaVantage',
      });
      const addedJobId = await addOrUpdateRepeatableJob(indicatorParams);
      if (addedJobId) {
        activeJobIds.add(addedJobId);
      } else {
        console.warn(`[Scheduler] Failed to upsert job for indicator:`, indicatorParams);
      }
    }

    await pruneObsoleteJobs(activeJobIds);
    console.log(`[Scheduler] Discovery finished. Active schedulers: ${activeJobIds.size}`);
  } catch (error: any) {
    console.error('[Scheduler] Error during discovery and scheduling:', error);
  }
}

/**
 * Starts the scheduler service: connects Redis, runs discovery once,
 * then schedules runIndicatorDiscoveryAndScheduling on a cron.
 */
export const startSchedulerService = async () => {
  console.log('Starting Scheduler Service...');
  try {
    await initRedis();
    getIndicatorFetchQueue();

    // immediate run
    await runIndicatorDiscoveryAndScheduling();

    if (!discoveryCronJob) {
      discoveryCronJob = cron.schedule(
        SCHEDULER_DISCOVERY_INTERVAL,
        runIndicatorDiscoveryAndScheduling,
        { scheduled: true }
      );
      console.log(
        `Scheduler Service started. Discovery runs on '${SCHEDULER_DISCOVERY_INTERVAL}'.`
      );
    } else {
      console.log('Scheduler Service already running.');
    }
  } catch (err) {
    console.error('Failed to start Scheduler Service:', err);
    throw err;
  }
};

/**
 * Stops the scheduler cron and leaves Redis open for shutdown elsewhere.
 */
export const stopSchedulerService = async () => {
  console.log('Stopping Scheduler Service...');
  if (discoveryCronJob) {
    discoveryCronJob.stop();
    discoveryCronJob = null;
    console.log('Discovery cron job stopped.');
  }
  console.log('Scheduler Service stopped.');
};