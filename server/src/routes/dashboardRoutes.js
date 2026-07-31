import express from 'express';
import {
  getDashboardStats,
  getRecentActivities,
  getRealtimeMetrics
} from '../controller/dashboardController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware);

// Dashboard routes
router.get('/stats', getDashboardStats);
router.get('/recent-activities', getRecentActivities);
router.get('/realtime', getRealtimeMetrics);

export default router;
