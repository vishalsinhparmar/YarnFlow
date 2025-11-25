import express from 'express';
import {
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  updatePurchaseOrderStatus,
  cancelPurchaseOrder,
  getPurchaseOrderStats
} from '../controller/purchaseOrderController.js';

import {
  validatePurchaseOrder,
  validatePurchaseOrderUpdate,
  validateStatusUpdate
} from '../validators/purchaseOrderValidator.js';

const router = express.Router();

// ============ PURCHASE ORDER ROUTES ============

// Statistics
router.get('/stats', getPurchaseOrderStats);

// CRUD Operations
router.get('/', getAllPurchaseOrders);
router.get('/:id', getPurchaseOrderById);
router.post('/', createPurchaseOrder);
router.put('/:id', validatePurchaseOrderUpdate, updatePurchaseOrder);
router.delete('/:id', deletePurchaseOrder);

// Status Management
router.patch('/:id/status', validateStatusUpdate, updatePurchaseOrderStatus);
router.patch('/:id/cancel', cancelPurchaseOrder);

export default router;
