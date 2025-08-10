import express from 'express';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from '../../controllers/userAPI/userController'
import { firebaseAuthMiddleware } from '../../middlewares/firebaseAuthMiddleware';
const router = express.Router();


// @routes GET /users
router.get('/users', firebaseAuthMiddleware, getAllUsers);

// @routes GET /users/:userId
router.get('/users', firebaseAuthMiddleware, getUserById);

// @routes POST /users
router.post('/users', createUser);

// @routes PUT /users/:userId
router.put('/users/:userId', firebaseAuthMiddleware, updateUser);

// @routes DELETE /users/:userId
router.delete('/users/:userId', firebaseAuthMiddleware, deleteUser);

export default router;