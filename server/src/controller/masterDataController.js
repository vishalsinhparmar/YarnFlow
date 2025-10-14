import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import logger from '../utils/logger.js';

// ============ CUSTOMER CONTROLLERS ============

// Get all customers
export const getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    
    let query = {};
    
    // Add search functionality
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { customerCode: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    const customers = await Customer.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await Customer.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: customers,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
    
    logger.info(`Retrieved ${customers.length} customers`);
  } catch (error) {
    logger.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customers',
      error: error.message
    });
  }
};

// Get customer by ID
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: customer
    });
    
    logger.info(`Retrieved customer: ${customer.customerCode}`);
  } catch (error) {
    logger.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer',
      error: error.message
    });
  }
};

// Create new customer
export const createCustomer = async (req, res) => {

  try {
    console.log('req.body',req.body)
    const customer = new Customer(req.body);
    await customer.save();
    
    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
    
    logger.info(`Created new customer: ${customer.customerCode}`);
  } catch (error) {
    logger.error('Error creating customer:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating customer',
      error: error.message
    });
  }
};

// Update customer
export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
    
    logger.info(`Updated customer: ${customer.customerCode}`);
  } catch (error) {
    logger.error('Error updating customer:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating customer',
      error: error.message
    });
  }
};

// Delete customer
export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
    
    logger.info(`Deleted customer: ${customer.customerCode}`);
  } catch (error) {
    logger.error('Error deleting customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting customer',
      error: error.message
    });
  }
};

// ============ SUPPLIER CONTROLLERS ============

// Get all suppliers
export const getAllSuppliers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, supplierType, verificationStatus } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { supplierCode: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (supplierType) {
      query.supplierType = supplierType;
    }
    
    if (verificationStatus) {
      query.verificationStatus = verificationStatus;
    }
    
    const suppliers = await Supplier.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await Supplier.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: suppliers,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
    
    logger.info(`Retrieved ${suppliers.length} suppliers`);
  } catch (error) {
    logger.error('Error fetching suppliers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching suppliers',
      error: error.message
    });
  }
};

// Get supplier by ID
export const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: supplier
    });
    
    logger.info(`Retrieved supplier: ${supplier.supplierCode}`);
  } catch (error) {
    logger.error('Error fetching supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching supplier',
      error: error.message
    });
  }
};

// Create new supplier
export const createSupplier = async (req, res) => {
  try {
    const supplier = new Supplier(req.body);
    await supplier.save();
    
    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier
    });
    
    logger.info(`Created new supplier: ${supplier.supplierCode}`);
  } catch (error) {
    logger.error('Error creating supplier:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating supplier',
      error: error.message
    });
  }
};

// Update supplier
export const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Supplier updated successfully',
      data: supplier
    });
    
    logger.info(`Updated supplier: ${supplier.supplierCode}`);
  } catch (error) {
    logger.error('Error updating supplier:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating supplier',
      error: error.message
    });
  }
};

// Delete supplier
export const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Supplier deleted successfully'
    });
    
    logger.info(`Deleted supplier: ${supplier.supplierCode}`);
  } catch (error) {
    logger.error('Error deleting supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting supplier',
      error: error.message
    });
  }
};

// ============ CATEGORY CONTROLLERS ============

// Get all categories
export const getAllCategories = async (req, res) => {
  try {
    const { includeSubcategories = false } = req.query;
    
    let categories;
    if (includeSubcategories === 'true') {
      categories = await Category.find().populate('subcategories');
    } else {
      categories = await Category.find().sort({ sortOrder: 1, categoryName: 1 });
    }
    
    res.status(200).json({
      success: true,
      data: categories
    });
    
    logger.info(`Retrieved ${categories.length} categories`);
  } catch (error) {
    logger.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

// Create new category
export const createCategory = async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
    
    logger.info(`Created new category: ${category.categoryCode}`);
  } catch (error) {
    logger.error('Error creating category:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
};

// ============ PRODUCT CONTROLLERS ============

// Get all products
export const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, status } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      query.category = category;
    }
    
    if (status) {
      query.status = status;
    }
    
    const products = await Product.find(query)
      .populate('category', 'categoryName categoryType')
      .populate('supplier', 'companyName supplierCode supplierType')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await Product.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
    
    logger.info(`Retrieved ${products.length} products`);
  } catch (error) {
    logger.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

// Create new product
export const createProduct = async (req, res) => {
    console.log('req.body',req.body)
  try {
    const product = new Product(req.body);
    await product.save();
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
    
    logger.info(`Created new product: ${product.productCode}`);
  } catch (error) {
    logger.error('Error creating product:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
};

// ============ DASHBOARD STATS ============

// Get master data statistics
export const getMasterDataStats = async (req, res) => {
  try {
    const [
      totalCustomers,
      totalSuppliers,
      totalProducts,
      totalCategories,
      activeCustomers,
      verifiedSuppliers,
      lowStockProducts
    ] = await Promise.all([
      Customer.countDocuments(),
      Supplier.countDocuments(),
      Product.countDocuments(),
      Category.countDocuments(),
      Customer.countDocuments({ status: 'Active' }),
      Supplier.countDocuments({ verificationStatus: 'Verified' }),
      Product.countDocuments({ 'inventory.availableStock': { $lte: 10 } })
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        customers: {
          total: totalCustomers,
          active: activeCustomers
        },
        suppliers: {
          total: totalSuppliers,
          verified: verifiedSuppliers
        },
        products: {
          total: totalProducts,
          lowStock: lowStockProducts
        },
        categories: {
          total: totalCategories
        }
      }
    });
    
    logger.info('Retrieved master data statistics');
  } catch (error) {
    logger.error('Error fetching master data stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};
