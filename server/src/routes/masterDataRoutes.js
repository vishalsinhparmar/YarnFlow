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

import {
  validateCustomer,
  validateCustomerUpdate,
  validateSupplier,
  validateSupplierUpdate,
  validateProduct,
  validateCategory
} from '../validators/masterDataValidator.js';

const router = express.Router();

// ============ MASTER DATA STATS ROUTES ============
router.get('/stats', getMasterDataStats);

// ============ CUSTOMER ROUTES ============
router.get('/customers', getAllCustomers);
router.get('/customers/:id', getCustomerById);
router.post('/customers', validateCustomer, createCustomer);
router.put('/customers/:id', validateCustomerUpdate, updateCustomer);
router.delete('/customers/:id', deleteCustomer);

// ============ SUPPLIER ROUTES ============
router.get('/suppliers', getAllSuppliers);
router.get('/suppliers/:id', getSupplierById);
router.post('/suppliers', validateSupplier, createSupplier);
router.put('/suppliers/:id', validateSupplierUpdate, updateSupplier);
router.delete('/suppliers/:id', deleteSupplier);

// ============ CATEGORY ROUTES ============
router.get('/categories', getAllCategories);
router.post('/categories', validateCategory, createCategory);

// ============ PRODUCT ROUTES ============
router.get('/products', getAllProducts);
router.post('/products', createProduct);

export default router;
