import express from 'express';
import { register, login, verifyToken } from '../controller/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const authRoutes = express.Router();

authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.get('/verify', authMiddleware, verifyToken);

export default authRoutes;