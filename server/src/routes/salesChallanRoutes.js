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
  trackChallan,
  getDispatchedQuantities,
  generateChallanPDF,
  previewChallanPDF,
  generateSOConsolidatedPDF,
  previewSOConsolidatedPDF
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

// Get dispatched quantities for a sales order
router.get('/dispatched/:salesOrderId', getDispatchedQuantities);

// CRUD Operations
router.get('/', getAllSalesChallans);
router.get('/:id', getSalesChallanById);
router.post('/', validateSalesChallan, createSalesChallan);
router.put('/:id', validateChallanUpdate, updateSalesChallan);
router.delete('/:id', deleteSalesChallan);

// Status Management
router.patch('/:id/status', validateStatusUpdate, updateChallanStatus);

// PDF Generation - Individual Challan
router.get('/:id/pdf/download', generateChallanPDF);  // Download PDF
router.get('/:id/pdf/preview', previewChallanPDF);    // Preview PDF in browser

// PDF Generation - Consolidated SO (All Challans)
router.get('/so/:soId/pdf/download', generateSOConsolidatedPDF);  // Download consolidated PDF
router.get('/so/:soId/pdf/preview', previewSOConsolidatedPDF);    // Preview consolidated PDF

export default router;
