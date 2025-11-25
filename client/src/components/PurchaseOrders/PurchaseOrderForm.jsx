import React, { useState, useEffect } from 'react';
import { useDropdownOptions } from '../../hooks/useMasterData';
import masterDataAPI from '../../services/masterDataAPI';

const PurchaseOrderForm = ({ purchaseOrder, onSubmit, onCancel }) => {
  const { options, loading: optionsLoading } = useDropdownOptions();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Modal states for quick-add
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  
  // Dynamic units
  const [units, setUnits] = useState(['Bags', 'Rolls', 'Kg', 'Meters', 'Pieces', 'Tons', 'Liters', 'Units']);

  const [formData, setFormData] = useState({
    supplier: '',
    expectedDeliveryDate: '',
    category: '',
    items: [{
      product: '',
      quantity: 1,
      weight: 0,
      unit: 'Bags',
      notes: ''
    }]
  });

  // Fetch suppliers, products, and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppliersRes, productsRes, categoriesRes] = await Promise.all([
          masterDataAPI.suppliers.getAll({ limit: 100 }),
          masterDataAPI.products.getAll({ limit: 100 }),
          masterDataAPI.categories.getAll()
        ]);
        setSuppliers(suppliersRes.data || []);
        setProducts(productsRes.data || []);
        setCategories(categoriesRes.data || []);
        console.log('Categories loaded:', categoriesRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  // Populate form if editing, reset if null
  useEffect(() => {
    if (purchaseOrder) {
      setFormData({
        supplier: purchaseOrder.supplier?._id || '',
        expectedDeliveryDate: purchaseOrder.expectedDeliveryDate ? 
          new Date(purchaseOrder.expectedDeliveryDate).toISOString().split('T')[0] : '',
        category: purchaseOrder.category?._id || purchaseOrder.category || '',
        items: purchaseOrder.items?.map(item => ({
          product: item.product?._id || item.product || '',
          quantity: item.quantity || 1,
          weight: item.weight || item.specifications?.weight || 0,
          unit: item.unit || 'Bags',
          notes: item.notes || ''
        })) || [{
          product: '',
          quantity: 1,
          weight: 0,
          unit: 'Bags',
          notes: ''
        }]
      });
    } else {
      // Reset form when purchaseOrder is null (creating new PO)
      setFormData({
        supplier: '',
        expectedDeliveryDate: '',
        category: '',
        items: [{
          product: '',
          quantity: 1,
          weight: 0,
          unit: 'Bags',
          notes: ''
        }]
      });
      setErrors({});
    }
  }, [purchaseOrder]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCategoryChange = (e) => {
    const { value } = e.target;
    
    // Reset items when category changes
    setFormData(prev => ({
      ...prev,
      category: value,
      items: [{
        product: '',
        quantity: 1,
        weight: 0,
        unit: 'Bags',
        notes: ''
      }]
    }));

    // Clear errors
    if (errors.category) {
      setErrors(prev => ({
        ...prev,
        category: ''
      }));
    }
  };

  // Filter products by selected category
  const getFilteredProducts = () => {
    if (!formData.category) {
      return [];
    }
    return products.filter(product => 
      product.category?._id === formData.category || product.category === formData.category
    );
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));

    // Clear item-specific errors
    const errorKey = `items.${index}.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: ''
      }));
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product: '',
          quantity: 1,
          weight: 0,
          unit: 'Bags',
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

  const validateForm = () => {
    const newErrors = {};

    // Basic validations
    if (!formData.supplier) {
      newErrors.supplier = 'Supplier is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    // Optional: Validate delivery date only if provided
    if (formData.expectedDeliveryDate) {
      const deliveryDate = new Date(formData.expectedDeliveryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deliveryDate < today) {
        newErrors.expectedDeliveryDate = 'Delivery date cannot be in the past';
      }
    }

    // Item validations
    formData.items.forEach((item, index) => {
      if (!item.product) {
        newErrors[`items.${index}.product`] = 'Product is required';
      }
      if (!item.quantity || item.quantity <= 0) {
        newErrors[`items.${index}.quantity`] = 'Quantity must be greater than 0';
      }
      if (item.weight === undefined || item.weight === null || item.weight < 0) {
        newErrors[`items.${index}.weight`] = 'Weight must be greater than or equal to 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Quick-add handlers
  const handleQuickAddSupplier = async (supplierData) => {
    try {
      setModalLoading(true);
      const response = await masterDataAPI.suppliers.create(supplierData);
      if (response.success) {
        setSuppliers(prev => [...prev, response.data]);
        setFormData(prev => ({ ...prev, supplier: response.data._id }));
        setShowSupplierModal(false);
      }
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    } finally {
      setModalLoading(false);
    }
  };

  const handleQuickAddCategory = async (categoryData) => {
    try {
      setModalLoading(true);
      const response = await masterDataAPI.categories.create(categoryData);
      if (response.success) {
        setCategories(prev => [...prev, response.data]);
        setFormData(prev => ({ ...prev, category: response.data._id }));
        setShowCategoryModal(false);
      }
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    } finally {
      setModalLoading(false);
    }
  };

  const handleQuickAddProduct = async (productData) => {
    try {
      setModalLoading(true);
      const response = await masterDataAPI.products.create({
        ...productData,
        category: formData.category
      });
      if (response.success) {
        setProducts(prev => [...prev, response.data]);
        setShowProductModal(false);
      }
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    } finally {
      setModalLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // Prepare data for submission
      const submitData = {
        ...formData,
        items: formData.items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          weight: Number(item.weight)
        }))
      };

      // Remove empty expectedDeliveryDate to avoid validation issues
      if (!submitData.expectedDeliveryDate || submitData.expectedDeliveryDate === '') {
        delete submitData.expectedDeliveryDate;
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ submit: error.message || 'Failed to save purchase order' });
    } finally {
      setLoading(false);
    }
  };

  if (optionsLoading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading form data...</p>
      </div>
    );
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600 text-sm">{errors.submit}</p>
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Supplier *
              </label>
              <button
                type="button"
                onClick={() => setShowSupplierModal(true)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center"
              >
                <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Supplier
              </button>
            </div>
            <select
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
              className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.supplier ? 'border-red-500' : 'border-gray-300'
              } ${formData.supplier ? 'font-medium text-gray-900' : 'text-gray-500'}`}
            >
              <option value="">Select Supplier</option>
              {suppliers.map(supplier => (
                <option key={supplier._id} value={supplier._id}>
                  {supplier.companyName}
                </option>
              ))}
            </select>
            {errors.supplier && (
              <p className="text-red-500 text-xs mt-1">{errors.supplier}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected Delivery Date
            </label>
            <input
              type="date"
              name="expectedDeliveryDate"
              value={formData.expectedDeliveryDate}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.expectedDeliveryDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.expectedDeliveryDate && (
              <p className="text-red-500 text-xs mt-1">{errors.expectedDeliveryDate}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Category *
              </label>
              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center"
              >
                <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Category
              </button>
            </div>
            <div className="relative">
              <select
                name="category"
                value={formData.category}
                onChange={handleCategoryChange}
                className={`w-full px-3 py-2.5 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                } ${formData.category ? 'font-medium text-gray-900' : 'text-gray-500'}`}
              >
                <option value="">Select Category</option>
                {categories.filter(cat => cat.status === 'Active').map(category => (
                  <option key={category._id} value={category._id}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
            {errors.category && (
              <p className="text-red-500 text-xs mt-1">{errors.category}</p>
            )}
            {!formData.category ? (
              <p className="text-xs text-blue-600 mt-1.5 flex items-start">
                <svg className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>Select a category to filter available products. All items in this PO must be from the same category.</span>
              </p>
            ) : (
              <p className="text-xs text-green-600 mt-1.5 flex items-center">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{getFilteredProducts().length} product(s) available in this category</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Items</h3>
          <button
            type="button"
            onClick={addItem}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            + Add Item
          </button>
        </div>

        <div className="space-y-4">
          {formData.items.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
                {formData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Product *
                    </label>
                    {formData.category && (
                      <button
                        type="button"
                        onClick={() => setShowProductModal(true)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center"
                      >
                        <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Product
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <select
                      value={item.product}
                      onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                      disabled={!formData.category}
                      className={`w-full px-3 py-2.5 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`items.${index}.product`] ? 'border-red-500' : 'border-gray-300'
                      } ${!formData.category ? 'bg-gray-50 cursor-not-allowed text-gray-400' : 'bg-white'} ${item.product ? 'font-medium text-gray-900' : 'text-gray-500'}`}
                    >
                      <option value="">{!formData.category ? '⚠️ Select Category First' : 'Select Product'}</option>
                      {getFilteredProducts().map(product => (
                        <option key={product._id} value={product._id}>
                          {product.productName}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className={`h-5 w-5 ${!formData.category ? 'text-gray-300' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>
                  {errors[`items.${index}.product`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`items.${index}.product`]}</p>
                  )}
                  {!formData.category && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center">
                      <svg className="h-3.5 w-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Please select a category first
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[`items.${index}.quantity`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min="1"
                    step="1"
                  />
                  {errors[`items.${index}.quantity`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`items.${index}.quantity`]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <div className="relative">
                    <select
                      value={item.unit}
                      onChange={(e) => {
                        if (e.target.value === '__add_custom__') {
                          const newUnit = prompt('Enter custom unit name:');
                          if (newUnit && newUnit.trim()) {
                            const trimmedUnit = newUnit.trim();
                            if (!units.includes(trimmedUnit)) {
                              setUnits(prev => [...prev, trimmedUnit]);
                            }
                            handleItemChange(index, 'unit', trimmedUnit);
                          }
                        } else {
                          handleItemChange(index, 'unit', e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none"
                    >
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                      <option value="__add_custom__" className="text-blue-600 font-medium">➕ Add Custom Unit</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Select or add custom unit</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (Kg) *
                  </label>
                  <input
                    type="number"
                    value={item.weight}
                    onChange={(e) => handleItemChange(index, 'weight', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[`items.${index}.weight`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min="0"
                    step="0.01"
                  />
                  {errors[`items.${index}.weight`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`items.${index}.weight`]}</p>
                  )}
                </div>

                <div className="lg:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Notes
                  </label>
                  <input
                    type="text"
                    value={item.notes}
                    onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Special instructions for this item..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : (purchaseOrder ? 'Update PO' : 'Create PO')}
        </button>
      </div>
    </form>

      {/* Quick Add Modals */}
      {showSupplierModal && <QuickAddSupplierModal onClose={() => setShowSupplierModal(false)} onSubmit={handleQuickAddSupplier} loading={modalLoading} />}
      {showCategoryModal && <QuickAddCategoryModal onClose={() => setShowCategoryModal(false)} onSubmit={handleQuickAddCategory} loading={modalLoading} />}
      {showProductModal && <QuickAddProductModal onClose={() => setShowProductModal(false)} onSubmit={handleQuickAddProduct} loading={modalLoading} categoryId={formData.category} />}
    </>
  );
};

// Quick Add Supplier Modal
const QuickAddSupplierModal = ({ onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({ companyName: '', gstNumber: '', city: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      setError('Company name is required');
      return;
    }
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err.message || 'Failed to create supplier');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">Quick Add Supplier</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
            <input type="text" value={formData.companyName} onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter company name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
            <input type="text" value={formData.gstNumber} onChange={(e) => setFormData(prev => ({ ...prev, gstNumber: e.target.value.toUpperCase() }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="22AAAAA0000A1Z5" maxLength="15" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input type="text" value={formData.city} onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter city" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? 'Adding...' : 'Add Supplier'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Quick Add Category Modal
const QuickAddCategoryModal = ({ onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({ categoryName: '', description: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.categoryName.trim()) {
      setError('Category name is required');
      return;
    }
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err.message || 'Failed to create category');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">Quick Add Category</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
            <input type="text" value={formData.categoryName} onChange={(e) => setFormData(prev => ({ ...prev, categoryName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Cotton Yarn, Plastic" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" placeholder="Optional description" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? 'Adding...' : 'Add Category'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Quick Add Product Modal
const QuickAddProductModal = ({ onClose, onSubmit, loading, categoryId }) => {
  const [formData, setFormData] = useState({ productName: '', description: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productName.trim()) {
      setError('Product name is required');
      return;
    }
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err.message || 'Failed to create product');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">Quick Add Product</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input type="text" value={formData.productName} onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter product name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" placeholder="Optional description" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? 'Adding...' : 'Add Product'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseOrderForm;
