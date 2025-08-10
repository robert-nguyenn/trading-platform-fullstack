// src/controllers/economicDataAPI/fredController.ts
import { Request, Response } from 'express';
// Make sure the path to fredClient is correct for your structure
import { getSeriesObservations, getReleases } from '../../services/fredClient';

/**
 * Factory function to create request handlers for specific FRED series IDs.
 * Delegates the core logic to getSeriesDataById.
 */
const createSeriesHandler = (seriesId: string) => {
  return async (req: Request, res: Response): Promise<void> => {
      if (!req.params) {
          req.params = {};
      }
      req.params.seriesId = seriesId;
      // Delegate processing and response sending to getSeriesDataById
      try {
           await getSeriesDataById(req, res);
      } catch (error) {
           // Centralized error logging happens in getSeriesDataById
           // This catch is a fallback. Avoid sending response if getSeriesDataById did.
           console.error(`Error propagated to createSeriesHandler for ${seriesId}:`, error);
           if (!res.headersSent) {
               res.status(500).json({ error: `Unhandled error in handler factory for ${seriesId}` });
           }
      }
  };
};

/**
 * Handles requests for FRED series observations, supporting optional query parameters
 * including a 'latest=true' flag to fetch only the most recent observation.
 */
export const getSeriesDataById = async (req: Request, res: Response): Promise<void> => {
  const { seriesId } = req.params;
  const queryParams: Record<string, any> = { ...req.query };

  if (!seriesId) {
    res.status(400).json({ error: 'Missing seriesId parameter in URL path' });
    return;
  }

  const getLatest = queryParams.latest === 'true' || queryParams.latest === '1';

  if (getLatest) {
    queryParams.sort_order = 'desc';
    queryParams.limit = '1';
    delete queryParams.latest;
    console.log(`Fetching latest observation for series: ${seriesId}`);
  } else {
    console.log(`Processing request for series: ${seriesId} with params:`, queryParams);
  }

  try {
    const data = await getSeriesObservations(seriesId, queryParams);
    res.json(data);
  } catch (error: any) {
    console.error(`Error in getSeriesDataById handler for ${seriesId}:`, error.message);
    const status = error.status || 500;
    res.status(status).json({
      error: `Failed to fetch data for series ${seriesId}`,
      seriesId: seriesId,
      details: error.message
    });
  }
};


// --- Specific Series Handlers (using factory) ---
// These automatically gain the 'latest' functionality via createSeriesHandler/getSeriesDataById

/**
 * @description Inflation Rate (Consumer Price Index for All Urban Consumers: All Items)
 * @fred_series_id CPIAUCSL (Monthly, Seasonally Adjusted)
 * @route GET /inflationcpi (?latest=true optional)
 */
export const getInflationCpiData = createSeriesHandler('CPIAUCSL');

/**
 * @description Interest Rates (Effective Federal Funds Rate)
 * @fred_series_id FEDFUNDS (Monthly average of daily rates)
 * @route GET /interestratefedfunds (?latest=true optional)
 */
export const getInterestRateFedFundsData = createSeriesHandler('FEDFUNDS');

/**
 * @description Consumer Confidence Index (University of Michigan: Consumer Sentiment)
 * @fred_series_id UMCSENT (Monthly)
 * @route GET /consumerconfidence (?latest=true optional)
 */
export const getConsumerConfidenceData = createSeriesHandler('UMCSENT');

/**
 * @description Purchasing Managers' Index (ISM Manufacturing PMI Composite Index)
 * @fred_series_id ISM (Monthly, Seasonally Adjusted)
 * @route GET /pmi (?latest=true optional)
 */
export const getPmiData = createSeriesHandler('ISM');

/**
 * @description Trade Balance (U.S. International Trade in Goods and Services, Balance of Payments Basis)
 * @fred_series_id BOPGSTB (Monthly, Seasonally Adjusted)
 * @route GET /tradebalance (?latest=true optional)
 */
export const getTradeBalanceData = createSeriesHandler('BOPGSTB');

/**
 * @description Government Debt (Federal Debt: Total Public Debt)
 * @fred_series_id GFDEBTN (Quarterly)
 * @route GET /govtdebt (?latest=true optional)
 */
export const getGovtDebtData = createSeriesHandler('GFDEBTN');

/**
 * @description Budget Deficit (Federal Surplus or Deficit [-])
 * @fred_series_id FYFSD (Annual)
 * @route GET /budgetdeficit (?latest=true optional)
 */
export const getBudgetDeficitData = createSeriesHandler('FYFSD');

/**
 * @description Housing Starts (Total: New Privately Owned Housing Units Started)
 * @fred_series_id HOUST (Monthly, Seasonally Adjusted Annual Rate)
 * @route GET /housingstarts (?latest=true optional)
 */
export const getHousingStartsData = createSeriesHandler('HOUST');

/**
 * @description Existing Home Sales
 * @fred_series_id EXHOSLUSM495S (Monthly, Seasonally Adjusted Annual Rate)
 * @route GET /homesalesexisting (?latest=true optional)
 */
export const getExistingHomeSalesData = createSeriesHandler('EXHOSLUSM495S');

/**
 * @description New Home Sales (New Privately Owned Houses Sold)
 * @fred_series_id HSN1F (Monthly, Seasonally Adjusted Annual Rate)
 * @route GET /homesalesnew (?latest=true optional)
 */
export const getNewHomeSalesData = createSeriesHandler('HSN1F');


/**
 * @description Commodity Price: Oil (WTI Crude Oil Price - Monthly Average)
 * @fred_series_id MCOILWTICO (Monthly, Dollars per Barrel)
 * @route GET /oilpricewti (?latest=true optional)
 */
export const getOilPriceWtiData = createSeriesHandler('MCOILWTICO');

/**
 * @description Commodity Price: Gold (London Bullion Market AM Fix - Daily)
 * @fred_series_id GOLDAMGBD228NLBM (Daily, US Dollars per Troy Ounce)
 * @route GET /goldprice (?latest=true optional)
 */
export const getGoldPriceData = createSeriesHandler('GOLDAMGBD228NLBM');

/**
 * @description Retail Sales (Advance Retail Sales: Retail Trade and Food Services)
 * @fred_series_id RSAFS (Monthly, Seasonally Adjusted)
 * @route GET /retailsales (?latest=true optional)
 */
export const getRetailSalesData = createSeriesHandler('RSAFS');

/**
 * @description Industrial Production Index
 * @fred_series_id INDPRO (Monthly, Seasonally Adjusted)
 * @route GET /industrialproduction (?latest=true optional)
 */
export const getIndustrialProductionData = createSeriesHandler('INDPRO');

/**
 * @description Currency Exchange Rate (US Dollar to Euro)
 * @fred_series_id DEXUSEU (Daily, Noon Spot Rate)
 * @route GET /exchangerateusdeur (?latest=true optional)
 */
export const getExchangeRateUsdEurData = createSeriesHandler('DEXUSEU');

/**
 * @description Producer Price Index (All Commodities)
 * @fred_series_id PPIACO (Monthly, Seasonally Adjusted)
 * @route GET /ppi (?latest=true optional)
 */
export const getPpiData = createSeriesHandler('PPIACO');

/**
 * @description Yield Curve Spread (10-Year Treasury Minus 2-Year Treasury)
 * @fred_series_id T10Y2Y (Daily, Constant Maturity)
 * @route GET /yieldcurvespread10y2y (?latest=true optional)
 */
export const getYieldCurveSpread10Y2YData = createSeriesHandler('T10Y2Y');


// --- Standalone Handlers (Refactored to use getSeriesDataById) ---
// These also gain the 'latest' functionality by delegating.

/**
 * @description Gross Domestic Product
 * @fred_series_id GDP
 * @route GET /gdp (?latest=true optional)
 */
export const getGdpData = async (req: Request, res: Response): Promise<void> => {
    if (!req.params) { req.params = {}; }
    req.params.seriesId = 'GDP'; // Set the specific series ID
    return getSeriesDataById(req, res); // Delegate to the generic handler
};

/**
 * @description Civilian Unemployment Rate
 * @fred_series_id UNRATE (Monthly, Seasonally Adjusted)
 * @route GET /unemploymentrate (?latest=true optional)
 */
export const getUnemploymentRateData = async (req: Request, res: Response): Promise<void> => {
    if (!req.params) { req.params = {}; }
    req.params.seriesId = 'UNRATE'; // Set the specific series ID
    console.log('Fetching Unemployment Rate data (UNRATE) via getSeriesDataById...'); // Log adjusted
    return getSeriesDataById(req, res); // Delegate to the generic handler
};

/**
 * @description Consumer Price Index (Example: All Items)
 * @fred_series_id CPIAUCSL (Used as default example)
 * @route GET /cpi (?latest=true optional) - Note: Endpoint uses CPIAUCSL by default
 */
export const getCPIData = async (req: Request, res: Response): Promise<void> => {
    // Defaulting to CPIAUCSL as 'CPI' itself is often too generic for FRED observations API
    // Consider using the generic /series/:seriesId endpoint or a more specific route if needed.
    if (!req.params) { req.params = {}; }
    req.params.seriesId = 'CPIAUCSL'; // Set the specific series ID
    return getSeriesDataById(req, res); // Delegate to the generic handler
};


// --- Non-Observation Handlers ---
// This handler does not fetch series observations and remains unchanged regarding 'latest'.

/**
 * @description Fetches a list of FRED economic data releases.
 * @route GET /releases
 */
export const getReleaseData = async (req: Request, res: Response): Promise<void> => {
  try {
    // Pass any query parameters from the request to the service
    const data = await getReleases(req.query);
    res.json(data);
  } catch (error: any) {
    console.error('FRED API error fetching releases:', error.message);
    const status = error.status || 500;
    res.status(status).json({
      error: 'Failed to fetch FRED releases',
      details: error.message
    });
  }
};