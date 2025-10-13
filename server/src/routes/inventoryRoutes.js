import express from 'express';
import inventoryController from '../controller/inventoryController.js';
import { inventoryValidators } from '../validators/inventoryValidator.js';

const router = express.Router();

// ============ INVENTORY LOTS ROUTES ============

// GET /api/inventory - Get all inventory lots with filtering
router.get('/', inventoryController.getAllInventoryLots);

// GET /api/inventory/stats - Get inventory statistics for dashboard
router.get('/stats', inventoryController.getInventoryStats);

// GET /api/inventory/alerts/low-stock - Get low stock alerts
router.get('/alerts/low-stock', inventoryController.getLowStockAlerts);

// GET /api/inventory/alerts/expiry - Get expiry alerts
router.get('/alerts/expiry', inventoryController.getExpiryAlerts);

// GET /api/inventory/:id - Get single inventory lot by ID
router.get('/:id', inventoryController.getInventoryLotById);

// PUT /api/inventory/:id - Update inventory lot
router.put('/:id', 
  inventoryValidators.updateLot,
  inventoryController.updateInventoryLot
);

// POST /api/inventory/:id/movement - Record stock movement
router.post('/:id/movement',
  inventoryValidators.stockMovement,
  inventoryController.stockMovement
);

// POST /api/inventory/transfer - Transfer stock between lots/locations
router.post('/transfer',
  inventoryValidators.stockTransfer,
  inventoryController.transferStock
);

// PUT /api/inventory/:id/alerts/:alertId/acknowledge - Acknowledge alert
router.put('/:id/alerts/:alertId/acknowledge',
  inventoryController.acknowledgeAlert
);

// GET /api/inventory/:id/movements - Get movement history for a lot
router.get('/:id/movements', inventoryController.getMovementHistory);

export default router;
