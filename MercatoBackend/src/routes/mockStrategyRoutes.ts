// src/routes/mockStrategyRoutes.ts
import { Router, Request, Response } from 'express';

const router = Router();

// Mock Strategy Allocation Summary
router.get('/allocation-summary', (req: Request, res: Response) => {
  res.json({
    availableFunds: 102764.00,
    totalAllocated: 79838.25,
    availableToAllocate: 22925.75,
    allocations: [
      {
        id: "growth-strategy-1",
        name: "Tech Growth Strategy",
        allocatedAmount: 35420.50,
        isActive: true
      },
      {
        id: "value-strategy-2", 
        name: "Dividend Value Strategy",
        allocatedAmount: 28650.75,
        isActive: true
      },
      {
        id: "momentum-strategy-3",
        name: "Momentum Trading",
        allocatedAmount: 15767.00,
        isActive: true
      }
    ],
    summary: {
      totalStrategies: 3,
      activeStrategies: 3,
      strategiesWithAllocation: 3
    }
  });
});

// Mock Strategy List
router.get('/', (req: Request, res: Response) => {
  res.json([
    {
      id: "growth-strategy-1",
      name: "Tech Growth Strategy",
      description: "Focuses on high-growth technology stocks with strong fundamentals",
      type: "growth",
      risk_level: "high",
      allocation: 35420.50,
      performance: {
        total_return: 2840.25,
        return_percentage: 8.72,
        ytd_return: 12.45,
        max_drawdown: -5.23,
        sharpe_ratio: 1.34,
        volatility: 18.67
      },
      holdings: [
        { symbol: "AAPL", allocation: 40, current_price: 188.00 },
        { symbol: "MSFT", allocation: 35, current_price: 345.00 },
        { symbol: "NVDA", allocation: 25, current_price: 915.00 }
      ],
      created_at: "2024-01-15T10:30:00Z",
      updated_at: new Date().toISOString(),
      status: "active"
    },
    {
      id: "value-strategy-2",
      name: "Dividend Value Strategy", 
      description: "Conservative approach focusing on dividend-paying value stocks",
      type: "value",
      risk_level: "medium",
      allocation: 28650.75,
      performance: {
        total_return: 1245.60,
        return_percentage: 4.55,
        ytd_return: 6.78,
        max_drawdown: -2.15,
        sharpe_ratio: 0.87,
        volatility: 12.34
      },
      holdings: [
        { symbol: "JNJ", allocation: 50, current_price: 165.50 },
        { symbol: "PG", allocation: 50, current_price: 145.80 }
      ],
      created_at: "2024-02-01T14:20:00Z",
      updated_at: new Date().toISOString(),
      status: "active"
    },
    {
      id: "momentum-strategy-3",
      name: "Momentum Trading",
      description: "Short-term momentum trading based on technical indicators",
      type: "momentum", 
      risk_level: "very_high",
      allocation: 15767.00,
      performance: {
        total_return: -432.15,
        return_percentage: -2.67,
        ytd_return: 3.21,
        max_drawdown: -8.45,
        sharpe_ratio: 0.23,
        volatility: 24.56
      },
      holdings: [
        { symbol: "TSLA", allocation: 100, current_price: 238.60 }
      ],
      created_at: "2024-03-10T09:15:00Z",
      updated_at: new Date().toISOString(),
      status: "active"
    }
  ]);
});

// Mock Create Strategy
router.post('/', (req: Request, res: Response) => {
  const { name, description, type, risk_level } = req.body;
  
  const newStrategy = {
    id: `strategy-${Date.now()}`,
    name: name || "New Strategy",
    description: description || "A new trading strategy",
    type: type || "balanced",
    risk_level: risk_level || "medium",
    allocation: 0,
    performance: {
      total_return: 0,
      return_percentage: 0,
      ytd_return: 0,
      max_drawdown: 0,
      sharpe_ratio: 0,
      volatility: 0
    },
    holdings: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: "active"
  };
  
  res.status(201).json(newStrategy);
});

// Mock Get Strategy by ID
router.get('/:strategyId', (req: Request, res: Response) => {
  const { strategyId } = req.params;
  
  // Return a mock strategy based on ID
  const strategy = {
    id: strategyId,
    name: "Tech Growth Strategy",
    description: "Focuses on high-growth technology stocks with strong fundamentals",
    type: "growth",
    risk_level: "high",
    allocation: 35420.50,
    performance: {
      total_return: 2840.25,
      return_percentage: 8.72,
      ytd_return: 12.45,
      max_drawdown: -5.23,
      sharpe_ratio: 1.34,
      volatility: 18.67
    },
    holdings: [
      { symbol: "AAPL", allocation: 40, current_price: 188.00 },
      { symbol: "MSFT", allocation: 35, current_price: 345.00 },
      { symbol: "NVDA", allocation: 25, current_price: 915.00 }
    ],
    created_at: "2024-01-15T10:30:00Z",
    updated_at: new Date().toISOString(),
    status: "active"
  };
  
  res.json(strategy);
});

// Mock Update Strategy
router.patch('/:strategyId', (req: Request, res: Response) => {
  const { strategyId } = req.params;
  const updateData = req.body;
  
  const updatedStrategy = {
    id: strategyId,
    name: updateData.name || "Updated Strategy",
    description: updateData.description || "An updated trading strategy",
    type: updateData.type || "balanced",
    risk_level: updateData.risk_level || "medium",
    allocation: updateData.allocation || 0,
    performance: {
      total_return: 0,
      return_percentage: 0,
      ytd_return: 0,
      max_drawdown: 0,
      sharpe_ratio: 0,
      volatility: 0
    },
    holdings: updateData.holdings || [],
    created_at: "2024-01-15T10:30:00Z",
    updated_at: new Date().toISOString(),
    status: updateData.status || "active"
  };
  
  res.json(updatedStrategy);
});

// Mock Delete Strategy
router.delete('/:strategyId', (req: Request, res: Response) => {
  const { strategyId } = req.params;
  res.status(204).send(); // No content response for successful deletion
});

export default router;
