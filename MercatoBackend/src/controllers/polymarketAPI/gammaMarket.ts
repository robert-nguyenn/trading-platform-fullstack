// src/controllers/polymarketAPI/gammaMarket.ts
import axios from 'axios';
import { PrismaClient, Prisma } from '@prisma/client';
import { PolymarketEvent } from '@prisma/client'; // Import the generated type

const prisma = new PrismaClient();
// It's generally better to use an environment variable for API base URLs
// const GAMMA_BASE = process.env.POLYMARKET_API_URL || 'https://gamma-api.polymarket.com';
const GAMMA_BASE = 'https://gamma-api.polymarket.com'; // Using hardcoded for now as per yours

/** All the tags you care about for geo-political / economic events */
export const POLY_TAG_IDS = [
    126,    // Trump
    2,      // Politics
    100328, // Economy
    100196, // Fed Rates
    702,    // Inflation
    101758, // Tariffs
    101761, // Trade War
    101800, // Economic Policy
    101031, // Commodities
    309,    // Oil
    101589, // Gold
    100265, // Geopolitics
    303,    // China
    102028, // Treasuries
    101999, // Big Tech
    514,    // Congress
    100207, // Taxes
    101191, // Trump Presidency
    101799, // Executive Actions
    101998, // Natural Disaster
    102000, // Macro Indicators
    102038, // Antitrust
    101794, // Foreign Policy
    1597    // Global Elections
];

/** Polymarket “Tag” as returned in each event */
interface PolymarketTag {
    id: number;
    name: string;
    slug: string;
}

/** Raw shape of an event from /events endpoint */
interface RawPolymarketEvent {
    id: number;
    ticker: string | null; // Updated to allow null based on your schema
    slug: string;
    question: string;
    description: string | null;
    startDate: string;
    endDate: string | null;
    image: string | null; // Assuming image could be null
    active: boolean;
    closed: boolean;
    volume: number;
    liquidity: number;
    tags: PolymarketTag[];
}

/**
 * Compute the earliest start date for our filter:
 * – If today’s date > 20 → first of this month
 * – Otherwise → 20 days ago
 */
function computeStartDateMin(): string {
    const now = new Date();
    if (now.getDate() > 20) {
        // Return start of the current month in ISO format
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
    // Return 20 days ago in ISO format
    const twentyDaysAgo = new Date(now);
    twentyDaysAgo.setDate(now.getDate() - 20);
    return twentyDaysAgo.toISOString();
}

/**
 * Fetch raw events from Polymarket Gamma API with custom filters
 */
export async function fetchPolymarketEvents(opts: {
    tagIds: number[];
    volumeMin?: number;
    startDateMin?: string;
    startDateMax?: string;
    limit?: number;
    offset?: number;
    active?: boolean; // Added filter for active markets
}): Promise<RawPolymarketEvent[]> {
    const params = new URLSearchParams();
    opts.tagIds.forEach((tid) => params.append('tag_id', tid.toString()));
    if (opts.volumeMin != null) params.append('volume_min', opts.volumeMin.toString());
    if (opts.startDateMin != null) params.append('start_date_min', opts.startDateMin);
    if (opts.startDateMax != null) params.append('start_date_max', opts.startDateMax);
    if (opts.limit != null) params.append('limit', opts.limit.toString());
    if (opts.offset != null) params.append('offset', opts.offset.toString());
    if (opts.active != null) params.append('active', opts.active.toString()); // Add active filter

    const url = `${GAMMA_BASE}/events?${params.toString()}`;

    try {
        console.log(`Fetching Polymarket events from: ${url}`);
        
        // 1) Hit the API without any fancy typing
        const resp = await axios.get(url);
    
        // 2) Log the raw body so you can inspect exactly what came back
        console.log('Raw Polymarket API response:', JSON.stringify(resp.data, null, 2));
    
        // 3) Guard and parse
        //    Polymarket returns an array at top‐level, not { data: [...] }
        const events: RawPolymarketEvent[] = Array.isArray(resp.data)
          ? resp.data
          : (resp.data as any).data ?? [];
    
        console.log(`Parsed ${events.length} events after normalization.`);
        return events;
    
      } catch (error) {
        console.error('Error fetching Polymarket events:', (error as Error).message);
        throw error;
      }
}

/**
 * High-level helper: fetch + persist relevant geo-political events.
 * This function is intended to be run periodically (e.g., by a scheduler).
 */
export async function fetchAndStorePolymarketEvents(
    volumeThreshold = 100_000
): Promise<void> {
    const startDateMin = computeStartDateMin();
    const startDateMax = new Date().toISOString();

    try {
        const events = await fetchPolymarketEvents({
            tagIds: POLY_TAG_IDS,
            volumeMin: volumeThreshold,
            startDateMin,
            startDateMax,
            limit: 100,
            active: true,
        });

        if (events.length === 0) {
            console.log('No new Polymarket events fetched matching criteria.');
            return;
        }

        // Map to Prisma schema format, ensuring all required fields are present
        const eventsToStore = events.map((ev) => {
            // grab either `ev.question`, or if that's undefined, the API's `title`, or at worst the slug
            const questionText = (ev as any).question   // the API sometimes uses "question"
                               ?? (ev as any).title      // other times it uses "title"
                               ?? ev.slug                // fallback 
                               ?? '';
          
            return {
              id: typeof ev.id === 'string' ? parseInt(ev.id, 10) : ev.id,
              ticker: ev.ticker ?? null,
              slug: ev.slug ?? null,
              question: questionText,           // NEVER null now
              description: ev.description ?? null,
              image: ev.image ?? null,
              active: ev.active ?? null,
              closed: ev.closed ?? false,
              startDate: ev.startDate ? new Date(ev.startDate) : new Date(),
              endDate: ev.endDate ? new Date(ev.endDate) : null,
              volume: ev.volume ?? 0,
              liquidity: ev.liquidity ?? 0,
              tags: ev.tags as unknown as Prisma.InputJsonValue,
              rawData: ev as unknown as Prisma.InputJsonValue,
              fetchedAt: new Date(),
            };
          });

        // Log the first event to check mapping
        console.log('First event to store:', eventsToStore[0]);

        // Insert into DB, catch and log errors
        try {
            const createResult = await prisma.polymarketEvent.createMany({
                data: eventsToStore,
                skipDuplicates: true,
            });
            console.log(`Successfully stored/skipped ${eventsToStore.length} events. Created: ${createResult.count}`);
        } catch (dbError) {
            console.error('DB insert error:', dbError);
            // Optionally, log the data that failed
            console.error('Failed data:', JSON.stringify(eventsToStore, null, 2));
        }

    } catch (error) {
        console.error('Error during fetch and store process for Polymarket events:', (error as Error).message);
    }
}
/**
 * Retrieve stored Polymarket events from the database.
 * This function is intended to be called by your API endpoint.
 */
export async function getStoredPolymarketEvents(opts?: {
    activeOnly?: boolean;
    // Add other potential filters here, e.g., by tag slug, date range etc.
}): Promise<PolymarketEvent[]> {
    try {
        // You might want to add filtering/ordering here for the API endpoint
        const events = await prisma.polymarketEvent.findMany({
            where: {
                active: opts?.activeOnly ? true : undefined,
                // Add more complex filtering based on 'tags' JSON if needed
                // e.g., Prisma.sql`tags::jsonb @> ${JSON.stringify([{ slug: 'geopolitics' }])}::jsonb`
            },
            orderBy: {
                startDate: 'desc', // Show most recent events first
            },
            // Consider adding pagination options (skip, take) for larger datasets
            take: 100, // Limit the number of results returned by the API
        });
        console.log(`Retrieved ${events.length} stored Polymarket events from DB.`);
        return events;
    } catch (error) {
        console.error('Error retrieving stored Polymarket events:', (error as Error).message);
        throw new Error(`Failed to retrieve stored events: ${(error as Error).message}`);
    }
}

// You can remove the commented out express controller functions from your original file
// as we will create a new controller file below.