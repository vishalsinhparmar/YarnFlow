import express from 'express';
import {
  getAllSalesChallans,
  getSalesChallanById,
  createSalesChallan,
  updateSalesChallan,
  updateChallanStatus,
  deleteSalesChallan,
  getSalesChallanStats,
  getChallansBySalesOrder,
  trackChallan
} from '../controller/salesChallanController.js';

import {
  validateSalesChallan,
  validateChallanUpdate,
  validateStatusUpdate
} from '../validators/salesChallanValidator.js';

const router = express.Router();

// ============ SALES CHALLAN ROUTES ============

// Statistics
router.get('/stats', getSalesChallanStats);

// Tracking
router.get('/track/:challanNumber', trackChallan);

// Get challans by sales order
router.get('/by-sales-order/:soId', getChallansBySalesOrder);

// CRUD Operations
router.get('/', getAllSalesChallans);
router.get('/:id', getSalesChallanById);
router.post('/', validateSalesChallan, createSalesChallan);
router.put('/:id', validateChallanUpdate, updateSalesChallan);
router.delete('/:id', deleteSalesChallan);

// Status Management
router.patch('/:id/status', validateStatusUpdate, updateChallanStatus);

export default router;
