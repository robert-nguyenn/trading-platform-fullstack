// import { Request, Response } from 'express';
// import axios from 'axios';

// let POLYMARKET_URL = 'https://gamma-api.polymarket.com';

// interface Market {
//     id: string;
//     category: string;
//     active: boolean;
// }

// export const getPolymarketEvents = async (_: Request, res: Response) => {
//   try {
//     const response = await axios.get(`${POLYMARKET_URL}/events`);
//     if (response.status !== 200) {
//       throw new Error(`Failed to fetch Polymarket events: ${response.statusText}`);
//     }
//     res.status(200).json({
//       status: 'OK',
//       data: response.data,
//     });
//   } catch (error) {
//     console.error('Error fetching Polymarket events:', (error as Error).message);
//     res.status(500).json({
//       status: 'ERROR',
//       message: 'Failed to fetch Polymarket events',
//       error: (error as Error).message,
//     });
//   }
// };

// // Get specific event by ID
// export const getPolymarketEventById = async (req: Request, res: Response) => {
//   const eventId = req.params.id;
//   try {
//     const response = await axios.get(`${POLYMARKET_URL}/events/${eventId}`);
//     res.status(200).json({
//       status: 'OK',
//       data: response.data,
//     });
//   } catch (error) {
//     console.error(`Error fetching Polymarket event ${eventId}:`, (error as Error).message);
//     res.status(500).json({
//       status: 'ERROR',
//       message: `Failed to fetch Polymarket event ${eventId}`,
//       error: (error as Error).message,
//     });
//   }
// };

// export const getPolymarketMarkets = async (req: Request, res: Response) => {
//   try {
//     const response = await axios.get(`${POLYMARKET_URL}/markets?active=true`);
//     res.status(200).json({
//       status: 'OK',
//       data: response.data,
//     });
//   } catch (error) {
//     console.error('Error fetching Polymarket markets:', (error as Error).message);
//     res.status(500).json({
//       status: 'ERROR',
//       message: 'Failed to fetch Polymarket markets',
//       error: (error as Error).message,
//     });
//   }
// };

// // Get specific market by ID
// export const getPolymarketMarketById = async (req: Request, res: Response) => {
//   const marketId = req.params.id;
//   try {
//     const response = await axios.get(`${POLYMARKET_URL}/markets/${marketId}`);
//     res.status(200).json({
//       status: 'OK',
//       data: response.data,
//     });
//   } catch (error) {
//     console.error(`Error fetching Polymarket market ${marketId}:`, (error as Error).message);
//     res.status(500).json({
//       status: 'ERROR',
//       message: `Failed to fetch Polymarket market ${marketId}`,
//       error: (error as Error).message,
//     });
//   }
// };

// export const getPolymarketCategories = async (_: Request, res: Response) => {
//   try {
//     const response = await axios.get('https://gamma-api.polymarket.com');
//     const markets = response.data;
//     const categories = Array.from(new Set(markets.map((m: any) => m.category)));
//     res.status(200).json({ status: 'OK', categories });
//   } catch (error) {
//     console.error('Error fetching Polymarket categories:', (error as Error).message);
//     res.status(500).json({
//       status: 'ERROR',
//       message: 'Failed to fetch Polymarket categories',
//       error: (error as Error).message,
//     });
//   }
// }

// src/controllers/polymarketController.ts
import { Request, Response } from 'express';
import { getStoredPolymarketEvents, fetchAndStorePolymarketEvents } from './gammaMarket'; // Import the new function

/**
 * Express controller to get stored Polymarket events from the database.
 */
export const getPolymarketEventsFromDB = async (_: Request, res: Response) => {
    try {
        // Call the service function to get events from your DB
        const events = await getStoredPolymarketEvents({ activeOnly: true }); // Example: only return active events via API

        res.status(200).json({
            status: 'OK',
            data: events,
            count: events.length,
            message: 'Successfully retrieved stored Polymarket events.',
        });
    } catch (error) {
        console.error('API Error retrieving stored Polymarket events:', (error as Error).message);
        res.status(500).json({
            status: 'ERROR',
            message: 'Failed to retrieve stored Polymarket events',
            error: (error as Error).message,
        });
    }
};

// You might add other controllers here later, e.g., to trigger a manual fetch (for testing)
export const triggerManualPolymarketFetch = async (_: Request, res: Response) => {
    try {
        // WARNING: This would trigger the fetch and store operation
        // It's usually better to have this as a scheduled job rather than a public API endpoint
        await fetchAndStorePolymarketEvents();
        res.status(200).json({ status: 'OK', message: 'Polymarket fetch/store triggered.' });
    } catch (error) {
        console.error('API Error triggering Polymarket fetch:', (error as Error).message);
        res.status(500).json({
            status: 'ERROR',
            message: 'Failed to trigger Polymarket fetch',
            error: (error as Error).message,
        });
    }
};

export const deleteAllPolymarketEvents = async (_: Request, res: Response) => {
    try{
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        const result = await prisma.polymarketEvent.deleteMany({});

        await prisma.$disconnect();

        res.status(200).json({
            status: 'OK',
            message: 'All Polymarket events deleted successfully.',
            count: result.count,
        });
    } catch (error) {
        console.error('API Error deleting Polymarket events:', (error as Error).message);
        res.status(500).json({
            status: 'ERROR',
            message: 'Failed to delete Polymarket events',
            error: (error as Error).message,
        });
    }
}