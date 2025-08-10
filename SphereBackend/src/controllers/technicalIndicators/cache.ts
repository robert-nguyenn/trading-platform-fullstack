// cache.ts
import { getRedisClient } from "../../utils/redisClient";
import { Prisma } from '@prisma/client';

interface CacheKeyParams {
    indicatorType: string;
    symbol: string;
    interval: string;
    parameters: Prisma.InputJsonValue; // Use Prisma's type for JSON
    dataSource?: string; // Optional field
    // dataKey?: string; // Optional field
}

export const generateCacheKey = (params: CacheKeyParams): string => {
  // Select only the fields relevant for identifying the unique data stream
  const keyParams = {
      indicatorType: params.indicatorType,
      symbol: params.symbol,
      interval: params.interval,
      parameters: params.parameters,
      dataSource: params.dataSource,
  };

  // Sort keys for consistency
  const sortedKeys = Object.keys(keyParams).sort();

  const entries = sortedKeys
      .map(key => {
          const value = keyParams[key as keyof typeof keyParams];

          // Handle null/undefined consistently
          // if (value === undefined || value === null || value === Prisma.JsonNull) return `${key}:NULL`;
          if (value === undefined || value === null || Object.is(value, Prisma.JsonNull)) return `${key}:NULL`;

          // Special handling for parameters object: stable stringify
          if (key === 'parameters' && typeof value === 'object') {
               // Sort keys within parameters object before stringifying for stability
               const sortedParams = Object.entries(value)
                   .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
               const stableParamsString = JSON.stringify(Object.fromEntries(sortedParams));
              return `${key}:${stableParamsString}`;
          }

          // Convert other values to string
          return `${key}:${String(value)}`;
      })
      .join('|'); // Use a separator

  // Add a prefix for namespacing in Redis
  return `indicator:${entries}`;
};

// Store both data and metadata (like lastRefreshed timestamp)
export const setCachedIndicatorData = async (
  key: string,
  data: any,
  metadata: Record<string, any>,
  ttlSeconds: number
) => {
  const redisClient = getRedisClient(); // Moved inside the function
  const cacheEntry = {
    data: data,
    metadata: metadata, // Store metadata like "Last Refreshed"
    fetchedAt: new Date().toISOString(), // Track when we fetched it
  };
  console.log(`Setting cache for key: ${key} with TTL: ${ttlSeconds} seconds`);
  await redisClient.set(key, JSON.stringify(cacheEntry), { EX: ttlSeconds });
};

// Retrieve the full cache entry including metadata
export const getCachedIndicatorEntry = async <T>(
  key: string
): Promise<{ data: T; metadata: Record<string, any>; fetchedAt: string } | null> => {
  const redisClient = getRedisClient(); 
  // console.log('Checking cache for key: ' + key);
  const cached = await redisClient.get(key);
  if (!cached) {
    // console.log('Cache miss: ' + key);
    return null;
  }
  // console.log('Cache hit: ' + key);
  try {
    return JSON.parse(cached);
  } catch (error) {
    console.error(`Error parsing cached JSON for key ${key}:`, error);
    // Optional: Delete invalid cache entry
    await redisClient.del(key);
    return null;
  }
};

// Existing function kept for compatibility or simpler use cases
export const getCachedData = async <T>(key: string): Promise<T | null> => {
  const entry = await getCachedIndicatorEntry<T>(key);
  return entry ? entry.data : null;
};