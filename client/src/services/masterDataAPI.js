// Master Data API Service for YarnFlow Frontend
import { apiRequest as baseRequest } from './common.js';

// Prefix all master data endpoints with '/master-data'
const apiRequest = (endpoint, options = {}) => baseRequest(`/master-data${endpoint}`, options);

// ============ MASTER DATA STATS ============
export const getMasterDataStats = async () => {
  return apiRequest('/stats');
};

// ============ IMPORT API ============
export const importMasterData = async (type, file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Use fetch directly for file upload (FormData requires different handling)
  const { API_BASE_URL } = await import('./common.js');
  
  const response = await fetch(`${API_BASE_URL}/master-data/import/${type}`, {
    method: 'POST',
    body: formData
    // Note: Don't set Content-Type header - browser will set it automatically with boundary for multipart/form-data
  });
  
  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    const message = data?.message || `HTTP error! status: ${response.status}`;
    throw new Error(message);
  }
  
  return data;
};

// ============ CUSTOMER API ============
export const customerAPI = {
  // Get all customers with pagination and filters
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/customers?${queryString}` : '/customers';
    return apiRequest(endpoint);
  },

  // Get customer by ID
  getById: async (id) => {
    return apiRequest(`/customers/${id}`);
  },

  // Create new customer
  create: async (customerData) => {
    return apiRequest('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  },

  // Update customer
  update: async (id, customerData) => {
    return apiRequest(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  },

  // Delete customer
  delete: async (id) => {
    return apiRequest(`/customers/${id}`, {
      method: 'DELETE',
    });
  },

  // Search customers
  search: async (searchTerm, filters = {}) => {
    const params = { search: searchTerm, ...filters };
    return customerAPI.getAll(params);
  },
};

// ============ SUPPLIER API ============
export const supplierAPI = {
  // Get all suppliers with pagination and filters
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/suppliers?${queryString}` : '/suppliers';
    return apiRequest(endpoint);
  },

  // Get supplier by ID
  getById: async (id) => {
    return apiRequest(`/suppliers/${id}`);
  },

  // Create new supplier
  create: async (supplierData) => {
    return apiRequest('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplierData),
    });
  },

  // Update supplier
  update: async (id, supplierData) => {
    return apiRequest(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(supplierData),
    });
  },

  // Delete supplier
  delete: async (id) => {
    return apiRequest(`/suppliers/${id}`, {
      method: 'DELETE',
    });
  },

  // Removed helper filters tied to deprecated fields
};

// ============ CATEGORY API ============
export const categoryAPI = {
  // Get all categories
  getAll: async (includeSubcategories = false) => {
    const params = includeSubcategories ? { includeSubcategories: 'true' } : {};
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/categories?${queryString}` : '/categories';
    return apiRequest(endpoint);
  },

  // Create new category
  create: async (categoryData) => {
    return apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  // Update category
  update: async (categoryId, categoryData) => {
    return apiRequest(`/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  },

  // Delete category
  delete: async (categoryId) => {
    return apiRequest(`/categories/${categoryId}`, {
      method: 'DELETE',
    });
  }
};

// ============ PRODUCT API ============
export const productAPI = {
  // Get all products with pagination and filters
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/products?${queryString}` : '/products';
    return apiRequest(endpoint);
  },

  // Get product by ID
  getById: async (id) => {
    return apiRequest(`/products/${id}`);
  },

  // Create new product
  create: async (productData) => {
    return apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  // Update product
  update: async (id, productData) => {
    return apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  // Delete product
  delete: async (id) => {
    return apiRequest(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  // Get products by category
  getByCategory: async (categoryId, params = {}) => {
    return productAPI.getAll({ category: categoryId, ...params });
  },

  // Get products by supplier
  getBySupplier: async (supplierId, params = {}) => {
    return productAPI.getAll({ supplier: supplierId, ...params });
  },

  // Get low stock products
  getLowStock: async () => {
    // This would need to be implemented on the backend
    // For now, we'll filter on the frontend
    const response = await productAPI.getAll({ limit: 100 });
    return {
      ...response,
      data: response.data.filter(product => product.isLowStock)
    };
  },

  // Search products
  search: async (searchTerm, filters = {}) => {
    const params = { search: searchTerm, ...filters };
    return productAPI.getAll(params);
  },
};

// ============ UTILITY FUNCTIONS ============

// Get dropdown options for forms
export const getDropdownOptions = async () => {
  try {
    const [categoriesResponse, suppliersResponse] = await Promise.all([
      categoryAPI.getAll(),
      supplierAPI.getAll({ limit: 100 })
    ]);

    return {
      categories: categoriesResponse.data.map(cat => ({
        value: cat._id,
        label: cat.categoryName
      })),
      suppliers: suppliersResponse.data.map(sup => ({
        value: sup._id,
        label: sup.companyName
      })),
      paymentTerms: [
        { value: 'Cash', label: 'Cash' },
        { value: 'Credit-15', label: 'Credit 15 Days' },
        { value: 'Credit-30', label: 'Credit 30 Days' },
        { value: 'Credit-45', label: 'Credit 45 Days' },
        { value: 'Credit-60', label: 'Credit 60 Days' }
      ],
      supplierTypes: [
        { value: 'Cotton Yarn', label: 'Cotton Yarn' },
        { value: 'Polyester', label: 'Polyester' },
        { value: 'Blended Yarn', label: 'Blended Yarn' },
        { value: 'Raw Cotton', label: 'Raw Cotton' },
        { value: 'Chemicals', label: 'Chemicals' },
        { value: 'Other', label: 'Other' }
      ],
      materials: [
        { value: 'Cotton', label: 'Cotton' },
        { value: 'Polyester', label: 'Polyester' },
        { value: 'Cotton-Polyester', label: 'Cotton-Polyester' },
        { value: 'Viscose', label: 'Viscose' },
        { value: 'Wool', label: 'Wool' },
        { value: 'Silk', label: 'Silk' }
      ],
      packingTypes: [
        { value: 'Bags', label: 'Bags' },
        { value: 'Rolls', label: 'Rolls' },
        { value: 'Cones', label: 'Cones' },
        { value: 'Hanks', label: 'Hanks' }
      ],
      qualityTypes: [
        { value: 'Premium', label: 'Premium' },
        { value: 'Standard', label: 'Standard' },
        { value: 'Economy', label: 'Economy' }
      ]
    };
  } catch (error) {
    console.error('Error fetching dropdown options:', error);
    return {
      categories: [],
      suppliers: [],
      paymentTerms: [],
      supplierTypes: [],
      materials: [],
      packingTypes: [],
      qualityTypes: []
    };
  }
};

// Format data for display
export const formatters = {
  // Format currency
  currency: (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  // Format date
  date: (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  // Format phone number
  phone: (phoneNumber) => {
    if (!phoneNumber) return 'N/A';
    // Remove country code if present and format
    const cleaned = phoneNumber.toString().replace(/^\+91/, '');
    return cleaned.replace(/(\d{5})(\d{5})/, '$1 $2');
  },

  // Format email
  email: (email) => {
    if (!email) return 'N/A';
    return email.toLowerCase().trim();
  },

  // Format address
  address: (addressObj) => {
    if (!addressObj) return 'N/A';
    const { street, city, state, pincode } = addressObj;
    const parts = [street, city, state, pincode].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  },

  // Format name (capitalize first letter of each word)
  name: (name) => {
    if (!name) return 'N/A';
    return name.toString().toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  },

  // Format status with proper casing
  status: (status) => {
    if (!status) return 'N/A';
    return status.toString().charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  },

  // Format stock status
  stockStatus: (product) => {
    const { currentStock, reorderLevel } = product.inventory || {};
    if (currentStock <= 0) return { status: 'Out of Stock', color: 'red' };
    if (currentStock <= reorderLevel) return { status: 'Low Stock', color: 'orange' };
    return { status: 'In Stock', color: 'green' };
  }
};

// Error handler for components
export const handleAPIError = (error, defaultMessage = 'An error occurred') => {
  console.error('API Error:', error);
  
  if (error.message) {
    return error.message;
  }
  
  return defaultMessage;
};

// Default export with all APIs
const masterDataAPI = {
  stats: { get: getMasterDataStats },
  customers: customerAPI,
  suppliers: supplierAPI,
  categories: categoryAPI,
  products: productAPI,
  utils: {
    getDropdownOptions,
    formatters,
    handleAPIError
  }
};

export default masterDataAPI;
