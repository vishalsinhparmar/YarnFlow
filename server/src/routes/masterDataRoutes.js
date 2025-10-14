import express from 'express';
import {
  // Customer controllers
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  
  // Supplier controllers
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  
  // Category controllers
  getAllCategories,
  createCategory,
  
  // Product controllers
  getAllProducts,
  createProduct,
  
  // Stats controller
  getMasterDataStats
} from '../controller/masterDataController.js';

// Validation imports removed - using flexible validation approach

const router = express.Router();

// ============ MASTER DATA STATS ROUTES ============
router.get('/stats', getMasterDataStats);

// ============ CUSTOMER ROUTES ============
router.get('/customers', getAllCustomers);
router.get('/customers/:id', getCustomerById);
router.post('/customers', createCustomer);
router.put('/customers/:id', updateCustomer);
router.delete('/customers/:id', deleteCustomer);

// ============ SUPPLIER ROUTES ============
router.get('/suppliers', getAllSuppliers);
router.get('/suppliers/:id', getSupplierById);
router.post('/suppliers', createSupplier);
router.put('/suppliers/:id', updateSupplier);
router.delete('/suppliers/:id', deleteSupplier);

// ============ CATEGORY ROUTES ============
router.get('/categories', getAllCategories);
router.post('/categories', createCategory);

// ============ PRODUCT ROUTES ============
router.get('/products', getAllProducts);
router.post('/products', createProduct);

export default router;
