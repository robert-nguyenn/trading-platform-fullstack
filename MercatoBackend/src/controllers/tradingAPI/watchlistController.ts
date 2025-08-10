import { Request, Response } from 'express';
import alpaca from '../../services/alpacaClient';

export const getWatchlist = async (req: Request, res: Response) => {
    try {
        const watchlist = await alpaca.getWatchlists();
        res.json(watchlist);
    } catch (error: any) {
        console.error(`Error fetching Alpaca watchlist for ${req.params.watchlistId}:`, error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch watchlist' });
    }
}

export const getWatchlistById = async (req: Request, res: Response) => {
    try {
        const watchlist = await alpaca.getWatchlist(req.params.watchlistId);
        res.json(watchlist);
    } catch (error: any) {
        console.error(`Error fetching Alpaca watchlist by ID ${req.params.watchlistId}:`, error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch watchlist' });
    }
}

// Delete and get watchlist by Id and asset similar check while testing api - https://docs.alpaca.markets/reference/getwatchlistbyname-1
// export const getWatchlistAssets = async (req: Request, res: Response) => {
//     try {
//         const assets = await alpaca.getWatchlist(req.params.watchlistId);
//         res.json(assets);
//     } catch (error: any) {
//         console.error(`Error fetching Alpaca watchlist assets for ${req.params.watchlistId}:`, error.response?.data || error.message);
//         res.status(500).json({ error: 'Failed to fetch watchlist assets' });
//     }
// }

export const createWatchlist = async (req: Request, res: Response) => {
    try {
        const { name, symbols } = req.body;
        if (!name) {
          return res.status(400).json({ error: "Watchlist name is required" });
        }
    
        const watchlist = await alpaca.addWatchlist({
          name,
          symbols: symbols || [],
        });
    
        res.json(watchlist);
      } catch (error: any) {
        console.error("Error creating watchlist:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to create watchlist" });
      }
}

export const addToWatchlist = async (req: Request, res: Response) => {
    try {
        const { watchlistId, symbol } = req.body;
        if (!watchlistId || !symbol) {
          return res.status(400).json({ error: "Watchlist ID and symbol are required" });
        }
    
        const watchlist = await alpaca.addToWatchlist(watchlistId, symbol);
        res.json(watchlist);
      } catch (error: any) {
        console.error("Error adding to watchlist:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to add to watchlist" });
      }
}

export const removeFromWatchlist = async (req: Request, res: Response) => {
    try {
        const { watchlistId, symbol } = req.body;
        if (!watchlistId || !symbol) {
          return res.status(400).json({ error: "Watchlist ID and symbol are required" });
        }
    
        const watchlist = await alpaca.deleteFromWatchlist(watchlistId, symbol);
        res.json(watchlist);
      } catch (error: any) {
        console.error("Error removing from watchlist:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to remove from watchlist" });
      }
}

export const deleteWatchlist = async (req: Request, res: Response) => {
    try {
        const { watchlistId } = req.params;
        await alpaca.deleteWatchlist(watchlistId);
        res.status(200).json({ message: 'Watchlist has been deleted' });
    } catch (error: any) {
        console.error('Error deleting watchlist:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to delete watchlist' });
    }
}

export const updateWatchlist = async (req: Request, res: Response) => {
    try {
        const { watchlistId } = req.params;
        const updatedWatchlist = await alpaca.updateWatchlist(watchlistId, req.body);
        res.status(200).json(updatedWatchlist);
    } catch (error: any) {
        console.error('Error updating watchlist:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to update watchlist' });
    }
}