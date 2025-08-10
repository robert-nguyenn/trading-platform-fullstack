// src/routes/fredRoutes/fredRoutes.ts

import express, { Request, Response, Router } from 'express';
// Corrected import path for EndpointDefinition
import { EndpointDefinition } from '../routeDefinitions';
// Corrected import path for the controller module
import * as fredController from '../../controllers/fredAPI/fredController';

// Create the router instance
const router: Router = express.Router();

// --- Define FRED API Endpoint Configurations ---
// This array holds the structured definitions for each FRED route.
// It REFERENCES the controller functions defined in fredController.ts.
// This is the named export that index.ts needs.
export const fredApiRoutes: EndpointDefinition[] = [
    // --- Standalone Handlers (Refactored in Controller) ---
    {
        path: '/gdp',
        method: 'get',
        handler: fredController.getGdpData, // Uses the getGdpData function from the controller
        description: 'Gross Domestic Product (GDP)',
        fredSeriesId: 'GDP',
        tags: ['gdp', 'national accounts', 'growth']
    },
    {
        path: '/unemploymentrate',
        method: 'get',
        handler: fredController.getUnemploymentRateData, // Uses the getUnemploymentRateData function
        description: 'Unemployment Rate (UNRATE)',
        fredSeriesId: 'UNRATE',
        tags: ['labor market', 'unemployment']
    },
    {
        path: '/cpi', // Route path
        method: 'get',
        handler: fredController.getCPIData, // Uses the getCPIData function (which defaults to CPIAUCSL)
        description: 'Consumer Price Index (Defaults to CPIAUCSL)',
        fredSeriesId: 'CPIAUCSL', // Indicating default series used by handler
        tags: ['inflation', 'price level']
    },
    {
        path: '/interestratefedfunds',
        method: 'get',
        handler: fredController.getInterestRateFedFundsData,
        description: 'Interest Rates (FEDFUNDS)',
        fredSeriesId: 'FEDFUNDS',
        tags: ['interest rate', 'monetary policy']
    },
    {
        path: '/consumerconfidence',
        method: 'get',
        handler: fredController.getConsumerConfidenceData,
        description: 'Consumer Confidence (UMCSENT)',
        fredSeriesId: 'UMCSENT',
        tags: ['sentiment', 'consumer']
    },
    {
        path: '/pmi',
        method: 'get',
        handler: fredController.getPmiData,
        description: 'Purchasing Managers Index (ISM)',
        fredSeriesId: 'ISM',
        tags: ['manufacturing', 'business cycle']
    },
    {
        path: '/tradebalance',
        method: 'get',
        handler: fredController.getTradeBalanceData,
        description: 'Trade Balance (BOPGSTB)',
        fredSeriesId: 'BOPGSTB',
        tags: ['trade', 'international']
    },
    {
        path: '/govtdebt',
        method: 'get',
        handler: fredController.getGovtDebtData,
        description: 'Government Debt (GFDEBTN)',
        fredSeriesId: 'GFDEBTN',
        tags: ['fiscal', 'debt']
    },
    {
        path: '/budgetdeficit',
        method: 'get',
        handler: fredController.getBudgetDeficitData,
        description: 'Budget Deficit/Surplus (FYFSD)',
        fredSeriesId: 'FYFSD',
        tags: ['fiscal', 'budget']
    },
    {
        path: '/housingstarts',
        method: 'get',
        handler: fredController.getHousingStartsData,
        description: 'Housing Starts (HOUST)',
        fredSeriesId: 'HOUST',
        tags: ['housing', 'construction']
    },
    {
        path: '/homesalesexisting',
        method: 'get',
        handler: fredController.getExistingHomeSalesData,
        description: 'Existing Home Sales (EXHOSLUSM495S)',
        fredSeriesId: 'EXHOSLUSM495S',
        tags: ['housing', 'real estate']
    },
    {
        path: '/homesalesnew',
        method: 'get',
        handler: fredController.getNewHomeSalesData,
        description: 'New Home Sales (HSN1F)',
        fredSeriesId: 'HSN1F',
        tags: ['housing', 'real estate']
    },
    {
        path: '/oilpricewti',
        method: 'get',
        handler: fredController.getOilPriceWtiData,
        description: 'Oil Price WTI (MCOILWTICO)',
        fredSeriesId: 'MCOILWTICO',
        tags: ['commodity', 'energy', 'price']
    },
    {
        path: '/goldprice',
        method: 'get',
        handler: fredController.getGoldPriceData,
        description: 'Gold Price London AM Fix (GOLDAMGBD228NLBM)',
        fredSeriesId: 'GOLDAMGBD228NLBM',
        tags: ['commodity', 'precious metal', 'price']
    },
    {
        path: '/retailsales',
        method: 'get',
        handler: fredController.getRetailSalesData,
        description: 'Retail Sales (RSAFS)',
        fredSeriesId: 'RSAFS',
        tags: ['consumer', 'spending']
    },
    {
        path: '/industrialproduction',
        method: 'get',
        handler: fredController.getIndustrialProductionData,
        description: 'Industrial Production Index (INDPRO)',
        fredSeriesId: 'INDPRO',
        tags: ['production', 'industry']
    },
    {
        path: '/exchangerateusdeur',
        method: 'get',
        handler: fredController.getExchangeRateUsdEurData,
        description: 'Exchange Rate USD/EUR (DEXUSEU)',
        fredSeriesId: 'DEXUSEU',
        tags: ['forex', 'currency']
    },
    {
        path: '/ppi',
        method: 'get',
        handler: fredController.getPpiData,
        description: 'Producer Price Index (PPIACO)',
        fredSeriesId: 'PPIACO',
        tags: ['inflation', 'price level', 'producer']
    },
    {
        path: '/yieldcurvespread10y2y',
        method: 'get',
        handler: fredController.getYieldCurveSpread10Y2YData,
        description: 'Yield Curve Spread 10Y-2Y (T10Y2Y)',
        fredSeriesId: 'T10Y2Y',
        tags: ['interest rate', 'bond market', 'yield curve']
    },

    // --- Generic Series Handler ---
    {
        path: '/series/:seriesId', // The route path with a parameter
        method: 'get',
        handler: fredController.getSeriesDataById, // Uses the generic handler function
        description: 'Generic FRED Series Data by ID',
        tags: ['generic', 'fred']
    },

    // --- Non-Observation Handler ---
    {
        path: '/releases',
        method: 'get',
        handler: fredController.getReleaseData, // Uses the getReleaseData function
        description: 'FRED Economic Data Releases List',
        tags: ['metadata', 'fred']
    },
];

// --- Register Routes Dynamically ---
fredApiRoutes.forEach(route => {
    router[route.method](route.path, route.handler);
});

// --- Export the Configured Router ---
// This is the default export that index.ts uses for app.use('/api/fred', ...)
export default router;