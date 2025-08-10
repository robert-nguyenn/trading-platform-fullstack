// src/routes/routeDefinitions.ts
import { Request, Response, RequestHandler } from 'express'; // Import Request and Response types

// Use Express's RequestHandler type
type AsyncRequestHandler = RequestHandler;

// The interface for defining API endpoints
export interface EndpointDefinition {
    path: string; // The route path (e.g., '/inflationcpi')
    method: 'get' | 'post' | 'put' | 'delete' | 'patch'; // HTTP method
    // Use our custom type instead of the potentially stricter RequestHandler from express
    handler: AsyncRequestHandler;
    description: string; // User-friendly description of the endpoint
    fredSeriesId?: string; // Specific FRED series ID, if applicable
    tags?: string[]; // Optional tags for grouping/filtering
    // Add other relevant metadata fields as needed
}