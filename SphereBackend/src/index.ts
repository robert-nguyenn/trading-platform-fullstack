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
const PORT = process.env.PORT || 3001;
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
import polymarketRoutes from './routes/polymarketRoutes/polymarketRoutes';

// --- API Routes ---
app.use('/api/accounts', accountsRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api', marketDataRoutes); // Base path for market data
app.use('/api/strategies', strategyRoutes);
app.use('/api', userRoutes); // Base path for user routes
app.use('/api/fred', fredRouter);
app.use('/api/polymarket', polymarketRoutes); // Base path for Polymarket API

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


// // --- Main Startup Function ---
// const startServer = async () => {
//   let server: ReturnType<typeof app.listen> | null = null;
//   try {
//       console.log('--- Starting Application ---');
//       console.log('1. Initializing Redis...');
//       await initRedis();
//       console.log('   Redis Initialized.');

//       console.log('2. Starting Scheduler Service...');
//       await startSchedulerService();
//       console.log('   Scheduler Service Started.');

//       console.log('3. Starting Fetcher Worker...');
//       await startFetcherWorker();
//       console.log('   Fetcher Worker Started.');

//       console.log('4. Starting Evaluation Service Consumer...');
//       startEvaluationConsumer().catch(err => { // Run async, don't await here
//           console.error('Evaluation Service Consumer crashed:', err);
//       });
//       console.log('   Evaluation Service Consumer Initiated.');

//       console.log('5. Starting Action Service Consumer...');
//       startActionConsumer().catch(err => { // Run async
//           console.error('Action Service Consumer crashed:', err);
//       });
//       console.log('   Action Service Consumer Initiated.');

//       console.log('6. Starting Express API Server...');
//       server = app.listen(PORT, () => { // Assign server instance here
//           console.log(`   API Server running on http://localhost:${PORT}`);
//           console.log('--- Application Started Successfully ---');
//       });

//       server.on('error', (error) => { // Handle server startup errors (like EADDRINUSE)
//           console.error('API Server error:', error);
//           throw error; // Throw to trigger shutdown logic
//       });

//   } catch (error) {
//       console.error('--- Application Failed to Start ---');
//       console.error(error);
//       // Attempt graceful shutdown of started components
//       await shutdown('STARTUP_FAILURE', server); // Pass null if server didn't start
//       process.exit(1);
//   }

//   // --- Graceful Shutdown Logic ---
// async function shutdown(signal: string, activeServer: typeof server | null) {
//     console.log(`\n--- Received ${signal}. Shutting Down Gracefully ---`);
//       // Stop accepting new connections
//       if (activeServer) {
//           console.log('1. Closing HTTP server...');
//           await new Promise<void>((resolve, reject) => {
//               activeServer.close((err) => {
//                   if (err) {
//                        console.error('   Error closing HTTP server:', err);
//                        return reject(err);
//                   }
//                   console.log('   HTTP server closed.');
//                   resolve();
//               });
//                // Force close idle connections after a timeout
//                activeServer.closeIdleConnections(); // Added in Node 18.2.0
//           });
//       } else {
//           console.log('1. HTTP server was not running.');
//       }

//       // Stop workers/services *before* closing Redis
//       console.log('2. Stopping Fetcher Worker...');
//       await stopFetcherWorker().catch(err => console.error("   Error stopping fetcher worker:", err)); // Don't close Redis here
//       console.log('   Fetcher Worker stopped.');

//       console.log('3. Stopping Scheduler Service...');
//       await stopSchedulerService().catch(err => console.error("   Error stopping scheduler:", err)); // Don't close Redis here
//       console.log('   Scheduler Service stopped.');

//       // Add stop logic for evaluation/action consumers if they have explicit stop functions

//       console.log('4. Closing Prisma connection...');
//       await prisma.$disconnect().catch(err => console.error("   Error closing Prisma:", err));
//       console.log('   Prisma connection closed.');

//       console.log('5. Closing Redis connection...');
//       await closeRedis().catch(err => console.error("   Error closing Redis:", err)); // Close Redis last
//       console.log('   Redis connection closed.');

//       console.log('--- Shutdown Complete ---');
//       process.exit(signal === 'STARTUP_FAILURE' ? 1 : 0); // Exit with appropriate code
//   };

//   // Listen for termination signals
//   process.on('SIGTERM', () => shutdown('SIGTERM', server));
//   process.on('SIGINT', () => shutdown('SIGINT', server)); // Catches Ctrl+C
// };



// --- Start the Application ---
// startServer();
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

