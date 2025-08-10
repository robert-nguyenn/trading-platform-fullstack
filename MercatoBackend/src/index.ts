// src/index.ts
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { initRedis, closeRedis } from './utils/redisClient';
import { startSchedulerService, stopSchedulerService } from './controllers/scheduler/schedulerService';
import { startFetcherWorker, stopFetcherWorker } from './workers/fetcherWorker';
import { startConsumer as startEvaluationConsumer } from './controllers/evaluationService/consumer';
import { startActionConsumer } from './controllers/actionService/consumer';
import { EndpointDefinition } from './routes/routeDefinitions';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3002;
console.log(`Attempting to run on PORT ${PORT}`);

// --- Middleware ---
app.use(cors());
import axios from 'axios';
app.use(express.json()); // Make sure this is before routes

// --- Route Imports ---
import accountsRoutes from './routes/brokerRoutes/accountsRoutes';
import marketDataRoutes from './routes/marketDataRoutes/marketDataRoutes';
import tradingRoutes from './routes/brokerRoutes/tradingRoutes';
import strategyRoutes from './routes/strategyRoutes/strategyRoutes';
import userRoutes from './routes/userRoutes/userRoutes';
import fredRouter, { fredApiRoutes } from './routes/fredRoutes/fredRoutes'; // Import named export too
import polymarketRoutes from './routes/mockPolymarketRoutes';
import mockDataRoutes from './routes/mockDataRoutes';
import mockStrategyRoutes from './routes/mockStrategyRoutes';
import portfolioRoutes from './routes/portfolioRoutes';
import monitoringRoutes from './routes/monitoringRoutes';

// --- API Routes ---
app.use('/api/accounts', accountsRoutes);
app.use('/api/trading', mockDataRoutes); // Use mock data for demo
app.use('/api', marketDataRoutes); // Base path for market data
app.use('/api/strategies', mockStrategyRoutes); // Use mock strategy data for demo
app.use('/api', userRoutes); // Base path for user routes
app.use('/api/fred', fredRouter);
app.use('/api/polymarket', polymarketRoutes); // Base path for Polymarket API
app.use('/api/portfolio', portfolioRoutes); // Portfolio management routes
app.use('/api/monitoring', monitoringRoutes); // Real-time monitoring routes

// --- Health & Meta Routes ---
app.get('/health', (req: Request, res: Response) => {
    // Add more checks (Redis, DB connection?) if needed
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/test-db', async (_: Request, res: Response) => {
  try {
    // Prisma recommends against frequent connect/disconnect for short checks
    // A simple query is better if the pool is managed globally
    const result = await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'OK',
      message: 'Successfully connected to PostgreSQL via Prisma!',
      db_response: result,
    });
  } catch (err) {
    console.error("Database connection error:", (err as Error).message);
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to connect to the database via Prisma',
      error: (err as Error).message,
    });
  }
  // No finally disconnect needed if using PrismaClient globally
});

app.get('/api/fred/endpoints', (req: Request, res: Response) => {
    const fredBasePath = '/api/fred';
    type EndpointResponseItem = Omit<EndpointDefinition, 'handler'>;

    const endpointListData = fredApiRoutes
        .map((route: EndpointDefinition): EndpointResponseItem => {
            const { handler, ...rest } = route;
            const fullPath = `${fredBasePath}${rest.path}`.replace(/\/$/, '') || fredBasePath;
            return {
                ...rest,
                path: fullPath,
            };
        })
        .sort((a: EndpointResponseItem, b: EndpointResponseItem) => a.path.localeCompare(b.path));

  res.json(endpointListData);
});

// Define the IDs of your suggested indicators
const SUGGESTED_FRED_IDS = ['GDP', 'CPIAUCSL', 'UNRATE', 'FEDFUNDS', 'M2SL']; // Example IDs

app.get('/api/fred/suggestions', (req: Request, res: Response) => {
    const fredBasePath = '/api/fred';
    type EndpointResponseItem = Omit<EndpointDefinition, 'handler'>;
    const suggestions = fredApiRoutes
        .filter((route: EndpointDefinition) =>
            route.fredSeriesId && SUGGESTED_FRED_IDS.includes(route.fredSeriesId)
        )
        .map((route: EndpointDefinition): EndpointResponseItem => { // Assuming EndpointResponseItem type exists
            const { handler, ...rest } = route;
            const fullPath = `${fredBasePath}${rest.path}`.replace(/\/$/, '') || fredBasePath;
            return { ...rest, path: fullPath };
        })
        // Optional: Sort suggestions in a specific order if needed
        .sort((a, b) => SUGGESTED_FRED_IDS.indexOf(a.fredSeriesId!) - SUGGESTED_FRED_IDS.indexOf(b.fredSeriesId!));

    res.json(suggestions);
});

// --- Start the Application ---
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
