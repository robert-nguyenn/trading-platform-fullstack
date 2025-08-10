// src/controllers/strategyController.ts
import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma/prisma'; // Adjust path if needed
import { Prisma, StrategyBlock, Condition, Action } from '@prisma/client';
import {
  CreateStrategyDto, UpdateStrategyDto, CreateBlockDto, UpdateBlockDto,
} from './strategyApiTypes'
import axios from 'axios';
import { getBrokerAlpacaAuth, ALPACA_BASE_URL } from '../../utils/authUtils';

// Helper function to get user's available funds from Alpaca
const getUserAvailableFunds = async (userId: string): Promise<number> => {
  try {
    // Get user's trading ID from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tradingId: true }
    });

    if (!user?.tradingId) {
      throw new Error('User trading ID not found');
    }

    // Get account balance from Alpaca
    const response = await axios.get(
      `${ALPACA_BASE_URL}/trading/accounts/${user.tradingId}/account`,
      {
        headers: {
          Authorization: getBrokerAlpacaAuth(),
          'Accept': 'application/json'
        }
      }
    );

    const buyingPower = parseFloat(response.data.buying_power || '0');
    return buyingPower;
  } catch (error) {
    console.error('Error fetching user available funds:', error);
    throw new Error('Failed to fetch available funds');
  }
};

// Helper function to calculate total allocated amount across all strategies for a user
const getTotalAllocatedAmount = async (userId: string, excludeStrategyId?: string): Promise<number> => {
  const strategies = await prisma.strategy.findMany({
    where: {
      userId,
      id: excludeStrategyId ? { not: excludeStrategyId } : undefined,
    },
    select: { allocatedAmount: true }
  });

  return strategies.reduce((total, strategy) => {
    return total + (strategy.allocatedAmount || 0);
  }, 0);
};


export const createStrategy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // 1. Get user ID from authenticated user object (populated by middleware)
  const firebaseUser = req.user; // Assuming middleware adds 'user' to Request
  const userId = firebaseUser?.uid;

  // 2. Check if user ID exists (Unauthorized if not)
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized: no user in token' });
    return;
  }

  // 3. Get strategy details from request body (excluding userId)
  const { name, description } = req.body as Omit<CreateStrategyDto, 'userId'>; // Use Omit if needed

  // 4. Add input validation (e.g., using Zod) - Keep the TODO
  // TODO: Add input validation for name and description

  // 5. Validate required fields from the body
  if (!name) {
    // Only 'name' is strictly required from the body now
    res.status(400).json({ error: 'Strategy name is required' });
    return;
  }

  try {
    // 6. Optionally: Validate the extracted userId corresponds to a user in your DB
    // This ensures that the Firebase user has a related record in your application's User table.
    // This step depends on whether your User table's 'id' field stores the Firebase UID.
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      // Use 403 Forbidden or 404 Not Found depending on your desired semantics.
      // 403 might be better if the user is authenticated but not provisioned in your system.
      res.status(403).json({ error: `User with ID ${userId} not found or not provisioned in the system` });
      return;
    }

    // 7. Create Strategy and a default ROOT block in a transaction (using the extracted userId)
    const strategy = await prisma.$transaction(async (tx) => {
      const newStrategy = await tx.strategy.create({
        data: {
          userId: userId, // Use the userId from the token
          name,
          description,
          isActive: false, // Default to inactive
        },
      });

      // Create the ROOT block
      const rootBlock = await tx.strategyBlock.create({
          data: {
              strategyId: newStrategy.id,
              blockType: 'ROOT',
              parameters: {}, // Root block might not need parameters initially
              order: 0,
          }
      });

      // Link the ROOT block to the strategy
      await tx.strategy.update({
          where: { id: newStrategy.id },
          data: { rootBlockId: rootBlock.id }
      });

      // Return the strategy with the rootBlockId populated
      // Fetch it again to ensure rootBlockId is included
      return tx.strategy.findUniqueOrThrow({
           where: { id: newStrategy.id },
           include: { rootBlock: true } // Include the root block in the response
      });
    });

    res.status(201).json(strategy);
  } catch (error) {
    console.error("Error creating strategy:", error); // Log the error for debugging
    next(error); // Pass error to error handling middleware
  }
};


export const getStrategies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const firebaseUser = req.user;
  const userId = firebaseUser?.uid;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized: no user in token' });
    return;
  }

  try {
    const strategies = await prisma.strategy.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        name: true,
        description: true,
        isActive: true,
        rootBlockId: true,
        allocatedAmount: true,
        createdAt: true,
        updatedAt: true,
        // Exclude 'blocks' relation here for brevity
    }
    });
    res.status(200).json(strategies);
    return;
  } catch (err) {
    next(err);
  }
};

export const getStrategyById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { strategyId } = req.params;

  // Define the recursive include structure for blocks
  const blockIncludeRecursive = Prisma.validator<Prisma.StrategyBlockInclude>()({
      condition: true,
      action: true,
      children: {
          orderBy: { order: 'asc' },
          include: {
              condition: true,
              action: true,
              children: { // Level 2 children
                  orderBy: { order: 'asc' },
                  include: {
                      condition: true,
                      action: true,
                      children: { // Level 3 children - Adjust depth as needed
                           orderBy: { order: 'asc' },
                           include: {
                               condition: true,
                               action: true,
                               // children: true // Self-reference for deeper levels
                           }
                      }
                  }
              }
          }
      }
  });


  try {
      const strategy = await prisma.strategy.findUnique({
          where: { id: strategyId },
          include: {
              // Include the rootBlock and apply the recursive include to it
              rootBlock: {
                  include: blockIncludeRecursive
              },
              // Optionally include the flat list if needed elsewhere, but tree is primary
              // blocks: { include: { condition: true, action: true }, orderBy: { order: 'asc'} }
          },
      });

      if (!strategy) {
          res.status(404).json({ error: `Strategy with ID ${strategyId} not found` });
          return;
      }

      // The nested tree structure is now available under strategy.rootBlock
      res.status(200).json(strategy);

  } catch (error) {
      console.error(`Error fetching strategy ${strategyId}:`, error);
      next(error);
  }
};

export const updateStrategy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { strategyId } = req.params;
  const { name, description, isActive, allocatedAmount } = req.body as Partial<UpdateStrategyDto>;
  
  // Get user ID from token
  const firebaseUser = req.user;
  const userId = firebaseUser?.uid;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized: no user in token' });
    return;
  }

  // TODO: Add input validation
  const dataToUpdate: Prisma.StrategyUpdateInput = {};

  if (name !== undefined) {
    dataToUpdate.name = name;
  }
  if (description !== undefined) {
    dataToUpdate.description = description;
  }
  if (isActive !== undefined) {
    dataToUpdate.isActive = isActive;
  }

  // Handle allocation amount with validation
  if (allocatedAmount !== undefined) {
    try {
      // Validate allocation amount
      if (allocatedAmount < 0) {
        res.status(400).json({ error: 'Allocation amount cannot be negative' });
        return;
      }

      // Get user's available funds
      const availableFunds = await getUserAvailableFunds(userId);
      
      // Get total currently allocated amount (excluding this strategy)
      const totalAllocated = await getTotalAllocatedAmount(userId, strategyId);
      
      // Calculate what would be the new total allocation
      const newTotalAllocation = totalAllocated + allocatedAmount;
      
      // Check if new allocation exceeds available funds
      if (newTotalAllocation > availableFunds) {
        const maxAllowable = availableFunds - totalAllocated;
        res.status(400).json({ 
          error: 'Insufficient funds for allocation',
          details: {
            requestedAmount: allocatedAmount,
            availableFunds,
            currentlyAllocated: totalAllocated,
            maxAllowableForThisStrategy: Math.max(0, maxAllowable)
          }
        });
        return;
      }

      dataToUpdate.allocatedAmount = allocatedAmount;
    } catch (error: any) {
      console.error('Error validating allocation:', error);
      res.status(500).json({ 
        error: 'Failed to validate allocation',
        details: error.message 
      });
      return;
    }
  }

  try {
    const updatedStrategy = await prisma.strategy.update({
      where: { id: strategyId },
      data: dataToUpdate,
    });
    res.status(200).json(updatedStrategy);
  } catch (error) {
     // Handle specific Prisma error for record not found
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        res.status(404).json({ error: `Strategy with ID ${strategyId} not found` });
        return;
    }
    next(error);
  }
};

export const deleteStrategy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { strategyId } = req.params;

  try {
    // Deletion cascades based on schema (Strategy -> StrategyBlock)
    await prisma.strategy.delete({
      where: { id: strategyId },
    });
    res.status(204).send(); // No content on successful delete
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        res.status(404).json({ error: `Strategy with ID ${strategyId} not found` });
        return;
    }
    next(error);
  }
};

// Get user's allocation summary
export const getUserAllocationSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const firebaseUser = req.user;
  const userId = firebaseUser?.uid;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized: no user in token' });
    return;
  }

  try {
    // Get available funds from Alpaca
    const availableFunds = await getUserAvailableFunds(userId);
    
    // Get total allocated across all strategies
    const totalAllocated = await getTotalAllocatedAmount(userId);
    
    // Get individual strategy allocations
    const strategies = await prisma.strategy.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        allocatedAmount: true,
        isActive: true,
      }
    });

    const allocations = strategies.filter(s => s.allocatedAmount && s.allocatedAmount > 0);
    const availableToAllocate = Math.max(0, availableFunds - totalAllocated);

    res.status(200).json({
      availableFunds,
      totalAllocated,
      availableToAllocate,
      allocations,
      summary: {
        totalStrategies: strategies.length,
        activeStrategies: strategies.filter(s => s.isActive).length,
        strategiesWithAllocation: allocations.length,
      }
    });
  } catch (error: any) {
    console.error('Error fetching allocation summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch allocation summary',
      details: error.message 
    });
  }
};