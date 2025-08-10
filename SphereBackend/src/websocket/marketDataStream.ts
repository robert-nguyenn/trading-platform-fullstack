import WebSocket from "ws";
import { getAlpacaMarketAuth, ALPACA_WSS_STOCK_BASE_URL, ALPACA_WSS_CRYPTO_BASE_URL } from "../utils/authUtils";

const useTestStream = process.env.ALPACA_STREAM_TEST === 'false';
// const wsUrl = useTestStream ? 'wss://stream.data.alpaca.markets/v2/test' : ALPACA_WSS_CRYPTO_BASE_URL;
const wsUrl = useTestStream ? 'wss://stream.data.alpaca.markets/v2/test' : ALPACA_WSS_STOCK_BASE_URL;
console.log(wsUrl)

const connectToAlpacaMarketData = (): WebSocket => {
    const alpacaSocket = new WebSocket(wsUrl);
  
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
        const messages = JSON.parse(data.toString());
        messages.forEach((message: any) => {
          console.log('Received message:', message);
  
          // Once authenticated, subscribe to channels. Adjust subscriptions as needed.
          if (message.T === 'success' && message.msg === 'authenticated') {
            const subscribeMsg = {
              action: 'subscribe',
              "trades":["AAPL"],
            //   "quotes":["AMD"],
              "bars":["*"]
            };
            alpacaSocket.send(JSON.stringify(subscribeMsg));
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
      // Optionally add reconnection logic here.
    });
  
    return alpacaSocket;
  };
  
  export default connectToAlpacaMarketData;