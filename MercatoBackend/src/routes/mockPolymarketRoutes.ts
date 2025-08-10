// src/routes/mockPolymarketRoutes.ts
import { Router, Request, Response } from 'express';

const router = Router();

// Mock polymarket events data
const mockPolymarketEvents = [
  {
    id: 1,
    ticker: "TRUMP2024",
    slug: "trump-wins-2024-election",
    question: "Will Donald Trump win the 2024 US Presidential Election?",
    description: "Market resolves to Yes if Donald Trump is declared the winner of the 2024 Presidential Election.",
    image: "https://images.unsplash.com/photo-1551836022-8b2858c9c69b?w=400&h=250&fit=crop&auto=format",
    active: true,
    closed: false,
    startDate: "2024-01-01T00:00:00Z",
    endDate: "2024-11-05T23:59:59Z",
    volume: 15420000,
    liquidity: 2100000,
    tags: [
      { id: 2, name: "Politics", slug: "politics", label: "Politics" },
      { id: 126, name: "Trump", slug: "trump", label: "Trump" }
    ],
    rawData: {},
    fetchedAt: "2024-01-15T12:00:00Z"
  },
  {
    id: 2,
    ticker: "FED2024",
    slug: "fed-rate-cut-march-2024",
    question: "Will the Federal Reserve cut interest rates in March 2024?",
    description: "Market resolves to Yes if the Fed announces a rate cut at their March 2024 meeting.",
    image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=250&fit=crop&auto=format",
    active: true,
    closed: false,
    startDate: "2024-02-01T00:00:00Z",
    endDate: "2024-03-20T23:59:59Z",
    volume: 8750000,
    liquidity: 1200000,
    tags: [
      { id: 100196, name: "Fed Rates", slug: "fed-rates", label: "Fed Rates" },
      { id: 100328, name: "Economy", slug: "economy", label: "Economy" }
    ],
    rawData: {},
    fetchedAt: "2024-02-01T12:00:00Z"
  },
  {
    id: 3,
    ticker: "INFLATION2024",
    slug: "inflation-below-3-percent-2024",
    question: "Will US inflation fall below 3% in 2024?",
    description: "Market resolves to Yes if the Consumer Price Index shows inflation below 3% for any month in 2024.",
    image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=250&fit=crop&auto=format",
    active: true,
    closed: false,
    startDate: "2024-01-01T00:00:00Z",
    endDate: "2024-12-31T23:59:59Z",
    volume: 6300000,
    liquidity: 890000,
    tags: [
      { id: 702, name: "Inflation", slug: "inflation", label: "Inflation" },
      { id: 100328, name: "Economy", slug: "economy", label: "Economy" }
    ],
    rawData: {},
    fetchedAt: "2024-01-01T12:00:00Z"
  },
  {
    id: 4,
    ticker: "CHINA2024",
    slug: "china-gdp-growth-2024",
    question: "Will China's GDP growth exceed 5% in 2024?",
    description: "Market resolves to Yes if China reports GDP growth above 5% for the full year 2024.",
    image: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=250&fit=crop&auto=format",
    active: true,
    closed: false,
    startDate: "2024-01-01T00:00:00Z",
    endDate: "2024-12-31T23:59:59Z",
    volume: 4200000,
    liquidity: 650000,
    tags: [
      { id: 303, name: "China", slug: "china", label: "China" },
      { id: 100265, name: "Geopolitics", slug: "geopolitics", label: "Geopolitics" }
    ],
    rawData: {},
    fetchedAt: "2024-01-01T12:00:00Z"
  },
  {
    id: 5,
    ticker: "OIL2024",
    slug: "oil-price-above-100-2024",
    question: "Will oil prices reach $100/barrel in 2024?",
    description: "Market resolves to Yes if WTI crude oil reaches or exceeds $100 per barrel at any point in 2024.",
    image: "https://images.unsplash.com/photo-1615118265620-b8e007e30c1f?w=400&h=250&fit=crop&auto=format",
    active: true,
    closed: false,
    startDate: "2024-01-01T00:00:00Z",
    endDate: "2024-12-31T23:59:59Z",
    volume: 3800000,
    liquidity: 520000,
    tags: [
      { id: 309, name: "Oil", slug: "oil", label: "Oil" },
      { id: 101031, name: "Commodities", slug: "commodities", label: "Commodities" }
    ],
    rawData: {},
    fetchedAt: "2024-01-01T12:00:00Z"
  },
  {
    id: 6,
    ticker: "BITCOIN2024",
    slug: "bitcoin-100k-2024",
    question: "Will Bitcoin reach $100,000 in 2024?",
    description: "Market resolves to Yes if Bitcoin reaches or exceeds $100,000 USD at any point in 2024.",
    image: "https://images.unsplash.com/photo-1640826509319-3f16b2c8df14?w=400&h=250&fit=crop&auto=format",
    active: true,
    closed: false,
    startDate: "2024-01-01T00:00:00Z",
    endDate: "2024-12-31T23:59:59Z",
    volume: 12500000,
    liquidity: 1800000,
    tags: [
      { id: 101031, name: "Commodities", slug: "commodities", label: "Commodities" },
      { id: 100328, name: "Economy", slug: "economy", label: "Economy" }
    ],
    rawData: {},
    fetchedAt: "2024-01-01T12:00:00Z"
  },
  {
    id: 7,
    ticker: "CONGRESS2024",
    slug: "republicans-control-house-2024",
    question: "Will Republicans control the House after 2024 elections?",
    description: "Market resolves to Yes if Republicans have majority control of the House of Representatives after the 2024 elections.",
    image: "https://images.unsplash.com/photo-1579762593127-22a1bdf93df7?w=400&h=250&fit=crop&auto=format",
    active: true,
    closed: false,
    startDate: "2024-01-01T00:00:00Z",
    endDate: "2024-11-05T23:59:59Z",
    volume: 7200000,
    liquidity: 980000,
    tags: [
      { id: 514, name: "Congress", slug: "congress", label: "Congress" },
      { id: 2, name: "Politics", slug: "politics", label: "Politics" }
    ],
    rawData: {},
    fetchedAt: "2024-01-01T12:00:00Z"
  },
  {
    id: 8,
    ticker: "TRADE2024",
    slug: "us-china-trade-war-escalation-2024",
    question: "Will the US impose new tariffs on China in 2024?",
    description: "Market resolves to Yes if the US announces significant new tariffs on Chinese goods in 2024.",
    image: "https://images.unsplash.com/photo-1575484148447-a2bc5da2e88c?w=400&h=250&fit=crop&auto=format",
    active: true,
    closed: false,
    startDate: "2024-01-01T00:00:00Z",
    endDate: "2024-12-31T23:59:59Z",
    volume: 5400000,
    liquidity: 720000,
    tags: [
      { id: 101761, name: "Trade War", slug: "trade-war", label: "Trade War" },
      { id: 101758, name: "Tariffs", slug: "tariffs", label: "Tariffs" },
      { id: 303, name: "China", slug: "china", label: "China" }
    ],
    rawData: {},
    fetchedAt: "2024-01-01T12:00:00Z"
  }
];

// GET /stored-events - Get all stored polymarket events
router.get('/stored-events', (req: Request, res: Response) => {
  try {
    res.status(200).json({
      status: 'OK',
      data: mockPolymarketEvents,
      count: mockPolymarketEvents.length,
      message: 'Successfully retrieved stored Polymarket events.'
    });
  } catch (error) {
    console.error('Error fetching mock polymarket events:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to retrieve stored Polymarket events',
      error: (error as Error).message
    });
  }
});

// GET /events/:id - Get specific event by ID  
router.get('/events/:id', (req: Request, res: Response): void => {
  try {
    const eventId = parseInt(req.params.id);
    const event = mockPolymarketEvents.find(e => e.id === eventId);
    
    if (!event) {
      res.status(404).json({
        status: 'ERROR',
        message: `Event with ID ${eventId} not found`
      });
      return;
    }

    res.status(200).json({
      status: 'OK',
      data: event
    });
  } catch (error) {
    console.error('Error fetching mock polymarket event:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to retrieve Polymarket event',
      error: (error as Error).message
    });
  }
});

// POST /fetch - Trigger manual fetch (mock)
router.post('/fetch', (req: Request, res: Response) => {
  try {
    // Mock successful fetch trigger
    res.status(200).json({
      status: 'OK',
      message: 'Polymarket fetch/store triggered (mock).'
    });
  } catch (error) {
    console.error('Error in mock polymarket fetch:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to trigger Polymarket fetch',
      error: (error as Error).message
    });
  }
});

// DELETE /delete-all - Delete all events (mock)
router.delete('/delete-all', (req: Request, res: Response) => {
  try {
    // Mock successful deletion
    res.status(200).json({
      status: 'OK',
      message: 'All Polymarket events deleted successfully (mock).',
      count: mockPolymarketEvents.length
    });
  } catch (error) {
    console.error('Error in mock polymarket delete:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to delete Polymarket events',
      error: (error as Error).message
    });
  }
});

export default router;
