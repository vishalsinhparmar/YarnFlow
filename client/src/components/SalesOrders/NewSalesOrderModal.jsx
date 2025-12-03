import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, X, User, Package, Calendar } from 'lucide-react';
import { salesOrderAPI } from '../../services/salesOrderAPI.js';
import { apiRequest } from '../../services/common.js';
import { inventoryAPI } from '../../services/inventoryAPI.js';
import masterDataAPI from '../../services/masterDataAPI';
import CustomerForm from '../masterdata/Customers/CustomerForm';
import SearchableSelect from '../common/SearchableSelect';

const NewSalesOrderModal = ({ isOpen, onClose, onSubmit, order = null }) => {
  const [formData, setFormData] = useState({
    customer: '',
    expectedDeliveryDate: '',
    category: '',
    items: [{
      product: '',
      quantity: '',
      unit: '',
      weight: '',
      availableStock: 0,
      notes: ''
    }]
  });

  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [inventoryProducts, setInventoryProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Define load functions first with useCallback
  const loadCustomers = useCallback(async (search = '') => {
    try {
      setLoadingCustomers(true);
      // Load customers from master data API (centralized base) - get all customers (up to 100)
      let url = '/master-data/customers?limit=100';
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const data = await apiRequest(url);
      
      if (data.success) {
        setCustomers(data.data || []);
      } else {
        // Fallback to mock data if API fails
        const mockCustomers = [
          { _id: '1', companyName: 'Fashion Hub Ltd.', contactPerson: 'Rajesh Kumar', email: 'rajesh@fashionhub.com', phone: '9876543210' },
          { _id: '2', companyName: 'Textile World Co.', contactPerson: 'Priya Sharma', email: 'priya@textileworld.com', phone: '9876543211' },
          { _id: '3', companyName: 'Premium Fabrics Inc.', contactPerson: 'Amit Patel', email: 'amit@premiumfabrics.com', phone: '9876543212' }
        ];
        setCustomers(mockCustomers);
      }
    } catch (err) {
      console.error('Error loading customers:', err);
      // Fallback to mock data
      const mockCustomers = [
        { _id: '1', companyName: 'Fashion Hub Ltd.', contactPerson: 'Rajesh Kumar', email: 'rajesh@fashionhub.com', phone: '9876543210' },
        { _id: '2', companyName: 'Textile World Co.', contactPerson: 'Priya Sharma', email: 'priya@textileworld.com', phone: '9876543211' },
        { _id: '3', companyName: 'Premium Fabrics Inc.', contactPerson: 'Amit Patel', email: 'amit@premiumfabrics.com', phone: '9876543212' }
      ];
      setCustomers(mockCustomers);
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  const loadCategories = useCallback(async (search = '') => {
    try {
      setLoadingCategories(true);
      // First get all categories (up to 100)
      const params = { limit: 100 };
      if (search) params.search = search;
      const categoriesResponse = await masterDataAPI.categories.getAll(params);
      if (!categoriesResponse.success) {
        return;
      }

      // Then get inventory to see which categories have products
      const inventoryResponse = await inventoryAPI.getAll();
      if (!inventoryResponse.success || !inventoryResponse.data) {
        setCategories(categoriesResponse.data || []);
        return;
      }

      // Get category IDs that have inventory
      const categoriesWithInventory = new Set();
      inventoryResponse.data.forEach(cat => {
        if (cat.products && cat.products.length > 0) {
          categoriesWithInventory.add(cat.categoryId);
        }
      });

      // Filter categories to only show those with inventory
      const filteredCategories = categoriesResponse.data.filter(category => 
        categoriesWithInventory.has(category._id)
      );

      setCategories(filteredCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const loadInventoryByCategory = async (categoryId) => {
    try {
      const response = await inventoryAPI.getAll({ category: categoryId });
      if (response.success && response.data) {
        // Transform inventory data to product list
        const products = [];
        response.data.forEach(cat => {
          if (cat.products) {
            cat.products.forEach(product => {
              products.push({
                _id: product.productId,
                productName: product.productName,
                productCode: product.productCode,
                unit: product.unit,
                totalStock: product.totalStock,
                totalWeight: product.totalWeight
              });
            });
          }
        });
        setInventoryProducts(products);
      } else {
        setInventoryProducts([]);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      setInventoryProducts([]);
    }
  };

  // Load customers and categories on mount
  useEffect(() => {
    if (isOpen) {
      loadCustomers();
      loadCategories();
      
      // Reset form data when opening modal
      if (!order) {
        setFormData({
          customer: '',
          expectedDeliveryDate: '',
          category: '',
          items: [{
            product: '',
            quantity: '',
            unit: '',
            weight: '',
            availableStock: 0,
            notes: ''
          }]
        });
      }
      
      // If editing existing order, populate form
      if (order) {
        const categoryId = order.category?._id || order.category || '';
        setFormData({
          customer: order.customer._id || order.customer,
          expectedDeliveryDate: order.expectedDeliveryDate ? 
            new Date(order.expectedDeliveryDate).toISOString().split('T')[0] : '',
          category: categoryId,
          items: order.items.map(item => ({
            product: item.product._id || item.product,
            quantity: item.quantity || '',
            unit: item.unit || '',
            weight: item.weight || '',
            availableStock: 0,
            notes: item.notes || ''
          }))
        });
        
        // Load inventory for the existing category
        if (categoryId) {
          loadInventoryByCategory(categoryId);
        }
      }
    }
  }, [isOpen, order, loadCustomers, loadCategories]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      category: value,
      items: [{
        product: '',
        quantity: '',
        unit: '',
        weight: '',
        availableStock: 0
      }]
    }));
    
    if (value) {
      loadInventoryByCategory(value);
    } else {
      setInventoryProducts([]);
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

    // Auto-populate from inventory when product selected
    if (field === 'product') {
      const selectedProduct = inventoryProducts.find(p => p._id === value);
      if (selectedProduct) {
        updatedItems[index] = {
          ...updatedItems[index],
          unit: selectedProduct.unit,
          availableStock: selectedProduct.totalStock,
          totalProductWeight: selectedProduct.totalWeight || 0,
          productStock: selectedProduct.totalStock || 0
          // Don't auto-fill weight - let user enter it
        };
      }
    }
    
    // Auto-calculate suggested weight when quantity changes
    if (field === 'quantity') {
      const qty = parseFloat(value) || 0;
      const totalWeight = updatedItems[index].totalProductWeight || 0;
      const totalStock = updatedItems[index].productStock || 1;
      
      // Calculate weight per unit from inventory
      const weightPerUnit = totalStock > 0 ? parseFloat((totalWeight / totalStock).toFixed(4)) : 0;
      
      // Suggest weight based on quantity (user can still edit)
      if (weightPerUnit > 0 && qty > 0) {
        updatedItems[index].weight = parseFloat((qty * weightPerUnit).toFixed(2));
      }
    }

    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product: '',
          quantity: '',
          unit: '',
          weight: '',
          availableStock: 0,
          notes: ''
        }
      ]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const handleCustomerSaved = async (customerData) => {
    try {
      // Create customer via API
      const response = await apiRequest('/master-data/customers', {
        method: 'POST',
        body: JSON.stringify(customerData)
      });
      
      setShowCustomerModal(false);
      
      // Reload customers and wait for state update
      await loadCustomers();
      
      // Use setTimeout to ensure state is updated before setting selection
      setTimeout(() => {
        if (response && response._id) {
          setFormData(prev => ({
            ...prev,
            customer: response._id
          }));
        }
      }, 100);
      
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Failed to create customer: ' + (error.message || 'Unknown error'));
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate all required fields
      if (!formData.customer) {
        setError('Please select a customer');
        setLoading(false);
        return;
      }

      if (!formData.category) {
        setError('Please select a category');
        setLoading(false);
        return;
      }

      if (!formData.items || formData.items.length === 0) {
        setError('Please add at least one item');
        setLoading(false);
        return;
      }

      // Validate each item
      for (let i = 0; i < formData.items.length; i++) {
        const item = formData.items[i];
        if (!item.product) {
          setError(`Please select a product for item ${i + 1}`);
          setLoading(false);
          return;
        }
        if (!item.quantity || parseFloat(item.quantity) <= 0) {
          setError(`Please enter a valid quantity for item ${i + 1}`);
          setLoading(false);
          return;
        }
        if (!item.unit) {
          setError(`Unit is missing for item ${i + 1}`);
          setLoading(false);
          return;
        }
      }

      // Prepare data for API
      const orderData = {
        customer: formData.customer,
        category: formData.category,
        items: formData.items.map(item => {
          const selectedProduct = inventoryProducts.find(p => p._id === item.product);
          return {
            product: item.product,
            productName: selectedProduct?.productName || 'Unknown Product',
            productCode: selectedProduct?.productCode || 'UNKNOWN',
            quantity: parseFloat(item.quantity),
            unit: item.unit,
            weight: parseFloat(item.weight || 0),
            notes: item.notes || ''
          };
        })
      };

      // Only include expectedDeliveryDate if it has a value
      if (formData.expectedDeliveryDate) {
        orderData.expectedDeliveryDate = formData.expectedDeliveryDate;
      }

      console.log('Submitting order data:', orderData);

      let createdSO = null;
      
      if (order) {
        // Update existing order
        const response = await salesOrderAPI.update(order._id, orderData);
        if (!response.success) {
          throw new Error(response.message || 'Failed to update order');
        }
        createdSO = response.data;
      } else {
        // Create new order
        const response = await salesOrderAPI.create(orderData);
        if (!response.success) {
          throw new Error(response.message || 'Failed to create order');
        }
        createdSO = response.data;
      }

      // Call onSubmit if provided (for CreateChallanModal integration)
      if (onSubmit && createdSO) {
        onSubmit(createdSO);
      } else {
        onClose();
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err.message || 'Failed to submit order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50 rounded-lg">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
              <p className="text-lg font-semibold text-gray-700">
                {order ? 'Updating' : 'Creating'} Sales Order...
              </p>
              <p className="text-sm text-gray-500 mt-2">Please wait</p>
            </div>
          </div>
        )}

        <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              {order ? 'Update Sales Order' : 'New Sales Order'}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="sr-only">Close</span>
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-semibold text-red-800">Validation Error</h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Customer and Basic Info */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-blue-100">
            <div className="flex items-center mb-6">
              <svg className="h-6 w-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900">Customer Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <SearchableSelect
                label="Customer"
                required
                options={customers}
                value={formData.customer}
                onChange={(value) => setFormData(prev => ({ ...prev, customer: value }))}
                placeholder="Select Customer"
                searchPlaceholder="Search customers..."
                getOptionLabel={(customer) => customer.companyName}
                getOptionValue={(customer) => customer._id}
                onSearch={loadCustomers}
                loading={loadingCustomers}
                onAddNew={() => setShowCustomerModal(true)}
                addNewLabel="Add Customer"
                renderOption={(customer, isSelected) => (
                  <div className="flex flex-col">
                    <span className="font-medium">{customer.companyName}</span>
                    {customer.contactPerson && (
                      <span className="text-xs text-gray-500">{customer.contactPerson}</span>
                    )}
                  </div>
                )}
              />
            </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  name="expectedDeliveryDate"
                  value={formData.expectedDeliveryDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-blue-400 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <SearchableSelect
              label="Category"
              required
              options={categories}
              value={formData.category}
              onChange={(value) => {
                setFormData(prev => ({ ...prev, category: value }));
                handleCategoryChange({ target: { name: 'category', value } });
              }}
              placeholder="Select Category"
              searchPlaceholder="Search categories..."
              getOptionLabel={(category) => category.categoryName}
              getOptionValue={(category) => category._id}
              onSearch={loadCategories}
              loading={loadingCategories}
              renderOption={(category, isSelected) => (
                <div className="flex flex-col">
                  <span className="font-medium">{category.categoryName}</span>
                  {category.description && (
                    <span className="text-xs text-gray-500 truncate">{category.description}</span>
                  )}
                </div>
              )}
            />
            {!formData.category && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                <p className="text-xs text-blue-700 flex items-start">
                  <svg className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Select a category first to see available products from inventory</span>
                </p>
              </div>
            )}
          </div>


          {/* Items Section */}
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <svg className="h-6 w-6 text-gray-700 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900">Order Items</h3>
              </div>
              <button
                type="button"
                onClick={addItem}
                disabled={!formData.category}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Item
              </button>
            </div>

            <div className="space-y-5">
              {formData.items.map((item, index) => (
                <div key={index} className="bg-white border-2 border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-100 text-blue-700 font-bold rounded-full h-8 w-8 flex items-center justify-center text-sm">
                      {index + 1}
                    </div>
                    <h4 className="font-semibold text-gray-900 text-lg">Item #{index + 1}</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2">
                      <SearchableSelect
                        label="Product"
                        required
                        options={inventoryProducts}
                        value={item.product}
                        onChange={(value) => handleItemChange(index, 'product', value)}
                        placeholder={formData.category ? 'Select Product' : 'Select Category First'}
                        searchPlaceholder="Search products..."
                        getOptionLabel={(product) => product.productName}
                        getOptionValue={(product) => product._id}
                        disabled={!formData.category}
                        emptyMessage={!formData.category ? 'Please select a category first' : 'No products in inventory'}
                        renderOption={(product, isSelected) => (
                          <div className="flex flex-col">
                            <span className="font-medium">{product.productName}</span>
                            <span className="text-xs text-gray-500">
                              Stock: {product.totalStock} {product.unit}
                            </span>
                          </div>
                        )}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        required
                        min="0.01"
                        max={item.availableStock || undefined}
                        step="0.01"
                        placeholder="Enter quantity"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-blue-400 transition-all"
                      />
                      {item.availableStock > 0 && (
                        <p className="text-xs text-green-600 mt-1.5 flex items-center">
                          <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Available: {item.availableStock} {item.unit}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                        </svg>
                        Unit
                      </label>
                      <input
                        type="text"
                        value={item.unit}
                        readOnly
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm bg-gray-50 text-gray-600 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                        </svg>
                        Weight (Kg) *
                      </label>
                      <input
                        type="number"
                        value={item.weight}
                        onChange={(e) => handleItemChange(index, 'weight', e.target.value)}
                        required
                        min="0"
                        step="0.01"
                        placeholder="Auto-calculated or enter manually"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-blue-400 transition-all"
                      />
                      {item.totalProductWeight > 0 && item.productStock > 0 && (
                        <p className="text-xs text-blue-600 mt-1.5 flex items-center">
                          <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          Suggested: {((item.totalProductWeight / item.productStock) * (parseFloat(item.quantity) || 0)).toFixed(2)} Kg
                          ({(item.totalProductWeight / item.productStock).toFixed(2)} Kg per {item.unit})
                        </p>
                      )}
                    </div>

                    <div className="flex items-end">
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="w-full px-3 py-2.5 text-red-600 hover:bg-red-50 border-2 border-red-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Item Notes - NEW */}
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      Item Notes
                    </label>
                    <textarea
                      value={item.notes || ''}
                      onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                      placeholder="Add special instructions or notes for this item..."
                      rows="2"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-blue-400 transition-all resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1.5 flex items-center">
                      <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      These notes will appear on the challan and PDF
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>



          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-8 border-t-2 border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center gap-2 shadow-sm"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {order ? 'Update Sales Order' : 'Create Sales Order'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add New Customer</h3>
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <CustomerForm
                onCancel={() => setShowCustomerModal(false)}
                onSubmit={handleCustomerSaved}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewSalesOrderModal;
