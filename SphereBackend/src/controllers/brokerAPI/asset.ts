import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

// Asset class types based on Alpaca API
export type AssetClass = 'us_equity' | 'crypto' | 'etf' | 'mutual_fund' | 'bond' | 'option' | 'forex';

// Interface for the detailed asset response
export interface DetailedAsset {
    symbol: string;
    name: string;
    assetClass: AssetClass | null;
    exchange: string | null;
}

// Interface for the JSON data
interface StockData {
    symbol: string;
    name: string;
}

// Load stocks data from JSON file
const loadStocksData = (): StockData[] => {
    try {
        const filePath = path.join(__dirname, '../../data/stocks.json');
        const rawData = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(rawData);
    } catch (error) {
        console.error('Error loading stocks data:', error);
        return [];
    }
};

// Get all assets with search functionality
export const getAllAssets = async (req: Request, res: Response) => {
    const { search } = req.query;

    try {
        // Load stocks data from JSON file
        const stocksData = loadStocksData();
        
        // Transform to match DetailedAsset interface
        let transformedAssets: DetailedAsset[] = stocksData.map((stock) => ({
            symbol: stock.symbol,
            name: stock.name,
            assetClass: 'us_equity' as AssetClass, // Default to us_equity for our curated list
            exchange: 'NASDAQ' // Default exchange for our curated list
        }));

        // Apply search filter if provided
        if (search && typeof search === 'string') {
            const searchTerm = search.toUpperCase();
            transformedAssets = transformedAssets.filter((asset) => 
                asset.symbol.toUpperCase().startsWith(searchTerm) ||
                asset.name.toUpperCase().includes(searchTerm.toUpperCase())
            );
            console.log(`Filtered to ${transformedAssets.length} assets matching "${search}"`);
        }

        // Limit results to prevent overwhelming responses
        const maxResults = 50;
        if (transformedAssets.length > maxResults) {
            transformedAssets = transformedAssets.slice(0, maxResults);
        }

        console.log(`Returning ${transformedAssets.length} assets`);
        res.json(transformedAssets);
    } catch (error: any) {
        console.error('Error fetching assets:', error);
        res.status(500).json({
            error: 'Failed to fetch assets'
        });
    }
};

// Get asset by symbol or asset ID
export const getAssetBySymbolOrId = async (req: Request, res: Response) => {
    const { symbol_or_asset_id } = req.params;

    try {
        // Load stocks data from JSON file
        const stocksData = loadStocksData();
        
        // Find the specific asset
        const foundStock = stocksData.find(stock => 
            stock.symbol.toUpperCase() === symbol_or_asset_id.toUpperCase()
        );

        if (!foundStock) {
            return res.status(404).json({
                error: 'Asset not found'
            });
        }

        // Transform to match DetailedAsset interface
        const transformedAsset: DetailedAsset = {
            symbol: foundStock.symbol,
            name: foundStock.name,
            assetClass: 'us_equity' as AssetClass,
            exchange: 'NASDAQ'
        };

        res.json(transformedAsset);
    } catch (error: any) {
        console.error(`Error fetching asset ${symbol_or_asset_id}:`, error);
        res.status(500).json({
            error: 'Failed to fetch asset'
        });
    }
};