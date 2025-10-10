import { useState, useEffect, useCallback } from 'react';
import masterDataAPI, { handleAPIError } from '../services/masterDataAPI';

// Custom hook for Master Data management
export const useMasterData = () => {
  const [stats, setStats] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch master data statistics
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await masterDataAPI.stats.get();
      setStats(response.data);
      setError(null);
    } catch (err) {
      setError(handleAPIError(err, 'Failed to fetch statistics'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch customers
  const fetchCustomers = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const response = await masterDataAPI.customers.getAll(params);
      setCustomers(response.data);
      setError(null);
      return response;
    } catch (err) {
      setError(handleAPIError(err, 'Failed to fetch customers'));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch suppliers
  const fetchSuppliers = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const response = await masterDataAPI.suppliers.getAll(params);
      setSuppliers(response.data);
      setError(null);
      return response;
    } catch (err) {
      setError(handleAPIError(err, 'Failed to fetch suppliers'));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await masterDataAPI.categories.getAll();
      setCategories(response.data);
      setError(null);
      return response;
    } catch (err) {
      setError(handleAPIError(err, 'Failed to fetch categories'));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const response = await masterDataAPI.products.getAll(params);
      setProducts(response.data);
      setError(null);
      return response;
    } catch (err) {
      setError(handleAPIError(err, 'Failed to fetch products'));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create customer
  const createCustomer = useCallback(async (customerData) => {
    try {
      setLoading(true);
      const response = await masterDataAPI.customers.create(customerData);
      // Refresh customers list
      await fetchCustomers();
      setError(null);
      return response;
    } catch (err) {
      setError(handleAPIError(err, 'Failed to create customer'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchCustomers]);

  // Create supplier
  const createSupplier = useCallback(async (supplierData) => {
    try {
      setLoading(true);
      const response = await masterDataAPI.suppliers.create(supplierData);
      // Refresh suppliers list
      await fetchSuppliers();
      setError(null);
      return response;
    } catch (err) {
      setError(handleAPIError(err, 'Failed to create supplier'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchSuppliers]);

  // Create category
  const createCategory = useCallback(async (categoryData) => {
    try {
      setLoading(true);
      const response = await masterDataAPI.categories.create(categoryData);
      // Refresh categories list
      await fetchCategories();
      setError(null);
      return response;
    } catch (err) {
      setError(handleAPIError(err, 'Failed to create category'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchCategories]);

  // Create product
  const createProduct = useCallback(async (productData) => {
    try {
      setLoading(true);
      const response = await masterDataAPI.products.create(productData);
      // Refresh products list
      await fetchProducts();
      setError(null);
      return response;
    } catch (err) {
      setError(handleAPIError(err, 'Failed to create product'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchProducts]);

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        fetchStats(),
        fetchCustomers({ limit: 5 }),
        fetchSuppliers({ limit: 5 }),
        fetchCategories()
      ]);
    };

    initializeData();
  }, [fetchStats, fetchCustomers, fetchSuppliers, fetchCategories]);

  return {
    // Data
    stats,
    customers,
    suppliers,
    categories,
    products,
    
    // State
    loading,
    error,
    
    // Actions
    fetchStats,
    fetchCustomers,
    fetchSuppliers,
    fetchCategories,
    fetchProducts,
    createCustomer,
    createSupplier,
    createCategory,
    createProduct,
    
    // Clear error
    clearError: () => setError(null)
  };
};

// Hook for dropdown options
export const useDropdownOptions = () => {
  const [options, setOptions] = useState({
    categories: [],
    suppliers: [],
    paymentTerms: [],
    supplierTypes: [],
    materials: [],
    packingTypes: [],
    qualityTypes: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        const dropdownOptions = await masterDataAPI.utils.getDropdownOptions();
        setOptions(dropdownOptions);
        setError(null);
      } catch (err) {
        setError(handleAPIError(err, 'Failed to fetch dropdown options'));
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  return { options, loading, error };
};

export default useMasterData;
