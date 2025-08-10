
import { Request, Response, NextFunction } from 'express';
// import { PrismaClient } from 'prisma/prisma-client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
// Get all users
export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                createdAt: true,
                updatedAt: true,
                strategies: {
                    select: {
                        id: true,
                        name: true,
                        isActive: true,
                        createdAt: true,
                        updatedAt: true,
                    }
                }
            }
        });
        res.json(users);
    } catch (error) {
        handleError(res, error, 'Failed to fetch users');
    }
};

// Get a user by ID
export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = typeof req.user === 'string' ? req.user : undefined;
    try {
        if (!userId) {
            res.status(400).json({ error: 'Invalid user ID' });
            return;
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                tradingId: true,
                createdAt: true,
                updatedAt: true,
                strategies: {
                    select: {
                        id: true,
                        name: true,
                        isActive: true,
                        createdAt: true,
                        updatedAt: true,
                    }
                }
            }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(user);
    } catch (error) {
        handleError(res, error, 'Failed to fetch user');
    }
};

// Create a new user
export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, id } = req.body;

    if (!id || !email) {
        res.status(400).json({ error: 'ID and Email are required' });
        return;
    }

    try {
        const newUser = await prisma.user.create({
            data: {
                id,
                email,
            },
        });
        res.status(201).json(newUser);
    } catch (error) {
        handleError(res, error, 'Failed to create user');
    }
};

// Update a user
export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { userId } = req.params;
    const { email } = req.body;

    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                email,
            },
        });
        res.json(updatedUser);
    } catch (error) {
        handleError(res, error, 'Failed to update user');
    }
};

// Delete a user
export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { userId } = req.params;
    try {
        await prisma.user.delete({
            where: { id: userId },
        });
        res.status(204).send(); // No content on successful delete
    } catch (error) {
        handleError(res, error, 'Failed to delete user');
    }
};


// Get User trading ID
export const getUserTradingId = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const { userId } = req.params;
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { tradingId: true },
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.status(200).json({ tradingId: user.tradingId });
    } catch (error) {
        handleError(res, error, 'Failed to get user trading ID');
    }
};


// Utility function to handle errors
function handleError(res: Response, error: any, message: string) {
    console.error(message, error);
    res.status(500).json({ error: message });
}

