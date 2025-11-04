import React, { useState, useEffect } from 'react';
import { salesOrderAPI } from '../../services/salesOrderAPI.js';
import { apiRequest } from '../../services/common.js';
import { inventoryAPI } from '../../services/inventoryAPI.js';
import masterDataAPI from '../../services/masterDataAPI';
import CustomerForm from '../masterdata/Customers/CustomerForm';

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
      availableStock: 0
    }],
    notes: ''
  });

  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [inventoryProducts, setInventoryProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);

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
            availableStock: 0
          }],
          notes: ''
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
            availableStock: 0
          })),
          notes: order.notes || ''
        });
        
        // Load inventory for the existing category
        if (categoryId) {
          loadInventoryByCategory(categoryId);
        }
      }
    }
  }, [isOpen, order]);

  const loadCustomers = async () => {
    try {
      // Load customers from master data API (centralized base)
      const data = await apiRequest('/master-data/customers');
      
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
    }
  };

  const loadCategories = async () => {
    try {
      // First get all categories
      const categoriesResponse = await masterDataAPI.categories.getAll();
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
    }
  };

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
      const weightPerUnit = totalStock > 0 ? totalWeight / totalStock : 0;
      
      // Suggest weight based on quantity (user can still edit)
      if (weightPerUnit > 0 && qty > 0) {
        updatedItems[index].weight = (qty * weightPerUnit).toFixed(2);
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
          availableStock: 0
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

  const handleCustomerSaved = async (newCustomer) => {
    setShowCustomerModal(false);
    // Reload customers
    await loadCustomers();
    // Auto-select the new customer
    if (newCustomer && newCustomer._id) {
      setFormData(prev => ({
        ...prev,
        customer: newCustomer._id
      }));
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

      if (!formData.expectedDeliveryDate) {
        setError('Please select expected delivery date');
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
        expectedDeliveryDate: formData.expectedDeliveryDate,
        category: formData.category,
        items: formData.items.map(item => {
          const selectedProduct = inventoryProducts.find(p => p._id === item.product);
          return {
            product: item.product,
            productName: selectedProduct?.productName || 'Unknown Product',
            productCode: selectedProduct?.productCode || 'UNKNOWN',
            quantity: parseFloat(item.quantity),
            unit: item.unit,
            weight: parseFloat(item.weight || 0)
          };
        }),
        notes: formData.notes || ''
      };

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {order ? 'Update Sales Order' : 'New Sales Order'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Close</span>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Validation Error</h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Customer and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Customer *
                </label>
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + Add Customer
                </button>
              </div>
              <select
                name="customer"
                value={formData.customer}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Customer</option>
                {customers.map(customer => (
                  <option key={customer._id} value={customer._id}>
                    {customer.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Delivery Date *
              </label>
              <input
                type="date"
                name="expectedDeliveryDate"
                value={formData.expectedDeliveryDate}
                onChange={handleInputChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleCategoryChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.categoryName}
                </option>
              ))}
            </select>
            {!formData.category && (
              <p className="text-xs text-blue-600 mt-1">
                ℹ️ Select a category first to see available products from inventory
              </p>
            )}
          </div>


          {/* Items Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
              <button
                type="button"
                onClick={addItem}
                disabled={!formData.category}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product *
                      </label>
                      <select
                        value={item.product}
                        onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                        required
                        disabled={!formData.category}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">
                          {formData.category ? 'Select Product' : 'Select Category First'}
                        </option>
                        {inventoryProducts.map(product => (
                          <option key={product._id} value={product._id}>
                            {product.productName} (Stock: {product.totalStock} {product.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {item.availableStock > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Available: {item.availableStock} {item.unit}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit
                      </label>
                      <input
                        type="text"
                        value={item.unit}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {item.totalProductWeight > 0 && item.productStock > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
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
                          className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>



          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              placeholder="Order notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
            >
              {loading ? 'Saving...' : (order ? 'Update Order' : 'Create Order')}
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
