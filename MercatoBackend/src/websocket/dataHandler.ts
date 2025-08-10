import WebSocket from "ws";
import { SMA } from 'technicalindicators';
import { getAlpacaMarketAuth, ALPACA_WSS_STOCK_BASE_URL } from "../utils/authUtils";

const useTestStream = process.env.ALPACA_STREAM_TEST === 'false';
const wsUrl = useTestStream ? 'wss://stream.data.alpaca.markets/v2/test' : ALPACA_WSS_STOCK_BASE_URL;

const connectToAlpacaMarketData = (): WebSocket => {
    const alpacaSocket = new WebSocket(wsUrl);
    const prices: number[] = [];
    const period = 10; // Example period for SMA

    alpacaSocket.on('open', () => {
        console.log(`Connected to Alpaca ${useTestStream ? 'Test' : 'Live'} Market Data stream`);
        const authMsg = {
            action: 'auth',
            key: process.env.ALPACA_MARKET_API_KEY,
            secret: process.env.ALPACA_MARKET_SECRET_KEY
        };
        alpacaSocket.send(JSON.stringify(authMsg));
    });

    alpacaSocket.on('message', (data: WebSocket.Data) => {
        try {
            console.log('Received message:', data.toString());
            const messages = JSON.parse(data.toString());
            messages.forEach((message: any) => {
                console.log('Parsed message:', message);
                if (message.T === 'success' && message.msg === 'authenticated') {
                    console.log('Authenticated successfully');
                    const subscribeMsg = {
                        action: 'subscribe',
                        // "trades": ["AAPL"],
                        "bars": ["AAPL"]
                    };
                    alpacaSocket.send(JSON.stringify(subscribeMsg));
                } else if (message.T === 'b') { // Assuming 'b' is the type for bar data
                    const closePrice = message.c; // Assuming 'c' is the close price
                    console.log('Close price:', closePrice);
                    prices.push(closePrice);

                    if (prices.length >= period) {
                        const sma = SMA.calculate({ period, values: prices });
                        console.log('SMA:', sma);
                    }
                }
            });
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    alpacaSocket.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    alpacaSocket.on('close', () => {
        console.log('Alpaca WebSocket connection closed');
    });

    return alpacaSocket;
};

export default connectToAlpacaMarketData;