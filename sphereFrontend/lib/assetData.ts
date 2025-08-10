// src/lib/assetData.ts
import { AssetClass } from './types';

export interface DetailedAsset {
    symbol: string;
    name: string;
    assetClass: AssetClass | null;
    exchange: string | null;
}

// Mock data - Replace with actual data fetching later
export const MOCK_DETAILED_ASSETS: DetailedAsset[] = [
    { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", assetClass: AssetClass.ETF, exchange: "ARCA" },
    { symbol: "IBM", name: "IBM Common Stock", assetClass: AssetClass.US_EQUITY, exchange: "NYSE" },
    { symbol: "AAPL", name: "Apple Inc.", assetClass: AssetClass.US_EQUITY, exchange: "NASDAQ" },
    { symbol: "MSFT", name: "Microsoft Corporation", assetClass: AssetClass.US_EQUITY, exchange: "NASDAQ" },
    { symbol: "AMZN", name: "Amazon.com Inc.", assetClass: AssetClass.US_EQUITY, exchange: "NASDAQ" },
    { symbol: "GOOGL", name: "Alphabet Inc. (Class A)", assetClass: AssetClass.US_EQUITY, exchange: "NASDAQ" },
    { symbol: "TSLA", name: "Tesla, Inc.", assetClass: AssetClass.US_EQUITY, exchange: "NASDAQ" },
    { symbol: "BTC-USD", name: "Bitcoin USD", assetClass: AssetClass.CRYPTO, exchange: "Various" },
    { symbol: "ETH-USD", name: "Ethereum USD", assetClass: AssetClass.CRYPTO, exchange: "Various" },
    { symbol: "AGG", name: "iShares Core U.S. Aggregate Bond ETF", assetClass: AssetClass.BOND, exchange: "ARCA"},
    { symbol: "GLD", name: "SPDR Gold Shares", assetClass: AssetClass.ETF, exchange: "ARCA"}, // Example Commodity ETF
    // Add more diverse assets
];

// Helper to find asset details by symbol (useful for display)
export const findAssetBySymbol = (symbol: string | null): DetailedAsset | undefined => {
    if (!symbol) return undefined;
    return MOCK_DETAILED_ASSETS.find(asset => asset.symbol === symbol);
};

// You might also want a helper to get a display label
export const getAssetLabel = (asset: DetailedAsset | undefined): string => {
    return asset ? `${asset.symbol} - ${asset.name}` : "Select asset";
};