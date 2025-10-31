import express from 'express';
import { getInventoryProducts } from '../controller/grnController.js';

const router = express.Router();

// ============ INVENTORY ROUTES ============
// Note: Inventory is now GRN-based (single source of truth)
// Old inventory lot system has been deprecated

// GET /api/inventory - Get fully received products from GRNs
// This is the main inventory view showing products that are 100% received
router.get('/', getInventoryProducts);

// ============ DEPRECATED ROUTES ============
// The following routes are deprecated and will be removed in future versions:
// - POST /api/inventory/:id/movement (stock movement)
// - POST /api/inventory/transfer (stock transfer)
// - GET /api/inventory/stats (inventory stats)
// - GET /api/inventory/alerts/* (alerts)
//
// Reason: Inventory is now managed through GRN system
// Migration: Use GRN-based inventory tracking instead

export default router;
