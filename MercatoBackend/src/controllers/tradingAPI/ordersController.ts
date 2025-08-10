import { Request, Response } from 'express';
import alpaca from '../../services/alpacaClient';
import { POST_ORDERS_REQUEST } from './types';

//http://localhost:3000/api/orders?status=open&limit=10&after=2023-10-01
// might need to put getOrders: RequestHandler[] in the routes file, (ts error)
export const getOrders = async (req: Request, res: Response) => {
    try {
        const orders = await alpaca.getOrders({
            status: req.query.status?.toString(),
            limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
            after: req.query.after?.toString(),
            until: req.query.until?.toString(),
            direction: req.query.direction?.toString(),
            nested: req.query.nested === 'true',
            symbols: [] // Assuming symbols is required, provide an empty array or modify as needed
        });
        res.json(orders);
    } catch (error) {
        console.error('Error fetching Alpaca orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
}



export const createOrder = async (req: Request, res: Response) => {
   try {
        const orderData: POST_ORDERS_REQUEST= req.body;

        if (!orderData.symbol || !orderData.qty || !orderData.side || !orderData.type || !orderData.time_in_force) {
            res.status(400).json({ error: 'Missing required order parameters' });
            return;
          }

        const order = await alpaca.createOrder(orderData);
        res.status(201).json(order);
   } catch (error: any) {
    console.error('Error placing order:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ error: error.response?.data || 'Failed to place order' });
   }
};

export const deleteAllOrders = async (req: Request, res: Response) => {
    try {
        await alpaca.cancelAllOrders();
        res.status(200).json({ message: 'All orders have been cancelled' });
    } catch (error: any) {
        console.error('Error cancelling all orders: ', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: error.response?.data || 'Failed to cancel all orders' });
    }
}

export const getOrderById = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const order = await alpaca.getOrder(orderId);
        res.json(order);
    } catch (error: any) {
        console.error('Error fetching order:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: error.response?.data || 'Failed to fetch order' });
    }
}

export const deleteOrderById = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        await alpaca.cancelOrder(orderId);
        res.status(200).json({ message: 'Order has been cancelled' });
    } catch (error: any) {
        console.error('Error cancelling order:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: error.response?.data || 'Failed to cancel order' });
    }
}
//test this properly
export const updateOrderById = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const updatedOrder = await alpaca.replaceOrder(orderId, req.body);
        res.status(200).json(updatedOrder);
    } catch (error: any) {
        console.error('Error updating order by ID:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: error.response?.data || 'Failed to update order' });
    }
};