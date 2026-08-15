import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  inventoryReport,
  grnReport,
  purchaseOrderReport,
  salesOrderReport,
  salesChallanReport,
  masterDataReport
} from '../controller/reportsController.js';
import dynamicReportRoutes from '../reports/report.routes.js';

const router = express.Router();
router.use(authMiddleware);

// Legacy hard-coded report exports (kept for backward compatibility)
router.get('/inventory',       inventoryReport);
router.get('/grn',             grnReport);
router.get('/purchase-orders', purchaseOrderReport);
router.get('/sales-orders',    salesOrderReport);
router.get('/sales-challans',  salesChallanReport);
router.get('/master-data',     masterDataReport);

// New dynamic report builder routes
router.use('/', dynamicReportRoutes);

export default router;
