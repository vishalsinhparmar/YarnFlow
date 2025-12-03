import xlsx from 'xlsx';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import logger from '../utils/logger.js';

// Helper function to clean and normalize Excel data
const cleanExcelData = (data) => {
  const cleaned = {};
  for (const [key, value] of Object.entries(data)) {
    // Remove extra spaces from keys and convert to camelCase
    const cleanKey = key.trim();
    // Skip empty values
    if (value !== null && value !== undefined && value !== '') {
      cleaned[cleanKey] = typeof value === 'string' ? value.trim() : value;
    }
  }
  return cleaned;
};

// Map Excel columns to Customer schema
const mapCustomerData = (row) => {
  const cleaned = cleanExcelData(row);
  return {
    companyName: cleaned.companyName || cleaned.CompanyName || cleaned['Company Name'],
    gstNumber: cleaned.gstNumber || cleaned.GSTNumber || cleaned['GST Number'],
    panNumber: cleaned.panNumber || cleaned.PANNumber || cleaned['PAN Number'],
    address: {
      city: cleaned.city || cleaned.City || cleaned['address.city']
    },
    notes: cleaned.notes || cleaned.Notes,
    status: cleaned.status || cleaned.Status || 'Active'
  };
};

// Map Excel columns to Supplier schema
const mapSupplierData = (row) => {
  const cleaned = cleanExcelData(row);
  return {
    companyName: cleaned.companyName || cleaned.CompanyName || cleaned['Company Name'],
    gstNumber: cleaned.gstNumber || cleaned.GSTNumber || cleaned['GST Number'],
    panNumber: cleaned.panNumber || cleaned.PANNumber || cleaned['PAN Number'],
    city: cleaned.city || cleaned.City,
    notes: cleaned.notes || cleaned.Notes,
    status: cleaned.status || cleaned.Status || 'Active'
  };
};

// Map Excel columns to Category schema
const mapCategoryData = (row) => {
  const cleaned = cleanExcelData(row);
  return {
    categoryName: cleaned.categoryName || cleaned.CategoryName || cleaned['Category Name'],
    description: cleaned.description || cleaned.Description,
    status: cleaned.status || cleaned.Status || 'Active'
  };
};

// Map Excel columns to Product schema (requires category lookup)
const mapProductData = async (row) => {
  const cleaned = cleanExcelData(row);
  
  // Find category by name
  let categoryId = null;
  const categoryName = cleaned.category || cleaned.Category || cleaned.categoryName || cleaned.CategoryName;
  
  if (categoryName) {
    const category = await Category.findOne({ 
      categoryName: { $regex: new RegExp(`^${categoryName}$`, 'i') } 
    });
    if (category) {
      categoryId = category._id;
    }
  }
  
  return {
    productName: cleaned.productName || cleaned.ProductName || cleaned['Product Name'],
    description: cleaned.description || cleaned.Description,
    category: categoryId,
    status: cleaned.status || cleaned.Status || 'Active'
  };
};

// Main import controller
export const importMasterData = async (req, res) => {
  try {
    const { type } = req.params;
    
    // Validate type
    const validTypes = ['customers', 'suppliers', 'products', 'categories'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid type. Must be one of: ${validTypes.join(', ')}`
      });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    // Read Excel file
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);
    
    if (jsonData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Excel file is empty'
      });
    }
    
    let results = {
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };
    
    // Process based on type
    switch (type) {
      case 'customers':
        results = await processCustomers(jsonData);
        break;
      case 'suppliers':
        results = await processSuppliers(jsonData);
        break;
      case 'products':
        results = await processProducts(jsonData);
        break;
      case 'categories':
        results = await processCategories(jsonData);
        break;
    }
    
    logger.info(`Import completed for ${type}: ${JSON.stringify(results)}`);
    
    res.status(200).json({
      success: true,
      message: `Import completed successfully`,
      data: results
    });
    
  } catch (error) {
    logger.error('Error importing data:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing data',
      error: error.message
    });
  }
};

// Process Customers
const processCustomers = async (jsonData) => {
  const results = { inserted: 0, updated: 0, skipped: 0, errors: [] };
  
  for (let i = 0; i < jsonData.length; i++) {
    try {
      const row = jsonData[i];
      const customerData = mapCustomerData(row);
      
      // Validate required fields
      if (!customerData.companyName) {
        results.skipped++;
        results.errors.push(`Row ${i + 1}: Missing company name`);
        continue;
      }
      
      // Check if customer exists (by company name or GST)
      let existingCustomer = null;
      if (customerData.gstNumber) {
        existingCustomer = await Customer.findOne({ gstNumber: customerData.gstNumber });
      }
      if (!existingCustomer) {
        existingCustomer = await Customer.findOne({ 
          companyName: { $regex: new RegExp(`^${customerData.companyName}$`, 'i') } 
        });
      }
      
      if (existingCustomer) {
        // Update existing customer
        await Customer.findByIdAndUpdate(existingCustomer._id, customerData);
        results.updated++;
      } else {
        // Create new customer
        const customer = new Customer(customerData);
        await customer.save();
        results.inserted++;
      }
      
    } catch (error) {
      results.errors.push(`Row ${i + 1}: ${error.message}`);
      results.skipped++;
    }
  }
  
  return results;
};

// Process Suppliers
const processSuppliers = async (jsonData) => {
  const results = { inserted: 0, updated: 0, skipped: 0, errors: [] };
  
  for (let i = 0; i < jsonData.length; i++) {
    try {
      const row = jsonData[i];
      const supplierData = mapSupplierData(row);
      
      // Validate required fields
      if (!supplierData.companyName) {
        results.skipped++;
        results.errors.push(`Row ${i + 1}: Missing company name`);
        continue;
      }
      
      // Check if supplier exists
      let existingSupplier = null;
      if (supplierData.gstNumber) {
        existingSupplier = await Supplier.findOne({ gstNumber: supplierData.gstNumber });
      }
      if (!existingSupplier) {
        existingSupplier = await Supplier.findOne({ 
          companyName: { $regex: new RegExp(`^${supplierData.companyName}$`, 'i') } 
        });
      }
      
      if (existingSupplier) {
        await Supplier.findByIdAndUpdate(existingSupplier._id, supplierData);
        results.updated++;
      } else {
        const supplier = new Supplier(supplierData);
        await supplier.save();
        results.inserted++;
      }
      
    } catch (error) {
      results.errors.push(`Row ${i + 1}: ${error.message}`);
      results.skipped++;
    }
  }
  
  return results;
};

// Process Categories
const processCategories = async (jsonData) => {
  const results = { inserted: 0, updated: 0, skipped: 0, errors: [] };
  
  for (let i = 0; i < jsonData.length; i++) {
    try {
      const row = jsonData[i];
      const categoryData = mapCategoryData(row);
      
      // Validate required fields
      if (!categoryData.categoryName) {
        results.skipped++;
        results.errors.push(`Row ${i + 1}: Missing category name`);
        continue;
      }
      
      // Check if category exists
      const existingCategory = await Category.findOne({ 
        categoryName: { $regex: new RegExp(`^${categoryData.categoryName}$`, 'i') } 
      });
      
      if (existingCategory) {
        await Category.findByIdAndUpdate(existingCategory._id, categoryData);
        results.updated++;
      } else {
        const category = new Category(categoryData);
        await category.save();
        results.inserted++;
      }
      
    } catch (error) {
      results.errors.push(`Row ${i + 1}: ${error.message}`);
      results.skipped++;
    }
  }
  
  return results;
};

// Process Products
const processProducts = async (jsonData) => {
  const results = { inserted: 0, updated: 0, skipped: 0, errors: [] };
  
  for (let i = 0; i < jsonData.length; i++) {
    try {
      const row = jsonData[i];
      const productData = await mapProductData(row);
      
      // Validate required fields
      if (!productData.productName) {
        results.skipped++;
        results.errors.push(`Row ${i + 1}: Missing product name`);
        continue;
      }
      
      if (!productData.category) {
        results.skipped++;
        results.errors.push(`Row ${i + 1}: Category not found or missing`);
        continue;
      }
      
      // Check if product exists
      const existingProduct = await Product.findOne({ 
        productName: { $regex: new RegExp(`^${productData.productName}$`, 'i') } 
      });
      
      if (existingProduct) {
        await Product.findByIdAndUpdate(existingProduct._id, productData);
        results.updated++;
      } else {
        const product = new Product(productData);
        await product.save();
        results.inserted++;
      }
      
    } catch (error) {
      results.errors.push(`Row ${i + 1}: ${error.message}`);
      results.skipped++;
    }
  }
  
  return results;
};
