import express from 'express';
import {
  getAllGRNs,
  getGRNById,
  createGRN,
  updateGRN,
  deleteGRN,
  updateGRNStatus,
  approveGRN,
  getGRNStats,
  getGRNsByPO,
  markItemAsComplete
} from '../controller/grnController.js';

import {
  validateGRN,
  validateGRNUpdate,
  validateStatusUpdate,
  validateApproval
} from '../validators/grnValidator.js';

const router = express.Router();

// ============ GRN ROUTES ============

// Statistics
router.get('/stats', getGRNStats);

// Get GRNs by Purchase Order
router.get('/by-po/:poId', getGRNsByPO);

// CRUD Operations
router.get('/', getAllGRNs);
router.get('/:id', getGRNById);
router.post('/', createGRN);
router.put('/:id', updateGRN);
router.delete('/:id', deleteGRN);

// Status Management
router.patch('/:id/status', updateGRNStatus);

// Approval
router.patch('/:id/approve', approveGRN);

// Manual Completion
router.patch('/:grnId/item/:itemId/complete', markItemAsComplete);


export default router;
