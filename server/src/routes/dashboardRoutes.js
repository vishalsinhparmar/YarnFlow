import express from 'express';
import { getDashboardStats, getRealtimeMetrics } from '../controller/dashboardController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware);

// Dashboard routes
router.get('/stats', getDashboardStats);
router.get('/realtime', getRealtimeMetrics);

export default router;
