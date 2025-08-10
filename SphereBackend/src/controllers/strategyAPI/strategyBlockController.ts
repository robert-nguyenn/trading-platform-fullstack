import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma/prisma';
import { Prisma, StrategyBlock, Condition, Action } from '@prisma/client';
import {
  isConditionIfBlockParameters,
  ConditionIfBlockParameters,
  CreateBlockDto,
  UpdateBlockDto,
  ConditionInputDto,
  ActionInputDto,
  isActionBlockParameters,
  ActionBlockParameters
} from './strategyApiTypes';
import { createOrUpdateLinkedConditions } from './conditonIF';
import { createOrUpdateAction } from './actionBlockHandler';
import { error } from 'console';

export const createStrategyBlock = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { strategyId } = req.params;
  const {
    blockType,
    parameters,
    parentId,
    order,
    conditionDetails,
    actionDetails
  } = req.body as CreateBlockDto;

  // Basic validation
  if (!blockType || parameters === undefined) {
    res.status(400).json({ error: 'blockType and parameters are required' });
    return;
  }
  if (blockType === 'ROOT') {
    res
      .status(400)
      .json({ error: 'Cannot manually create a ROOT block. It is created with the strategy.' });
    return;
  }

  try {
    // Ensure strategy exists
    const strategy = await prisma.strategy.findUnique({ where: { id: strategyId } });
    if (!strategy) {
      res.status(404).json({ error: `Strategy with ID ${strategyId} not found` });
      return;
    }

    // Ensure parent (if any) belongs to the same strategy
    if (parentId) {
      const parentBlock = await prisma.strategyBlock.findUnique({ where: { id: parentId } });
      if (!parentBlock || parentBlock.strategyId !== strategyId) {
        res
          .status(400)
          .json({
            error: `Parent block with ID ${parentId} not found or does not belong to strategy ${strategyId}`
          });
        return;
      }
    }

    // Pre-create Condition/Action for special block types
    let conditionId: string | undefined;
    let actionId: string | undefined;

    // if (blockType === 'CONDITION_IF') {
    //   if (!isConditionIfBlockParameters(parameters)) {
    //     res
    //       .status(400)
    //       .json({
    //         error: 'Invalid parameters structure for CONDITION_IF block creation',
    //         expectedFormat: 'ConditionIfBlockParameters',
    //         receivedParameters: parameters
    //       });
    //     return;
    //   }
    //   conditionId = await createOrUpdateLinkedConditions(
    //     parameters as ConditionIfBlockParameters
    //   );
    // }

    // if (blockType === 'ACTION') {
    //   if (!isActionBlockParameters(parameters)) {
    //     res
    //       .status(400)
    //       .json({
    //         error: 'Invalid parameters structure for ACTION block creation',
    //         expectedFormat: 'ActionBlockParameters',
    //         receivedParameters: parameters
    //       });
    //     return;
    //   }
    //   actionId = await createOrUpdateAction(parameters as ActionBlockParameters);
    // }

    // Create the StrategyBlock (fallback to DTO-based creation for other types)
    const newBlock = await prisma.$transaction(async (tx) => {
      // Fallback: raw conditionDetails
      if (blockType !== 'CONDITION_IF' && conditionDetails) {
        const newCondition = await tx.condition.create({ data: { ...conditionDetails } });
        conditionId = newCondition.id;
      }
      // Fallback: raw actionDetails
      if (blockType !== 'ACTION' && actionDetails) {
        const newAction = await tx.action.create({ data: { ...actionDetails } });
        actionId = newAction.id;
      }

      return tx.strategyBlock.create({
        data: {
          strategyId,
          blockType,
          parameters,
          parentId: parentId || null,
          order: order ?? 0,
          conditionId,
          actionId
        },
        include: {
          condition: true,
          action: true
        }
      });
    });

    res.status(201).json(newBlock);
  } catch (err) {
    next(err);
  }
};

export const updateStrategyBlock = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { strategyId, blockId } = req.params;
  const { parameters, parentId, order, conditionDetails, actionDetails } =
    req.body as UpdateBlockDto;

  try {
    const block = await prisma.strategyBlock.findUnique({
      where: { id: blockId },
      include: { condition: true }
    });
    if (!block || block.strategyId !== strategyId) {
      res
        .status(404)
        .json({ error: `Block with ID ${blockId} not found or does not belong to strategy ${strategyId}` });
      return;
    }

    // Basic validations
    if (block.blockType === 'ROOT' && parentId !== undefined && parentId !== block.parentId) {
      res.status(400).json({ error: 'Cannot change the parent of a ROOT block.' });
      return;
    }
    if (parentId && parentId !== block.parentId) {
      const parentBlock = await prisma.strategyBlock.findUnique({ where: { id: parentId } });
      if (!parentBlock || parentBlock.strategyId !== strategyId) {
        res
          .status(400)
          .json({
            error: `New parent block with ID ${parentId} not found or does not belong to strategy ${strategyId}`
          });
        return;
      }
    }

    // Prepare update payload
    const dataToUpdate: Prisma.StrategyBlockUpdateInput = {};
    if (parameters !== undefined) dataToUpdate.parameters = parameters;
    if (parentId !== undefined) {
      dataToUpdate.parent = parentId
        ? { connect: { id: parentId } }
        : { disconnect: true };
    }
    if (order !== undefined) dataToUpdate.order = order;

    // CONDITION_IF logic
    if (block.blockType === 'CONDITION_IF') {
      if (parameters !== undefined) {
        if (!isConditionIfBlockParameters(parameters)) {
          res
            .status(400)
            .json({
              error: 'Invalid parameters structure for CONDITION_IF block update',
              expectedFormat: 'ConditionIfBlockParameters',
              receivedParameters: parameters
            });
          return;
        }
        const primaryConditionId = await createOrUpdateLinkedConditions(
          parameters as ConditionIfBlockParameters,
          block.conditionId
        );
        dataToUpdate.condition = { connect: { id: primaryConditionId } };
      } else if (conditionDetails) {
        console.warn("Fallback: updating CONDITION_IF via 'conditionDetails'.");
        if (block.conditionId) {
          await prisma.condition.update({
            where: { id: block.conditionId },
            data: conditionDetails
          });
        } else {
          res
            .status(400)
            .json({ error: 'Cannot update via conditionDetails if no condition is linked.' });
          return;
        }
      }
    }

    // ACTION logic
    if (block.blockType === 'ACTION') {
      if (parameters !== undefined) {
        if (!isActionBlockParameters(parameters)) {
          res
            .status(400)
            .json({
              error: 'Invalid parameters structure for ACTION block update',
              expectedFormat: 'ActionBlockParameters',
              receivedParameters: parameters
            });
          return;
        }
        const newActionId = await createOrUpdateAction(
          parameters as ActionBlockParameters,
          block.actionId
        );
        dataToUpdate.action = { connect: { id: newActionId } };
      } else if (actionDetails) {
        console.warn("Fallback: updating ACTION via 'actionDetails'.");
        const validActionDetails = actionDetails as ActionInputDto;
        if (block.actionId) {
          await prisma.action.update({
            where: { id: block.actionId },
            data: validActionDetails
          });
        } else {
          const newAction = await prisma.action.create({
            data: validActionDetails
          });
          dataToUpdate.action = { connect: { id: newAction.id } };
        }
      }
    }

    const updatedBlock = await prisma.strategyBlock.update({
      where: { id: blockId },
      data: dataToUpdate,
      include: {
        condition: true,
        action: true
      }
    });
    res.status(200).json(updatedBlock);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(404).json({ error: `Block with ID ${blockId} not found` });
      return;
    }
    console.error('Error updating strategy block:', err);
    next(err);
  }
};

export const deleteStrategyBlock = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { strategyId, blockId } = req.params;

  try {
    await prisma.$transaction(async (tx) => {
      const blockToDelete = await tx.strategyBlock.findUnique({
        where: { id: blockId },
        select: { id: true, strategyId: true, blockType: true, strategyRoot: { select: { id: true } } }
      });
      if (!blockToDelete || blockToDelete.strategyId !== strategyId) {
        throw new Prisma.PrismaClientKnownRequestError(
          `Block with ID ${blockId} not found or does not belong to strategy ${strategyId}`,
          { code: 'P2025', clientVersion: 'N/A' }
        );
      }
      if (blockToDelete.blockType === 'ROOT' && blockToDelete.strategyRoot?.id === strategyId) {
        await tx.strategy.update({
          where: { id: strategyId },
          data: { rootBlockId: null }
        });
      }
      await tx.strategyBlock.delete({ where: { id: blockId } });
    });
    res.status(204).send();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(404).json({ error: `Block with ID ${blockId} not found.` });
      return;
    }
    next(err);
  }
};