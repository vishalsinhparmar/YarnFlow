import express from 'express';
import inventoryController from '../controller/inventoryController.js';

const router = express.Router();

// ============ INVENTORY ROUTES ============
// Single source of truth for inventory data
// - InventoryLot model tracks all stock movements
// - GRN creates inventory lots (Stock In) when approved
// - Sales Challan deducts from inventory lots (Stock Out) when created
// - All inventory operations are handled within their respective controllers

// GET /api/inventory - Get inventory products with Stock In and Stock Out data
// This shows products with their current stock levels after all transactions
router.get('/', inventoryController.getInventoryProducts);

// GET /api/inventory/lots - Get all inventory lots with filtering
// Shows detailed lot-level inventory with movements
router.get('/lots', inventoryController.getAllInventoryLots);

// GET /api/inventory/stats - Get inventory statistics
// Dashboard stats for inventory overview
router.get('/stats', inventoryController.getInventoryStats);

// GET /api/inventory/lots/:id - Get single inventory lot details
// Detailed view of a specific lot with full history
router.get('/lots/:id', inventoryController.getInventoryLotById);

// GET /api/inventory/lots/:id/movements - Get movement history for a lot
// Shows all stock in/out movements for a specific lot
router.get('/lots/:id/movements', inventoryController.getMovementHistory);

export default router;
