import React, { useState, useEffect, useCallback } from 'react';
import { Plus, X, Loader2, Settings } from 'lucide-react';
import { usePaginatedSearch } from '../../hooks/usePaginatedSearch';
import masterDataAPI, { subProductAPI, unitAPI } from '../../services/masterDataAPI';
import SearchableSelect from '../common/SearchableSelect';
import SubProductSelector from '../common/SubProductSelector';
import UnitManagement from '../common/UnitManagement';

const PurchaseOrderForm = ({ purchaseOrder, onSubmit, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    supplier: '',
    expectedDeliveryDate: '',
    category: '',
    items: [{
      product: '',
      subProduct: '',
      subProductName: '',
      subProductWeights: [],
      quantity: 1,
      weight: 0,
      unit: 'Bags',
      notes: ''
    }]
  });

  // Paginated dropdowns
  const {
    items: suppliers,
    setItems: setSuppliers,
    loading: loadingSuppliers,
    loadingMore: loadingMoreSuppliers,
    hasMore: hasMoreSuppliers,
    total: totalSuppliers,
    handleSearch: handleSupplierSearch,
    handleLoadMore: loadMoreSuppliers,
    refresh: refreshSuppliers
  } = usePaginatedSearch(masterDataAPI.suppliers.getAll, { limit: 50 });

  const {
    items: categories,
    setItems: setCategories,
    loading: loadingCategories,
    loadingMore: loadingMoreCategories,
    hasMore: hasMoreCategories,
    total: totalCategories,
    handleSearch: handleCategorySearch,
    handleLoadMore: loadMoreCategories,
    refresh: refreshCategories
  } = usePaginatedSearch(masterDataAPI.categories.getAll, { limit: 50 });

  const productSearch = usePaginatedSearch(
    masterDataAPI.products.getAll,
    { limit: 50, enabled: !!formData.category, extraParams: formData.category ? { category: formData.category } : {} }
  );

  // Modal states for quick-add
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  
  // Dynamic units from backend - start with defaults so UI is never empty
  const defaultUnits = [
    { _id: 'bags', name: 'Bags' },
    { _id: 'rolls', name: 'Rolls' },
    { _id: 'kg', name: 'Kg' },
    { _id: 'meters', name: 'Meters' },
    { _id: 'pieces', name: 'Pieces' },
    { _id: 'tons', name: 'Tons' },
    { _id: 'liters', name: 'Liters' },
    { _id: 'units', name: 'Units' }
  ];
  const [units, setUnits] = useState(defaultUnits);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [newSubProductNames, setNewSubProductNames] = useState({});
  const [loadingAddSubProduct, setLoadingAddSubProduct] = useState({});

  const selectedCategory = categories.find(c => c._id === formData.category);
  const categoryHasSubProducts = selectedCategory?.hasSubProducts || false;

  // Fetch units from backend (optional - we already have defaults)
  const fetchUnits = useCallback(async () => {
    try {
      setLoadingUnits(true);
      const response = await unitAPI.getAll();
      if (response.success && response.data && response.data.length > 0) {
        setUnits(response.data);
      }
      // If API fails or returns empty, we keep the default units
    } catch (error) {
      console.error('Error fetching units:', error);
      // Keep default units - no action needed
    } finally {
      setLoadingUnits(false);
    }
  }, []);

  // Fetch units on mount (paginated dropdowns load via their hooks)
  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  // When category changes, reset and reload products via the hook
  useEffect(() => {
    if (formData.category) {
      productSearch.refresh();
    } else {
      productSearch.setItems([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.category]);

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
          subProduct: item.subProduct?._id || item.subProduct || '',
          subProductName: item.subProductName || '',
          subProductWeights: Array.isArray(item.subProductWeights) ? item.subProductWeights : [],
          quantity: item.quantity || 1,
          weight: item.weight || item.specifications?.weight || 0,
          unit: item.unit || 'Bags',
          notes: item.notes || ''
        })) || [{
          product: '',
          subProduct: '',
          subProductName: '',
          subProductWeights: [],
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
          subProduct: '',
          subProductName: '',
          subProductWeights: [],
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
        subProduct: '',
        subProductName: '',
        subProductWeights: [],
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

  // Filter products by selected category (already filtered by API, but keep client-side guard)
  const getFilteredProducts = () => {
    if (!formData.category) {
      return [];
    }
    return productSearch.items.filter(product =>
      product.category?._id === formData.category || product.category === formData.category
    );
  };

  const getSelectedProduct = (productId) => {
    return productSearch.items.find(p => p._id === productId);
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    const item = { ...updatedItems[index] };

    if (field === 'product') {
      item.product = value;
      item.subProduct = '';
      item.subProductName = '';
      item.subProductWeights = [];
      // Keep weight if switching away from sub-product, otherwise reset to 0
      const prod = getSelectedProduct(value);
      if (categoryHasSubProducts && prod?.subProducts?.length > 0) {
        item.weight = 0;
      }
    } else if (field === 'quantity') {
      item.quantity = value;
      if (categoryHasSubProducts && item.subProduct) {
        const qty = Math.max(1, Number(value) || 1);
        const currentWeights = Array.isArray(item.subProductWeights) ? item.subProductWeights : [];
        const nextWeights = [];
        for (let i = 0; i < qty; i++) {
          nextWeights.push(i < currentWeights.length ? currentWeights[i] : 0);
        }
        item.subProductWeights = nextWeights;
        item.weight = nextWeights.reduce((sum, w) => sum + (Number(w) || 0), 0);
      }
    } else if (field === 'weight') {
      item.weight = value;
      // If user edits total weight while sub-product is selected, spread evenly across units
      if (categoryHasSubProducts && item.subProduct) {
        const qty = Math.max(1, Number(item.quantity) || 1);
        const total = Number(value) || 0;
        const perUnit = total / qty;
        item.subProductWeights = Array.from({ length: qty }, () => perUnit);
      }
    } else {
      item[field] = value;
    }

    updatedItems[index] = item;
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

  const handleSubProductWeightsChange = (index, weights) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      subProductWeights: weights,
      weight: weights.reduce((sum, w) => sum + (Number(w) || 0), 0)
    };
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const handleSubProductSelect = (index, subProductId, subProductName) => {
    const updatedItems = [...formData.items];
    const item = { ...updatedItems[index] };
    item.subProduct = subProductId;
    item.subProductName = subProductName;
    // Initialize weights when selecting a sub-product
    const qty = Math.max(1, Number(item.quantity) || 1);
    if (!Array.isArray(item.subProductWeights) || item.subProductWeights.length !== qty) {
      item.subProductWeights = Array.from({ length: qty }, () => 0);
    }
    item.weight = item.subProductWeights.reduce((sum, w) => sum + (Number(w) || 0), 0);
    updatedItems[index] = item;
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  // Group flat items by product so one product card can contain multiple sub-product rows
  const getProductGroups = () => {
    const groups = [];
    const seen = new Map();
    formData.items.forEach((item, index) => {
      const key = item.product || `__empty__${index}`;
      if (!seen.has(key)) {
        const group = {
          product: item.product,
          productName: item.productName,
          productCode: item.productCode,
          unit: item.unit,
          indices: [],
          items: []
        };
        seen.set(key, group);
        groups.push(group);
      }
      seen.get(key).indices.push(index);
      seen.get(key).items.push(item);
    });
    return groups;
  };

  const addProductGroup = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product: '',
          subProduct: '',
          subProductName: '',
          subProductWeights: [],
          quantity: 1,
          weight: 0,
          unit: 'Bags',
          notes: ''
        }
      ]
    }));
  };

  const removeProductGroup = (group) => {
    const remaining = formData.items.filter((_, i) => !group.indices.includes(i));
    if (remaining.length === 0) {
      setFormData(prev => ({
        ...prev,
        items: [{
          product: '',
          subProduct: '',
          subProductName: '',
          subProductWeights: [],
          quantity: 1,
          weight: 0,
          unit: 'Bags',
          notes: ''
        }]
      }));
    } else {
      setFormData(prev => ({ ...prev, items: remaining }));
    }
  };

  const updateGroupProduct = (group, newProductId) => {
    const prod = getSelectedProduct(newProductId);
    const updatedItems = formData.items.map((item, i) => {
      if (!group.indices.includes(i)) return item;
      return {
        ...item,
        product: newProductId,
        productName: prod?.productName || '',
        productCode: prod?.productCode || '',
        subProduct: '',
        subProductName: '',
        subProductWeights: [],
        weight: categoryHasSubProducts && prod?.subProducts?.length > 0 ? 0 : item.weight
      };
    });
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const updateGroupUnit = (group, newUnit) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        group.indices.includes(i) ? { ...item, unit: newUnit } : item
      )
    }));
  };

  const addSubProductRow = (group) => {
    const lastIndex = Math.max(...group.indices);
    const template = formData.items[group.indices[0]] || {
      product: '',
      subProduct: '',
      subProductName: '',
      subProductWeights: [],
      quantity: 1,
      weight: 0,
      unit: 'Bags',
      notes: ''
    };
    const newRow = {
      ...template,
      subProduct: '',
      subProductName: '',
      subProductWeights: [],
      quantity: 1,
      weight: 0,
      notes: ''
    };
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items.slice(0, lastIndex + 1),
        newRow,
        ...prev.items.slice(lastIndex + 1)
      ]
    }));
  };

  const removeSubProductRow = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    } else {
      // Reset the only remaining row
      setFormData(prev => ({
        ...prev,
        items: [{
          product: '',
          subProduct: '',
          subProductName: '',
          subProductWeights: [],
          quantity: 1,
          weight: 0,
          unit: 'Bags',
          notes: ''
        }]
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
        productSearch.setItems(prev => [...prev, response.data]);
        setShowProductModal(false);
      }
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    } finally {
      setModalLoading(false);
    }
  };

  const handleQuickAddUnit = async (unitData) => {
    try {
      setModalLoading(true);
      const response = await unitAPI.create(unitData);
      if (response.success) {
        setUnits(prev => [...prev, response.data]);
        setShowUnitModal(false);
        return response.data;
      }
    } catch (error) {
      console.error('Error creating unit:', error);
      throw error;
    } finally {
      setModalLoading(false);
    }
  };

  const handleAddSubProductForProduct = async (productId) => {
    const name = (newSubProductNames[productId] || '').trim();
    if (!name || !productId) return;
    setLoadingAddSubProduct(prev => ({ ...prev, [productId]: true }));
    try {
      const response = await subProductAPI.bulkAdd(productId, [name]);
      if (response.success) {
        const created = Array.isArray(response.data) ? response.data : [];
        productSearch.setItems(prev => prev.map(p => {
          if (p._id !== productId) return p;
          const existing = Array.isArray(p.subProducts) ? p.subProducts : [];
          return { ...p, subProducts: [...existing, ...created] };
        }));
        setNewSubProductNames(prev => ({ ...prev, [productId]: '' }));
      }
    } catch (error) {
      console.error('Error adding sub-product:', error);
    } finally {
      setLoadingAddSubProduct(prev => ({ ...prev, [productId]: false }));
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

  if (loadingSuppliers || loadingCategories) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading form data...</p>
      </div>
    );
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-8 bg-white">
      {errors.submit && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-700 font-medium">{errors.submit}</p>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-blue-100">
        <div className="flex items-center mb-6">
          <svg className="h-6 w-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900">Basic Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <SearchableSelect
              label="Supplier"
              required
              options={suppliers}
              value={formData.supplier}
              onChange={(value) => setFormData(prev => ({ ...prev, supplier: value }))}
              placeholder="Select Supplier"
              searchPlaceholder="Search suppliers..."
              getOptionLabel={(supplier) => supplier.companyName}
              getOptionValue={(supplier) => supplier._id}
              onSearch={handleSupplierSearch}
              loading={loadingSuppliers}
              loadingMore={loadingMoreSuppliers}
              hasMore={hasMoreSuppliers}
              onLoadMore={loadMoreSuppliers}
              total={totalSuppliers}
              error={errors.supplier}
              onAddNew={() => setShowSupplierModal(true)}
              addNewLabel="Add Supplier"
              renderOption={(supplier, isSelected) => (
                <div className="flex flex-col">
                  <span className="font-medium">{supplier.companyName}</span>
                  {supplier.city && (
                    <span className="text-xs text-gray-500">{supplier.city}</span>
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
              onChange={handleChange}
              className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.expectedDeliveryDate ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-blue-400'
              }`}
            />
            {errors.expectedDeliveryDate && (
              <p className="text-red-600 text-xs mt-1.5 flex items-center">
                <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.expectedDeliveryDate}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <SearchableSelect
              label="Category"
              required
              options={categories.filter(cat => cat.status === 'Active')}
              value={formData.category}
              onChange={(value) => {
                setFormData(prev => ({ ...prev, category: value }));
                handleCategoryChange({ target: { name: 'category', value } });
              }}
              placeholder="Select Category"
              searchPlaceholder="Search categories..."
              getOptionLabel={(category) => category.categoryName}
              getOptionValue={(category) => category._id}
              onSearch={handleCategorySearch}
              loading={loadingCategories}
              loadingMore={loadingMoreCategories}
              hasMore={hasMoreCategories}
              onLoadMore={loadMoreCategories}
              total={totalCategories}
              error={errors.category}
              onAddNew={() => setShowCategoryModal(true)}
              addNewLabel="Add Category"
              renderOption={(category, isSelected) => (
                <div className="flex flex-col">
                  <span className="font-medium">{category.categoryName}</span>
                  {category.description && (
                    <span className="text-xs text-gray-500 truncate">{category.description}</span>
                  )}
                </div>
              )}
            />
            {!formData.category ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                <p className="text-xs text-blue-700 flex items-start">
                  <svg className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Select a category to filter available products. All items in this PO must be from the same category.</span>
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                <p className="text-xs text-green-700 flex items-center">
                  <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">{getFilteredProducts().length} product(s) available in this category</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items */}
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
            onClick={addProductGroup}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        </div>

        <div className="space-y-5">
          {getProductGroups().map((group, groupIndex) => (
            <div key={groupIndex} className="bg-white border-2 border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-700 font-bold rounded-full h-8 w-8 flex items-center justify-center text-sm">
                    {groupIndex + 1}
                  </div>
                  <h4 className="font-semibold text-gray-900 text-lg">Product Section</h4>
                </div>
                <button
                  type="button"
                  onClick={() => removeProductGroup(group)}
                  className="px-3 py-1.5 text-red-600 hover:bg-red-50 border border-red-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove Product
                </button>
              </div>

              <div className="space-y-4">
                {/* Product + Unit selection for the whole group */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <SearchableSelect
                      label="Product"
                      required
                      options={getFilteredProducts()}
                      value={group.product}
                      onChange={(value) => updateGroupProduct(group, value)}
                      placeholder={!formData.category ? '⚠️ Select Category First' : 'Select Product'}
                      searchPlaceholder="Search products..."
                      getOptionLabel={(product) => product.productName}
                      getOptionValue={(product) => product._id}
                      onSearch={productSearch.handleSearch}
                      loading={productSearch.loading}
                      loadingMore={productSearch.loadingMore}
                      hasMore={productSearch.hasMore}
                      onLoadMore={productSearch.handleLoadMore}
                      total={productSearch.total}
                      disabled={!formData.category}
                      error={errors[`items.${group.indices[0]}.product`]}
                      onAddNew={formData.category ? () => setShowProductModal(true) : undefined}
                      addNewLabel="Add Product"
                      emptyMessage={!formData.category ? 'Please select a category first' : 'No products found'}
                      renderOption={(product, isSelected) => (
                        <div className="flex flex-col">
                          <span className="font-medium">{product.productName}</span>
                          {product.description && (
                            <span className="text-xs text-gray-500 truncate">{product.description}</span>
                          )}
                        </div>
                      )}
                    />
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                      Unit *
                      {loadingUnits && <Loader2 className="w-3 h-3 ml-2 animate-spin text-blue-500" />}
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <select
                          value={group.unit}
                          onChange={(e) => updateGroupUnit(group, e.target.value)}
                          className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-blue-400 appearance-none transition-all"
                        >
                          {units.map(unit => (
                            <option key={unit._id || unit.name} value={unit.name}>
                              {unit.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowUnitModal(true)}
                        className="px-3 py-2.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-100 hover:border-orange-300 transition-all flex items-center gap-1 font-medium text-sm whitespace-nowrap"
                        title="Manage Units"
                      >
                        <Settings className="w-4 h-4" />
                        <span className="hidden lg:inline">Manage</span>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">
                      Click "Manage" to add/edit units
                    </p>
                  </div>
                </div>

                {/* Inline sub-product creation for this product */}
                {categoryHasSubProducts && group.product && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sub-products</span>
                      <span className="text-xs text-gray-400">Add new to this product</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSubProductNames[group.product] || ''}
                        onChange={(e) => setNewSubProductNames(prev => ({ ...prev, [group.product]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubProductForProduct(group.product))}
                        placeholder="e.g., 5"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSubProductForProduct(group.product)}
                        disabled={loadingAddSubProduct[group.product] || !newSubProductNames[group.product]?.trim()}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        {loadingAddSubProduct[group.product] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* Sub-product rows */}
                {group.product && (
                  <div className="space-y-3">
                    {/* Column headers */}
                    {categoryHasSubProducts ? (
                      <div className="hidden md:grid grid-cols-12 gap-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        <div className="col-span-4">Sub Product</div>
                        <div className="col-span-2">Qty</div>
                        <div className="col-span-2">Weight (Kg)</div>
                        <div className="col-span-3">Notes</div>
                        <div className="col-span-1"></div>
                      </div>
                    ) : (
                      <div className="hidden md:grid grid-cols-8 gap-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        <div className="col-span-2">Qty</div>
                        <div className="col-span-2">Weight (Kg)</div>
                        <div className="col-span-3">Notes</div>
                        <div className="col-span-1"></div>
                      </div>
                    )}
                    {group.items.map((item, rowIndex) => {
                      const globalIndex = group.indices[rowIndex];
                      return categoryHasSubProducts ? (
                        <div key={globalIndex} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start bg-gray-50 rounded-lg p-3 border border-gray-100">
                          <div className="col-span-1 md:col-span-4">
                            <SubProductSelector
                              productId={group.product}
                              subProducts={getSelectedProduct(group.product)?.subProducts}
                              selectedSubProduct={item.subProduct}
                              selectedSubProductName={item.subProductName}
                              quantity={item.quantity}
                              weights={item.subProductWeights}
                              categoryHasSubProducts={categoryHasSubProducts}
                              onSelectSubProduct={(id, name) => handleSubProductSelect(globalIndex, id, name)}
                              onWeightsChange={(weights) => handleSubProductWeightsChange(globalIndex, weights)}
                              onSubProductsUpdated={(updated) => {
                                const prod = getSelectedProduct(group.product);
                                if (prod) prod.subProducts = updated;
                              }}
                              allowAddNew={false}
                              compact
                            />
                          </div>
                          <div className="col-span-1 md:col-span-2">
                            <label className="sr-only">Quantity</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(globalIndex, 'quantity', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                errors[`items.${globalIndex}.quantity`] ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-blue-400'
                              }`}
                              min="1"
                              step="1"
                              placeholder="Qty"
                            />
                            {errors[`items.${globalIndex}.quantity`] && (
                              <p className="text-red-600 text-xs mt-1 flex items-center">
                                <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors[`items.${globalIndex}.quantity`]}
                              </p>
                            )}
                          </div>
                          <div className="col-span-1 md:col-span-2">
                            <label className="sr-only">Weight</label>
                            <input
                              type="number"
                              value={item.weight}
                              onChange={(e) => handleItemChange(globalIndex, 'weight', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                errors[`items.${globalIndex}.weight`] ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-blue-400'
                              } ${item.subProduct ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                              min="0"
                              step="0.01"
                              placeholder="Kg"
                              disabled={!!item.subProduct}
                              readOnly={!!item.subProduct}
                            />
                            {errors[`items.${globalIndex}.weight`] && (
                              <p className="text-red-600 text-xs mt-1 flex items-center">
                                <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors[`items.${globalIndex}.weight`]}
                              </p>
                            )}
                          </div>
                          <div className="col-span-1 md:col-span-3">
                            <label className="sr-only">Notes</label>
                            <textarea
                              value={item.notes}
                              onChange={(e) => handleItemChange(globalIndex, 'notes', e.target.value)}
                              rows="1"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-blue-400 transition-all resize-none"
                              placeholder="Notes"
                            />
                          </div>
                          <div className="col-span-1 md:col-span-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeSubProductRow(globalIndex)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove sub-product row"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* No sub-products: compact row — Qty | Weight | Notes | Remove */
                        <div key={globalIndex} className="grid grid-cols-1 md:grid-cols-8 gap-3 items-start bg-gray-50 rounded-lg p-3 border border-gray-100">
                          <div className="col-span-1 md:col-span-2">
                            <label className="sr-only">Quantity</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(globalIndex, 'quantity', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                errors[`items.${globalIndex}.quantity`] ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-blue-400'
                              }`}
                              min="1"
                              step="1"
                              placeholder="Qty"
                            />
                            {errors[`items.${globalIndex}.quantity`] && (
                              <p className="text-red-600 text-xs mt-1">{errors[`items.${globalIndex}.quantity`]}</p>
                            )}
                          </div>
                          <div className="col-span-1 md:col-span-2">
                            <label className="sr-only">Weight</label>
                            <input
                              type="number"
                              value={item.weight}
                              onChange={(e) => handleItemChange(globalIndex, 'weight', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                errors[`items.${globalIndex}.weight`] ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-blue-400'
                              }`}
                              min="0"
                              step="0.01"
                              placeholder="Kg"
                            />
                            {errors[`items.${globalIndex}.weight`] && (
                              <p className="text-red-600 text-xs mt-1">{errors[`items.${globalIndex}.weight`]}</p>
                            )}
                          </div>
                          <div className="col-span-1 md:col-span-3">
                            <label className="sr-only">Notes</label>
                            <textarea
                              value={item.notes}
                              onChange={(e) => handleItemChange(globalIndex, 'notes', e.target.value)}
                              rows="1"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-blue-400 transition-all resize-none"
                              placeholder="Notes"
                            />
                          </div>
                          <div className="col-span-1 md:col-span-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeSubProductRow(globalIndex)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove row"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {categoryHasSubProducts && (
                      <button
                        type="button"
                        onClick={() => addSubProductRow(group)}
                        className="mt-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Sub Product
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-8 border-t-2 border-gray-200">
        <button
          type="button"
          onClick={onCancel}
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
              {purchaseOrder ? 'Update Purchase Order' : 'Create Purchase Order'}
            </>
          )}
        </button>
      </div>
    </form>

      {/* Quick Add Modals */}
      {showSupplierModal && <QuickAddSupplierModal onClose={() => setShowSupplierModal(false)} onSubmit={handleQuickAddSupplier} loading={modalLoading} />}
      {showCategoryModal && <QuickAddCategoryModal onClose={() => setShowCategoryModal(false)} onSubmit={handleQuickAddCategory} loading={modalLoading} />}
      {showProductModal && <QuickAddProductModal onClose={() => setShowProductModal(false)} onSubmit={handleQuickAddProduct} loading={modalLoading} categoryId={formData.category} />}
      {showUnitModal && (
        <UnitManagement
          onClose={() => setShowUnitModal(false)}
          onUnitAdded={(unit) => {
            fetchUnits(); // Refresh the units list
          }}
        />
      )}
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

// Note: QuickAddUnitModal removed - now using comprehensive UnitManagement component

export default PurchaseOrderForm;
