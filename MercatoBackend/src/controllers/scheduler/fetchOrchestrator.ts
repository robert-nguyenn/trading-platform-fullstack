// scheduler/fetchOrchestrator.ts
// import cron from 'node-cron';
import { FetchIndicatorParams, getTechnicalIndicator } from '../technicalIndicators/technicalIndicators'; 
import { getCachedIndicatorEntry, generateCacheKey } from '../technicalIndicators/cache';
import { parseISO, differenceInMinutes, differenceInHours, differenceInDays, isBefore } from 'date-fns'; // Date library

// Helper to convert interval string to a cron pattern
export function getCronPatternForInterval(interval: string): string | null {
    console.warn(`Cron pattern for ${interval}`);
    switch (interval) {
        case '1min': return '* * * * *'; // Every minute
        case '5min': return '*/5 * * * *'; // Every 5 minutes
        case '15min': return '*/15 * * * *';
        case '30min': return '*/30 * * * *';
        case '60min': return '0 * * * *'; // Top of every hour
        case 'daily': return '0 1 * * *'; // Once a day (e.g., 1 AM UTC) - Adjust time as needed
        case 'weekly': return '0 2 * * 1'; // Once a week (e.g., Monday 2 AM UTC)
        case 'monthly': return '0 3 1 * *'; // Once a month (e.g., 1st day at 3 AM UTC)
        default:
            console.warn(`Unsupported interval for cron scheduling: ${interval}`);
            return null;
    }
}

// Helper to check if fetch is needed based on last refresh time
export async function shouldFetchBasedOnMetadata(params: FetchIndicatorParams): Promise<boolean> {
    const cacheKey = generateCacheKey(params);
    const cachedEntry = await getCachedIndicatorEntry<any>(cacheKey);

    if (!cachedEntry) {
        return true; // No cache, definitely fetch
    }

    const alphaVantageRefreshedStr = cachedEntry.metadata?.alphaVantageLastRefreshed;
    if (!alphaVantageRefreshedStr) {
         console.warn(`No AlphaVantage Last Refreshed time found for ${cacheKey}, fetching anyway.`);
        return true; // Cannot determine staleness, fetch to be safe
    }

    try {
        // Important: Alpha Vantage refresh times might be just Dates (YYYY-MM-DD) for daily/weekly/monthly
        // or DateTime for intraday. Handle parsing carefully. Assume ISO-like format or specific known formats.
        // This parsing might need adjustment based on actual AV output for different intervals.
         let avRefreshedDate: Date;
         if (alphaVantageRefreshedStr.length === 10) { // Looks like YYYY-MM-DD
             avRefreshedDate = parseISO(alphaVantageRefreshedStr + 'T00:00:00Z'); // Assume UTC midnight if only date
         } else {
            avRefreshedDate = parseISO(alphaVantageRefreshedStr.replace(' ', 'T') + 'Z'); // Attempt standard ISO parse, assume UTC if no TZ
         }


        const now = new Date();
        let diffThreshold = 0;

         // Define how old data can be before we NEED a new fetch based on interval
        switch (params.interval) {
            case '1min': diffThreshold = 2; break; // Fetch if AV data is older than ~2 mins
            case '5min': diffThreshold = 6; break;
            case '15min': diffThreshold = 16; break;
            case '30min': diffThreshold = 31; break;
            case '60min': diffThreshold = 61; break; // Minutes
            case 'daily': return differenceInDays(now, avRefreshedDate) >= 1; // Fetch if AV data is from yesterday or older
            case 'weekly': return differenceInDays(now, avRefreshedDate) >= 7;
            case 'monthly': return differenceInDays(now, avRefreshedDate) >= 28; // Approximate
            default: return true; // Fetch if unknown interval
        }

        if (['1min', '5min', '15min', '30min', '60min'].includes(params.interval)) {
             return differenceInMinutes(now, avRefreshedDate) >= diffThreshold;
        }

        return true; // Default to fetch if interval check didn't return

    } catch (parseError) {
        console.error(`Error parsing date '${alphaVantageRefreshedStr}' for ${cacheKey}:`, parseError);
        return true; // Error parsing date, fetch to be safe
    }
}


// export const scheduleIndicatorFetch = (indicatorParams: TechnicalIndicator): cron.ScheduledTask | null => {
//     const cronPattern = getCronPatternForInterval(indicatorParams.interval);
    
//     if (!cronPattern) {
//         return null;
//     }

//     const task = cron.schedule(cronPattern, async () => {
//         const jobKey = generateCacheKey(indicatorParams); // Use cache key for logging
//         console.log(`[${new Date().toISOString()}] Cron trigger for: ${jobKey}`);

//         try {
//              // Check if we actually need to call the API based on metadata
//              const needsFetch = await shouldFetchBasedOnMetadata(indicatorParams);

//              if (needsFetch) {
//                  console.log(`Metadata indicates fetch needed for ${jobKey}. Calling API.`);
//                 // Call the modified getTechnicalIndicator, forceRefresh=true isn't strictly needed
//                 // as shouldFetchBasedOnMetadata decided, but internal logic handles cache miss anyway.
//                 // The key is that getTechnicalIndicator now PUBLISHES the update event.
//                 await getTechnicalIndicator(indicatorParams, true); // Force refresh might be useful here
//                 console.log(`Fetch attempt completed for ${jobKey}.`);
//              } else {
//                   console.log(`Metadata indicates data for ${jobKey} is fresh. Skipping API call.`);
//              }

//         } catch (error) {
//             console.error(`Error during scheduled fetch for ${jobKey}:`, error);
//             // Implement retry logic or specific error handling here if needed
//         }
//     }, {
//         scheduled: true,
//         // timezone: "UTC" // Specify timezone if needed, e.g., "America/New_York" or "UTC"
//     });

//     console.log(`Scheduled fetch for ${generateCacheKey(indicatorParams)} with pattern: ${cronPattern}`);
//     return task;
// };