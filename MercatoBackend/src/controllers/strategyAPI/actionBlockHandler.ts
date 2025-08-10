// src/controllers/strategyAPI/actionBlockHandler.ts

import { Prisma, Action, ActionType } from '@prisma/client';
import { ActionBlockParameters } from "./strategyApiTypes"; // Import the new type
import prisma from '../../utils/prisma/prisma';

/**
 * Maps a string action type (from block parameters) to the Prisma ActionType enum.
 * Throws an error if the type is invalid.
 */
const mapToActionTypeEnum = (actionTypeString: keyof typeof ActionType): ActionType => {
    const mappedType = ActionType[actionTypeString];
    if (!mappedType) {
        throw new Error(`Invalid actionType string: ${actionTypeString}. Valid types are: ${Object.keys(ActionType).join(', ')}`);
    }
    return mappedType;
};

/**
 * Extracts the core action parameters from the block's parameters,
 * excluding the 'actionType' field itself, which is stored directly on the Action record.
 */
const extractActionSpecificParameters = (blockParams: ActionBlockParameters): Prisma.InputJsonValue => {
    const { actionType, ...specificParams } = blockParams;
    // Return the remaining parameters, suitable for storing in the Action record's 'parameters' JSON field.
    // Ensure it's a valid JSON structure (Prisma handles the object).
    return specificParams as Prisma.InputJsonValue;
};

/**
 * Builds the data payload required for creating or updating an Action record in Prisma.
 * @param blockParams The validated parameters from the StrategyBlock.
 * @returns Prisma.ActionUncheckedCreateInput | Prisma.ActionUncheckedUpdateInput - Data ready for Prisma create/update.
 */
const buildActionInputData = (
    blockParams: ActionBlockParameters
): Omit<Prisma.ActionUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt'> => { // Exclude fields Prisma handles
    const actionTypeEnum = mapToActionTypeEnum(blockParams.actionType);
    const specificParameters = extractActionSpecificParameters(blockParams);

    return {
        actionType: actionTypeEnum,
        parameters: specificParameters,
        // 'order' is typically related to block execution, not the action definition itself.
        // If needed, it could be passed differently, but likely not stored on the Action record.
        // order: blockParams.order || 0, // Default if needed, but likely belongs on StrategyBlock
    };
};

/**
 * Creates or updates an Action record based on the parameters from an ACTION StrategyBlock.
 * If existingActionId is provided, it updates the existing record. Otherwise, it creates a new one.
 *
 * @param parameters The parameters object from the ACTION StrategyBlock.
 * @param existingActionId Optional ID of an existing Action record to update.
 * @returns The ID of the created or updated Action record.
 * @throws Error if parameters are invalid or database operation fails.
 */
export const createOrUpdateAction = async (
    parameters: ActionBlockParameters, // Use the specific validated type
    existingActionId?: string | null
): Promise<string> => {

    const actionInputData = buildActionInputData(parameters);

    let actionRecord: Action;

    if (existingActionId) {
        // Update existing Action record
        console.log(`Updating existing action ${existingActionId}`);
        try {
            actionRecord = await prisma.action.update({
                where: { id: existingActionId },
                data: actionInputData,
            });
        } catch (error) {
             if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                 // Record to update not found, potentially create a new one?
                 // Or re-throw / handle as an error depending on desired behavior.
                 console.error(`Action record with ID ${existingActionId} not found for update.`)
                 throw new Error(`Action record with ID ${existingActionId} not found.`);
             }
             console.error(`Error updating action ${existingActionId}:`, error);
             throw error; // Re-throw other errors
        }
    } else {
        // Create new Action record
        // console.log(`Creating new action`);
        try {
            actionRecord = await prisma.action.create({
                data: actionInputData,
            });
        } catch (error) {
             console.error(`Error creating new action:`, error);
             throw error; // Re-throw errors
        }
    }

    // console.log(`Upserted action record ${actionRecord.id} with type ${actionRecord.actionType}`);
    return actionRecord.id; // Return the ID of the action record
};