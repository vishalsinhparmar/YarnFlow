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
  updateCategory,
  deleteCategory,
  
  // Product controllers
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  
  // Stats controller
  getMasterDataStats
} from '../controller/masterDataController.js';

// Import controller
import { importMasterData } from '../controller/importController.js';

// Import validation rules
import { validateCategory, validateSupplier, validateProduct } from '../validators/masterDataValidator.js';

// Import multer for file uploads
import upload from '../middleware/upload.js';

const router = express.Router();

// ============ MASTER DATA STATS ROUTES ============
router.get('/stats', getMasterDataStats);

// ============ IMPORT ROUTES ============
router.post('/import/:type', upload.single('file'), importMasterData);

// ============ CUSTOMER ROUTES ============
router.get('/customers', getAllCustomers);
router.get('/customers/:id', getCustomerById);
router.post('/customers', createCustomer);
router.put('/customers/:id', updateCustomer);
router.delete('/customers/:id', deleteCustomer);

// ============ SUPPLIER ROUTES ============
router.get('/suppliers', getAllSuppliers);
router.get('/suppliers/:id', getSupplierById);
router.post('/suppliers', validateSupplier, createSupplier);
router.put('/suppliers/:id', validateSupplier, updateSupplier);
router.delete('/suppliers/:id', deleteSupplier);

// ============ CATEGORY ROUTES ============
router.get('/categories', getAllCategories);
router.post('/categories',validateCategory, createCategory);
router.put('/categories/:id', validateCategory, updateCategory);
router.delete('/categories/:id', deleteCategory);

// ============ PRODUCT ROUTES ============
router.get('/products', getAllProducts);
router.get('/products/:id', getProductById);
router.post('/products', validateProduct, createProduct);
router.put('/products/:id', validateProduct, updateProduct);
router.delete('/products/:id', deleteProduct);

export default router;
