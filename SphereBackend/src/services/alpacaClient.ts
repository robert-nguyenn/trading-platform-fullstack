import Alpaca from "@alpacahq/alpaca-trade-api";

import dotenv from 'dotenv';

dotenv.config(); 

const ALPACA_API_KEY = process.env.ALPACA_BROKER_API_KEY;
const ALPACA_SECRET_KEY = process.env.ALPACA_BROKER_API_SECRET;
const IS_PAPER = process.env.ALPACA_IS_PAPER === 'true';
const ALPACA_URL = process.env.ALPACA_API_BASE_URL;
if (!ALPACA_API_KEY || !ALPACA_SECRET_KEY) {
  throw new Error("Missing Alpaca API credentials. Check your .env file.");
}

const alpaca = new Alpaca({
    keyId: ALPACA_API_KEY,
    secretKey: ALPACA_SECRET_KEY,
    baseUrl: ALPACA_URL,
    paper: IS_PAPER
})

// export const getAccount = async () => {
//     try {
//       return await alpaca.getAccount();
//     } catch (error) {
//       console.error('Error fetching Alpaca account:', error);
//       throw error;
//     }
//   };

// export const placeOrder = async(
//     ticker: string,
//     qty: number, 
//     side: 'buy' | 'sell'
// ) => {
//     try{
//         return await alpaca.createOrder({
//             symbol: ticker,
//             qty,
//             side, 
//             type: 'market', 
//             time_in_force: 'gtc'
//         });
//     } catch (error) {
//         console.error(`Error placing order for ${ticker}:`, error);
//         throw error;
//     }
// }

// export const subscribeToMarketData = (ticker: string, callback:(trade: any) => void) => {
//     const ws = alpaca.data_stream_v2;

//     ws.onConnect(() => {
//         console.log('Connected to Alpaca Market Data Stream');
//         ws.subscribeForTrades(['trade', ticker]); 
//     })

//     ws.onDisconnect(() => {
//         console.log('Disconnected from Alpaca Market Data Stream'); 
//     })

//     ws.onError((err) => {
//         console.log('Alpaca Websocket Error:', err)
//     });

//     ws.onStateChange((state) => {
//         console.log('Alpaca WebSocket state changed:', state);
//       });
      
//     ws.onStockTrade((trade) => {
//         if (trade.Symbol === ticker) {
//             callback(trade);
//         }
//     });
//     ws.connect
// }

export default alpaca;