// filepath: c:\Users\Asus\Desktop\Sphere\src\middlewares\firebaseAuthMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin'; // Import admin first

// Extend the Request interface to include the 'user' property
declare global {
    namespace Express {
        interface Request {
            // Use the type from the imported admin module
            user?: admin.auth.DecodedIdToken;
        }
    }
}

// Initialize Firebase Admin SDK (ensure this runs only once)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(), // Use default credentials
    });
}

// Middleware using .then() and .catch()
export const firebaseAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Send response immediately and stop further execution in this function
        res.status(401).json({ error: 'Unauthorized: No token provided' });
        return;
    }

    const token = authHeader.split(' ')[1]; // Extract the token
    // Log the token for debugging
    admin.auth().verifyIdToken(token)
        .then((decodedToken) => {
            // Token is valid, attach user and proceed
            req.user = decodedToken;
            next(); // Pass control to the next middleware/handler
        })
        .catch((error) => {
            // Token is invalid or another error occurred
            console.error('Error verifying Firebase token:', error);
            res.status(401).json({ error: 'Unauthorized: Invalid token' });
            // Do NOT call next() here, as we've sent a response.
        });

    // Note: The function technically returns 'undefined' immediately after starting
    // the verifyIdToken promise chain. Express handles waiting for the chain.
};