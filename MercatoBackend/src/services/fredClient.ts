// src/services/fredClient.ts
import { URLSearchParams } from 'url';
import axios from 'axios';

const FRED_API_KEY = process.env.FRED_API_KEY;
const FRED_API_BASE_URL = 'https://api.stlouisfed.org/fred';

// Helper to build URL (good practice)
const buildFredUrl = (path: string, params: Record<string, any>): string => {
    // Ensure required parameters are present
    if (!FRED_API_KEY) {
        throw new Error("FRED_API_KEY environment variable is not set.");
    }
    const query = new URLSearchParams({
        api_key: FRED_API_KEY,
        file_type: 'json',
        ...params,
    });
    // Remove parameters with undefined or null values if any snuck in
    for (const [key, value] of Array.from(query.entries())) {
         if (value === null || typeof value === 'undefined') {
             query.delete(key);
         }
     }
    return `${FRED_API_BASE_URL}${path}?${query.toString()}`;
};

/**
 * @description Fetches observations for a given FRED series ID.
 * @param seriesId The FRED series ID (e.g., 'GDP', 'UNRATE').
 * @param queryParams Optional query parameters to pass to the FRED API.
 *                    This can include things like units, frequency, aggregation_method,
 *                    and importantly for 'latest': sort_order='desc', limit='1'.
 * @returns Promise<any> Resolves with the data from the FRED API.
 * @throws Error if the API request fails or returns an error status.
 */
export const getSeriesObservations = async (
    seriesId: string,
    queryParams: Record<string, any> = {}
): Promise<any> => {
    const path = `/series/observations`;
    const url = buildFredUrl(path, { series_id: seriesId, ...queryParams });
    console.log(`Fetching FRED Observations from: ${url}`);

    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching FRED data:', error.message);
        throw error;
    }
};

// --- getReleases and other functions remain the same ---
export const getReleases = async (queryParams: Record<string, any> = {}): Promise<any> => {
    const path = `/releases`;
    const url = buildFredUrl(path, queryParams);
    console.log(`Fetching FRED Releases from: ${url}`);

    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching FRED releases:', error.message);
        throw error;
    }
};