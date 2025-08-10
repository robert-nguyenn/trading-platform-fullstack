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
      }
    ],
    summary: {
      totalStrategies: 1,
      activeStrategies: 1,
      strategiesWithAllocation: 1
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
      allocatedAmount: 35420.50,
      isActive: true,
      userId: "mock-user-123",
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: new Date().toISOString(),
      rootBlock: {
        id: "root-block-1",
        strategyId: "growth-strategy-1",
        blockType: "ROOT",
        parameters: {},
        parentId: null,
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        children: [
          {
            id: "action-block-1",
            strategyId: "growth-strategy-1",
            blockType: "ACTION",
            parameters: {
              actionType: "BUY",
              symbol: "AAPL",
              quantity: 10,
              orderType: "MARKET",
              name: "Buy 10 units of AAPL"
            },
            parentId: "root-block-1",
            order: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            children: []
          }
        ]
      }
    }
  ]);
});

// Get individual strategy by ID
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  
  const mockStrategy = {
    id: id,
    name: `Strategy ${id}`,
    description: `Detailed strategy for ${id}`,
    status: 'active',
    isPublic: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rootBlock: {
      id: `root-block-${id}`,
      strategyId: id,
      blockType: "ROOT",
      parameters: {},
      parentId: null,
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      children: [
        {
          id: `action-block-${id}-1`,
          strategyId: id,
          blockType: "ACTION",
          parameters: {
            actionType: "BUY",
            symbol: "AAPL",
            quantity: 10,
            orderType: "MARKET",
            name: "Buy 10 units of AAPL"
          },
          parentId: `root-block-${id}`,
          order: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          children: []
        }
      ]
    }
  };

  res.json(mockStrategy);
});

// Create new strategy
router.post('/', (req: Request, res: Response) => {
  const { name, description } = req.body;
  const strategyId = `strategy-${Date.now()}`;
  
  const newStrategy = {
    id: strategyId,
    name: name || 'New Strategy',
    description: description || 'New strategy description',
    status: 'draft',
    isPublic: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rootBlock: {
      id: `root-block-${strategyId}`,
      strategyId: strategyId,
      blockType: "ROOT",
      parameters: {},
      parentId: null,
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      children: [
        {
          id: `action-block-${strategyId}-1`,
          strategyId: strategyId,
          blockType: "ACTION",
          parameters: {
            actionType: "BUY",
            symbol: "AAPL",
            quantity: 10,
            orderType: "MARKET",
            name: "Buy 10 units of AAPL"
          },
          parentId: `root-block-${strategyId}`,
          order: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          children: []
        }
      ]
    }
  };

  res.status(201).json(newStrategy);
});

// Update strategy
router.patch('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, status } = req.body;
  
  const updatedStrategy = {
    id: id,
    name: name || `Updated Strategy ${id}`,
    description: description || `Updated description for ${id}`,
    status: status || 'active',
    isPublic: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  res.json(updatedStrategy);
});

// Delete strategy
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  
  res.json({ 
    success: true, 
    message: `Strategy ${id} deleted successfully`,
    deletedId: id 
  });
});

// Block Operations
// Add block to strategy
router.post('/:strategyId/blocks', (req: Request, res: Response) => {
  const { strategyId } = req.params;
  const { blockType, parentId, parameters } = req.body;
  
  const newBlockId = `block-${Date.now()}`;
  const newBlock = {
    id: newBlockId,
    strategyId: strategyId,
    blockType: blockType || "ACTION",
    parameters: parameters || {
      actionType: "BUY",
      symbol: "AAPL",
      quantity: 1,
      orderType: "MARKET",
      name: "New action"
    },
    parentId: parentId || null,
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    children: []
  };

  res.status(201).json(newBlock);
});

// Update block
router.patch('/:strategyId/blocks/:blockId', (req: Request, res: Response) => {
  const { strategyId, blockId } = req.params;
  const { parameters } = req.body;
  
  const updatedBlock = {
    id: blockId,
    strategyId: strategyId,
    blockType: "ACTION",
    parameters: parameters || {
      actionType: "BUY",
      symbol: "AAPL",
      quantity: 1,
      orderType: "MARKET"
    },
    parentId: null,
    order: 0,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    children: []
  };

  res.json(updatedBlock);
});

// Delete block
router.delete('/:strategyId/blocks/:blockId', (req: Request, res: Response) => {
  const { strategyId, blockId } = req.params;
  
  res.json({ 
    success: true, 
    message: `Block ${blockId} deleted from strategy ${strategyId}`,
    deletedBlockId: blockId 
  });
});

// Strategy Allocation Operations
// Update strategy allocation
router.put('/:id/allocation', (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount } = req.body;
  
  res.json({
    strategyId: id,
    allocatedAmount: amount || 0,
    previousAmount: 0,
    updated: true,
    updatedAt: new Date().toISOString()
  });
});

// Get strategy allocation
router.get('/:id/allocation', (req: Request, res: Response) => {
  const { id } = req.params;
  
  res.json({
    strategyId: id,
    allocatedAmount: 0,
    maxAllowedAmount: 22925.75,
    currentPortfolioValue: 102764.00,
    allocationPercentage: 0
  });
});

export default router;