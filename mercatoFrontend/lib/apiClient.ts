// src/lib/apiClient.ts
import axios from 'axios';
import { Strategy, StrategyBlockWithChildren, CreateBlockDto, UpdateBlockDto, CreateStrategyDto, 
UpdateStrategyDto, AllocationSummary } from './types';

// *** IMPORTANT: Configure the Base URL for your ACTUAL backend API ***
// If using Next.js API routes defined in `app/api/`, it's often just '/api'
// If your backend runs separately (e.g., localhost:3002), use that URL.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002/api'; // Use environment variable or default

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // TODO: Add Authorization header if needed (see Step 4)
  },
  // withCredentials: true, // Uncomment if you need to send cookies (e.g., for session auth)
});

// --- Authentication ---
// Example: Function to set token (call this after login)
export const setAuthToken = (token: string | null) => {
    if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete apiClient.defaults.headers.common['Authorization'];
    }
};
// --- OR use interceptors for more robust token handling ---

apiClient.interceptors.request.use(config => {
    const token = localStorage.getItem('authToken'); // Or get from context/state
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});


export const getStrategies = (): Promise<Strategy[]> => apiClient.get('/strategies').then(res => res.data)

// Renamed function for clarity when used directly
export const getStrategy = (strategyId: string): Promise<Strategy> =>
  apiClient.get(`/strategies/${strategyId}`).then(res => res.data);

export const createStrategy = (data: CreateStrategyDto): Promise<Strategy> =>
  apiClient.post('/strategies', data).then(res => res.data);

export const updateStrategy = (strategyId: string, data: UpdateStrategyDto): Promise<Strategy> =>
  apiClient.patch(`/strategies/${strategyId}`, data).then(res => res.data);

export const deleteStrategy = (strategyId: string): Promise<void> =>
  apiClient.delete(`/strategies/${strategyId}`);

export const createUser = (data: { email: string; id: string }): Promise<void> =>
  apiClient.post('/users', data).then(() => {});

export const createTradingAccount = (data: { email: string; given_name: string; family_name: string; id: string }): Promise<void> =>
  apiClient.post('/accounts', data).then(() => {});

// --- Block Endpoints ---
export const createStrategyBlock = (strategyId: string, data: CreateBlockDto): Promise<StrategyBlockWithChildren> =>
  apiClient.post(`/strategies/${strategyId}/blocks`, data).then(res => res.data);

export const updateStrategyBlock = (strategyId: string, blockId: string, data: UpdateBlockDto): Promise<StrategyBlockWithChildren> =>
  apiClient.patch(`/strategies/${strategyId}/blocks/${blockId}`, data).then(res => res.data);

export const deleteStrategyBlock = (strategyId: string, blockId: string): Promise<void> =>
  apiClient.delete(`/strategies/${strategyId}/blocks/${blockId}`);

// --- Allocation Management ---
export const getAllocationSummary = (): Promise<AllocationSummary> =>
  apiClient.get('/strategies/allocation-summary').then(res => res.data);

// --- Add Error Handling Interceptor (Optional but Recommended) ---
apiClient.interceptors.response.use(
    response => response, // Pass through successful responses
    error => {
        // Handle specific error codes globally if desired
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;
            
            // Only log errors that are unexpected or need attention
            if (status >= 500) {
                // Server errors should always be logged
                console.error(`Server Error ${status}:`, data);
            } else if (status === 422) {
                // 422 validation errors are usually expected and handled by calling code
                // Only log if there's meaningful error data to show
                if (data && typeof data === 'object' && Object.keys(data).length > 0) {
                    console.warn(`Validation Error ${status}:`, data);
                }
            } else if (status === 401) {
                console.warn('Authentication Error: User may need to re-authenticate');
            } else if (status === 403) {
                console.warn('Authorization Error: User does not have permission');
            } else if (status === 404) {
                // 404 errors are usually handled by calling code
                console.debug(`Resource not found: ${error.config?.url}`);
            } else {
                // Log other 4xx errors
                console.error(`API Error ${status}:`, data);
            }
        } else if (error.request) {
            console.error('Network Error:', error.request);
        } else {
            console.error('Axios Error:', error.message);
        }
        // IMPORTANT: Reject the promise so downstream .catch() blocks trigger
        return Promise.reject(error);
    }
);

export const getAccountBalance = (): Promise<any> =>
  apiClient.get(`/accounts/user/balance`).then((res) => res.data);

export const getAccountPositions = (): Promise<any> =>
  apiClient.get(`/trading/user/positions`).then((res) => res.data);

export const getAccountPortfolioHistory = (
  params: Record<string, any> = {}
): Promise<any> =>
  apiClient
    .get(`trading/user/portfolio/history`, { params })
    .then((res) => res.data);

export default apiClient; // Export the configured instance if needed elsewhere