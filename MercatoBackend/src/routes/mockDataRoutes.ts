// src/routes/mockDataRoutes.ts
import { Router, Request, Response } from 'express';

const router = Router();

// Mock Portfolio History Data
router.get('/user/portfolio/history', (req: Request, res: Response) => {
  const { period, timeframe } = req.query;
  
  // Generate realistic portfolio history data
  const generatePortfolioHistory = (days: number) => {
    const data = [];
    const startValue = 100000; // $100k starting portfolio
    let currentValue = startValue;
    const now = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Add some realistic volatility (±2% daily)
      const change = (Math.random() - 0.5) * 0.04;
      currentValue = currentValue * (1 + change);
      
      data.push({
        timestamp: date.toISOString(),
        equity: Math.round(currentValue * 100) / 100,
        profit_loss: Math.round((currentValue - startValue) * 100) / 100,
        profit_loss_pct: Math.round(((currentValue - startValue) / startValue) * 10000) / 100
      });
    }
    
    return data;
  };

  let days = 30;
  if (period === '1D') days = 1;
  else if (period === '1W') days = 7;
  else if (period === '1M') days = 30;
  else if (period === '3M') days = 90;
  else if (period === '1Y') days = 365;

  const history = generatePortfolioHistory(days);
  
  res.json({
    equity: history,
    profit_loss: history.map(h => ({
      timestamp: h.timestamp,
      profit_loss: h.profit_loss,
      profit_loss_pct: h.profit_loss_pct
    })),
    timeframe: timeframe || '1Day',
    next_page_token: null
  });
});

// Mock User Positions
router.get('/user/positions', (req: Request, res: Response) => {
  const mockPositions = [
    {
      asset_id: "b28f4066-5c6d-479b-a2af-85dc1a8f16fb",
      symbol: "AAPL",
      exchange: "NASDAQ",
      asset_class: "us_equity",
      avg_entry_price: "185.50",
      qty: "50",
      side: "long",
      market_value: "9275.00",
      cost_basis: "9275.00",
      unrealized_pl: "125.00",
      unrealized_plpc: "0.0135",
      current_price: "188.00",
      lastday_price: "186.75",
      change_today: "0.0067"
    },
    {
      asset_id: "c28f4066-5c6d-479b-a2af-85dc1a8f16fc",
      symbol: "MSFT",
      exchange: "NASDAQ", 
      asset_class: "us_equity",
      avg_entry_price: "340.25",
      qty: "25",
      side: "long",
      market_value: "8625.00",
      cost_basis: "8506.25",
      unrealized_pl: "118.75",
      unrealized_plpc: "0.0140",
      current_price: "345.00",
      lastday_price: "342.10",
      change_today: "0.0085"
    },
    {
      asset_id: "d28f4066-5c6d-479b-a2af-85dc1a8f16fd",
      symbol: "TSLA",
      exchange: "NASDAQ",
      asset_class: "us_equity", 
      avg_entry_price: "245.80",
      qty: "30",
      side: "long",
      market_value: "7374.00",
      cost_basis: "7374.00",
      unrealized_pl: "-216.00",
      unrealized_plpc: "-0.0293",
      current_price: "238.60",
      lastday_price: "241.20",
      change_today: "-0.0108"
    },
    {
      asset_id: "e28f4066-5c6d-479b-a2af-85dc1a8f16fe",
      symbol: "NVDA",
      exchange: "NASDAQ",
      asset_class: "us_equity",
      avg_entry_price: "892.30",
      qty: "10", 
      side: "long",
      market_value: "9150.00",
      cost_basis: "8923.00",
      unrealized_pl: "227.00",
      unrealized_plpc: "0.0254",
      current_price: "915.00",
      lastday_price: "905.60",
      change_today: "0.0104"
    },
    {
      asset_id: "f28f4066-5c6d-479b-a2af-85dc1a8f16ff",
      symbol: "GOOGL",
      exchange: "NASDAQ",
      asset_class: "us_equity",
      avg_entry_price: "142.85",
      qty: "40",
      side: "long", 
      market_value: "5840.00",
      cost_basis: "5714.00",
      unrealized_pl: "126.00",
      unrealized_plpc: "0.0221",
      current_price: "146.00",
      lastday_price: "144.30",
      change_today: "0.0118"
    }
  ];

  res.json(mockPositions);
});

// Mock Account Information
router.get('/user/account', (req: Request, res: Response) => {
  res.json({
    id: "mock-account-123",
    account_number: "123456789",
    status: "ACTIVE",
    currency: "USD",
    buying_power: "45850.75",
    regt_buying_power: "45850.75", 
    daytrading_buying_power: "91701.50",
    cash: "22925.75",
    cash_withdrawable: "22925.75",
    cash_transferable: "22925.75",
    portfolio_value: "102764.00",
    equity: "102764.00",
    last_equity: "101890.25",
    multiplier: "2",
    initial_margin: "0",
    maintenance_margin: "0",
    long_market_value: "79838.25",
    short_market_value: "0",
    position_market_value: "79838.25",
    last_maintenance_margin: "0",
    sma: "0",
    daytrade_count: "0"
  });
});

// Mock Account Balance - Add this endpoint for account overview
router.get('/user/account', (req: Request, res: Response) => {
  res.json({
    id: "mock-account-123",
    account_number: "123456789",
    status: "ACTIVE",
    currency: "USD",
    buying_power: "45850.75",
    regt_buying_power: "45850.75", 
    daytrading_buying_power: "91701.50",
    cash: "22925.75",
    cash_withdrawable: "22925.75",
    cash_transferable: "22925.75",
    portfolio_value: "102764.00",
    equity: "102764.00",
    last_equity: "101890.25",
    multiplier: "2",
    initial_margin: "0",
    maintenance_margin: "0",
    long_market_value: "79838.25",
    short_market_value: "0",
    position_market_value: "79838.25",
    last_maintenance_margin: "0",
    sma: "0",
    daytrade_count: "0"
  });
});

export default router;
