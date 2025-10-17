import express from 'express';
import { getDashboardStats, getRealtimeMetrics } from '../controller/dashboardController.js';

const router = express.Router();

// Dashboard routes
router.get('/stats', getDashboardStats);
router.get('/realtime', getRealtimeMetrics);

export default router;
