import express from 'express';
import {
  getAllSalesOrders,
  getSalesOrderById,
  createSalesOrder,
  updateSalesOrder,
  updateSalesOrderStatus,
  cancelSalesOrder,
  deleteSalesOrder,
  getSalesOrderStats,
  getSalesOrdersByCustomer,
  recalculateAllSOStatuses
} from '../controller/salesOrderController.js';
import { validateSalesOrder, validateSalesOrderUpdate } from '../validators/salesOrderValidator.js';

const router = express.Router();

// Statistics
router.get('/stats', getSalesOrderStats);

// Utility - Recalculate all SO statuses
router.post('/recalculate-statuses', recalculateAllSOStatuses);

// CRUD Operations
router.get('/', getAllSalesOrders);
router.get('/:id', getSalesOrderById);
router.post('/', validateSalesOrder, createSalesOrder);
router.put('/:id', validateSalesOrderUpdate, updateSalesOrder);
router.delete('/:id', deleteSalesOrder);

// Status Management
router.patch('/:id/status', updateSalesOrderStatus);
router.patch('/:id/cancel', cancelSalesOrder);

// Customer-specific orders
router.get('/customer/:customerId', getSalesOrdersByCustomer);

export default router;
