import express from 'express';
import { getOrders, createOrder, deleteAllOrders, getOrderById, updateOrderById, deleteOrderById } from '../../controllers/tradingAPI/ordersController';
const router = express.Router();

router.get('/', getOrders);
router.post('/', createOrder);
router.delete('/', deleteAllOrders);
router.get('/:orderId', getOrderById);
router.patch('/:orderId', updateOrderById);
router.delete('/:orderId', deleteOrderById);

export default router;