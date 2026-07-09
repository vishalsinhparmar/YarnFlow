import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ShoppingCart, X, User, Package, Calendar, Plus } from 'lucide-react';
import { salesOrderAPI } from '../../services/salesOrderAPI.js';
import { apiRequest } from '../../services/common.js';
import { inventoryAPI } from '../../services/inventoryAPI.js';
import masterDataAPI, { subProductAPI } from '../../services/masterDataAPI';
import CustomerForm from '../masterdata/Customers/CustomerForm';
import SearchableSelect from '../common/SearchableSelect';
import SubProductSelector from '../common/SubProductSelector';
import { usePaginatedSearch } from '../../hooks/usePaginatedSearch';

const NewSalesOrderModal = ({ isOpen, onClose, onSubmit, order = null }) => {
  const [formData, setFormData] = useState({
    customer: '',
    expectedDeliveryDate: '',
    category: '',
    items: [{
      product: '',
      subProduct: '',
      subProductName: '',
      subProductWeights: [],
      quantity: '',
      unit: '',
      weight: '',
      availableStock: 0,
      notes: ''
    }]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [stockErrors, setStockErrors] = useState({});
  const [weightErrors, setWeightErrors] = useState({});
  // Map of productId -> array of { subProductId, subProductName, totalStock, totalWeight, unit }
  const [subProductOptionsMap, setSubProductOptionsMap] = useState({});

  // Paginated customers
  const {
    items: customers,
    loading: loadingCustomers,
    loadingMore: loadingMoreCustomers,
    hasMore: hasMoreCustomers,
    total: totalCustomers,
    handleSearch: handleCustomerSearch,
    handleLoadMore: loadMoreCustomers,
    setItems: setCustomers
  } = usePaginatedSearch(masterDataAPI.customers.getAll, { limit: 50 });

  // Categories filtered by those that have inventory
  const fetchCategoriesWithInventory = useCallback(async (params) => {
    const [categoriesResponse, inventoryResponse] = await Promise.all([
      masterDataAPI.categories.getAll(params),
      inventoryAPI.getAll({ limit: 1000 })
    ]);
    if (!categoriesResponse.success) {
      return { data: [], pagination: { current: 1, pages: 1, total: 0 } };
    }
    const categoriesWithInventory = new Set();
    if (inventoryResponse.success && inventoryResponse.data) {
      inventoryResponse.data.forEach(cat => {
        if (cat.products && cat.products.length > 0) {
          categoriesWithInventory.add(cat.categoryId);
        }
      });
    }
    const filtered = categoriesResponse.data.filter(c => categoriesWithInventory.has(c._id));
    return {
      ...categoriesResponse,
      data: filtered,
      pagination: categoriesResponse.pagination || { current: 1, pages: 1, total: filtered.length }
    };
  }, []);

  const {
    items: categories,
    loading: loadingCategories,
    loadingMore: loadingMoreCategories,
    hasMore: hasMoreCategories,
    total: totalCategories,
    handleSearch: handleCategorySearch,
    handleLoadMore: loadMoreCategories,
    setItems: setCategories
  } = usePaginatedSearch(fetchCategoriesWithInventory, { limit: 50 });

  // Inventory products with pagination
  const [inventoryProducts, setInventoryProducts] = useState([]);
  const [inventoryProductPage, setInventoryProductPage] = useState(1);
  const [inventoryProductHasMore, setInventoryProductHasMore] = useState(false);
  const [inventoryProductLoading, setInventoryProductLoading] = useState(false);
  const [inventoryProductLoadingMore, setInventoryProductLoadingMore] = useState(false);
  const [inventoryProductTotal, setInventoryProductTotal] = useState(null);
  const [inventoryProductSearch, setInventoryProductSearch] = useState('');
  const [inventoryProductCategory, setInventoryProductCategory] = useState('');
  const inventoryProductSearchTimer = useRef(null);

  const loadInventoryByCategory = async (categoryId, page = 1, search = '', append = false) => {
    const isLoadMore = append && page > 1;
    if (isLoadMore) {
      setInventoryProductLoadingMore(true);
    } else {
      setInventoryProductLoading(true);
    }

    try {
      const response = await inventoryAPI.getAll({
        category: categoryId,
        flat: true,
        limit: 50,
        page,
        ...(search ? { search } : {})
      });

      if (response.success && response.data) {
        const products = response.data.map(product => ({
          value: product.productId,
          productId: product.productId,
          productName: product.productName,
          displayName: product.displayName,
          productCode: product.productCode,
          unit: product.unit,
          totalStock: product.currentStock || product.totalStock || 0,
          totalWeight: product.currentWeight || product.totalWeight || 0,
          hasSubProducts: product.hasSubProducts || false,
          subProduct: null,
          subProductName: null,
          isSubProduct: false
        }));

        setInventoryProductPage(page);
        setInventoryProductSearch(search);
        setInventoryProductCategory(categoryId);
        setInventoryProductTotal(response.pagination?.total ?? null);
        setInventoryProductHasMore(
          response.pagination?.current < response.pagination?.pages
        );

        if (append) {
          setInventoryProducts(prev => {
            const existingIds = new Set(prev.map(p => p.productId));
            const newProducts = products.filter(p => !existingIds.has(p.productId));
            return [...prev, ...newProducts];
          });
        } else {
          setInventoryProducts(products);
        }

        // For products that have sub-products, load sub-product detail for this page
        const subProductMap = { ...subProductOptionsMap };
        await Promise.all(
          products
            .filter(p => p.hasSubProducts)
            .map(async (p) => {
              try {
                const detail = await inventoryAPI.getProductDetail(p.productId);
                if (detail.success && detail.data && detail.data.subProductBreakdown) {
                  subProductMap[p.productId] = detail.data.subProductBreakdown
                    .filter(sp => sp.subProductId)
                    .map(sp => ({
                      subProductId: sp.subProductId,
                      subProductName: sp.subProductName,
                      totalStock: sp.currentStock || 0,
                      totalWeight: sp.currentWeight || 0,
                      unit: p.unit
                    }));
                }
              } catch (err) {
                console.error('Error loading sub-product detail for', p.productId, err);
              }
            })
        );
        setSubProductOptionsMap(subProductMap);

        // Sync stock/weight data for existing items when editing an order
        if (!append) {
          setFormData(prev => {
            const updatedItems = prev.items.map(item => {
              if (item.subProduct && subProductMap[item.product]) {
                const sp = subProductMap[item.product].find(s => s.subProductId === item.subProduct);
                if (sp) {
                  return { ...item, availableStock: sp.totalStock, totalProductWeight: sp.totalWeight, productStock: sp.totalStock };
                }
              } else if (item.product) {
                const inv = products.find(p => p.productId === item.product);
                if (inv && !inv.hasSubProducts) {
                  return { ...item, availableStock: inv.totalStock, totalProductWeight: inv.totalWeight, productStock: inv.totalStock };
                }
              }
              return item;
            });
            return { ...prev, items: updatedItems };
          });
        }
      } else {
        if (!append) {
          setInventoryProducts([]);
          setSubProductOptionsMap({});
        }
        setInventoryProductHasMore(false);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      if (!append) {
        setInventoryProducts([]);
        setSubProductOptionsMap({});
      }
      setInventoryProductHasMore(false);
    } finally {
      if (isLoadMore) {
        setInventoryProductLoadingMore(false);
      } else {
        setInventoryProductLoading(false);
      }
    }
  };

  const handleInventoryProductSearch = (search) => {
    setInventoryProductSearch(search);
    if (inventoryProductSearchTimer.current) clearTimeout(inventoryProductSearchTimer.current);
    inventoryProductSearchTimer.current = setTimeout(() => {
      if (formData.category) {
        loadInventoryByCategory(formData.category, 1, search, false);
      }
    }, 300);
  };

  const handleInventoryProductLoadMore = () => {
    if (inventoryProductLoading || inventoryProductLoadingMore || !inventoryProductHasMore) return;
    loadInventoryByCategory(formData.category, inventoryProductPage + 1, inventoryProductSearch, true);
  };

  // Reset form / load inventory when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset form data when opening modal
      if (!order) {
        setFormData({
          customer: '',
          expectedDeliveryDate: '',
          category: '',
          items: [{
            product: '',
            subProduct: '',
            subProductName: '',
            subProductWeights: [],
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
            subProduct: item.subProduct?._id || item.subProduct || '',
            subProductName: item.subProductName || '',
            subProductWeights: Array.isArray(item.subProductWeights) ? item.subProductWeights : [],
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
  }, [isOpen, order]);

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
        subProduct: '',
        subProductName: '',
        subProductWeights: [],
        quantity: '',
        unit: '',
        weight: '',
        availableStock: 0
      }]
    }));
    
    if (value) {
      loadInventoryByCategory(value, 1, '', false);
    } else {
      setInventoryProducts([]);
      setSubProductOptionsMap({});
      setInventoryProductPage(1);
      setInventoryProductHasMore(false);
      setInventoryProductSearch('');
      setInventoryProductCategory('');
    }
  };

  const setItemWeightError = (index, item) => {
    const availableWeight = item.totalProductWeight || 0;
    const weight = parseFloat(item.weight) || 0;
    if (availableWeight > 0 && weight > availableWeight) {
      setWeightErrors(prev => ({ ...prev, [index]: `Weight exceeds available ${availableWeight.toFixed(2)} kg` }));
    } else {
      setWeightErrors(prev => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    const item = { ...updatedItems[index] };
    item[field] = value;

    // Auto-calculate suggested weight when quantity changes and enforce stock ceiling
    if (field === 'quantity') {
      const requestedQty = parseFloat(value) || 0;
      const available = item.availableStock || 0;
      let qty = requestedQty;

      if (available > 0 && requestedQty > available) {
        qty = available;
        setStockErrors(prev => ({ ...prev, [index]: `Only ${available} ${item.unit || 'units'} available in stock` }));
      } else {
        setStockErrors(prev => {
          const next = { ...prev };
          delete next[index];
          return next;
        });
      }

      const totalWeight = item.totalProductWeight || 0;
      const totalStock = item.productStock || 1;
      const weightPerUnit = totalStock > 0 ? parseFloat((totalWeight / totalStock).toFixed(4)) : 0;

      if (item.subProduct) {
        // For sub-products, build/update per-unit weight array using the inventory weight per unit
        const perUnit = weightPerUnit > 0 ? weightPerUnit : 0;
        item.subProductWeights = Array.from({ length: Math.max(0, qty) }, () => perUnit);
        item.weight = parseFloat((qty * perUnit).toFixed(2));
      } else if (weightPerUnit > 0 && qty > 0) {
        item.weight = parseFloat((qty * weightPerUnit).toFixed(2));
      }
      item.quantity = qty;
      setItemWeightError(index, item);
    }

    // When total weight is manually edited, validate against available weight and spread evenly for sub-products
    if (field === 'weight') {
      const total = parseFloat(value) || 0;
      item.weight = total;
      if (item.subProduct) {
        const qty = Math.max(1, parseFloat(item.quantity) || 1);
        item.subProductWeights = Array.from({ length: Math.floor(qty) }, () => total / qty);
      }
      setItemWeightError(index, item);
    }

    updatedItems[index] = item;
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const handleSubProductWeightsChange = (index, weights) => {
    const updatedItems = [...formData.items];
    const updatedItem = {
      ...updatedItems[index],
      subProductWeights: weights,
      weight: weights.reduce((sum, w) => sum + (Number(w) || 0), 0)
    };
    updatedItems[index] = updatedItem;
    setFormData(prev => ({ ...prev, items: updatedItems }));
    setItemWeightError(index, updatedItem);
  };

  // Unique product options from inventory (flattened inventory rows may repeat products per sub-product)
  const getProductOptions = () => {
    const seen = new Map();
    inventoryProducts.forEach(inv => {
      if (!seen.has(inv.productId)) {
        seen.set(inv.productId, {
          _id: inv.productId,
          productId: inv.productId,
          productName: inv.productName,
          productCode: inv.productCode,
          unit: inv.unit,
          value: inv.productId
        });
      }
    });
    return Array.from(seen.values());
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
          productName: '',
          productCode: '',
          subProduct: '',
          subProductName: '',
          subProductWeights: [],
          quantity: '',
          unit: '',
          weight: '',
          availableStock: 0,
          notes: ''
        }
      ]
    }));
  };

  const removeProductGroup = (group) => {
    const remaining = formData.items.filter((_, i) => !group.indices.includes(i));
    if (remaining.length === 0) {
      remaining.push({
        product: '',
        productName: '',
        productCode: '',
        subProduct: '',
        subProductName: '',
        subProductWeights: [],
        quantity: '',
        unit: '',
        weight: '',
        availableStock: 0,
        notes: ''
      });
    }
    setFormData(prev => ({ ...prev, items: remaining }));
    setStockErrors(prev => {
      const next = { ...prev };
      group.indices.forEach(i => delete next[i]);
      return next;
    });
    setWeightErrors(prev => {
      const next = { ...prev };
      group.indices.forEach(i => delete next[i]);
      return next;
    });
  };

  const addSubProductRow = (group) => {
    const newItem = {
      product: group.product,
      productName: group.productName,
      productCode: group.productCode,
      subProduct: '',
      subProductName: '',
      subProductWeights: [],
      quantity: '',
      unit: group.unit,
      weight: '',
      availableStock: 0,
      notes: ''
    };
    const insertAt = group.indices[group.indices.length - 1] + 1;
    const updated = [...formData.items];
    updated.splice(insertAt, 0, newItem);
    setFormData(prev => ({ ...prev, items: updated }));
  };

  const removeSubProductRow = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
      setStockErrors(prev => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  };

  const updateGroupProduct = (group, productId) => {
    const selected = getProductOptions().find(p => p.productId === productId) || null;
    const hasSubProductOptions = getSubProductOptions(productId).length > 0;
    // For non-sub-product products, stock and weight are derived from the product-level inventory row
    const productLevelInv = hasSubProductOptions
      ? null
      : inventoryProducts.find(inv => inv.productId === productId) || null;
    const updatedItems = [...formData.items];
    group.indices.forEach(i => {
      const existing = updatedItems[i];
      updatedItems[i] = {
        ...existing,
        product: productId || '',
        productName: selected?.productName || existing.productName || '',
        productCode: selected?.productCode || existing.productCode || '',
        subProduct: '',
        subProductName: '',
        subProductWeights: [],
        quantity: existing.quantity || '',
        unit: selected?.unit || existing.unit || '',
        weight: existing.subProduct || hasSubProductOptions ? '' : existing.weight || '',
        availableStock: productLevelInv ? productLevelInv.totalStock : 0,
        totalProductWeight: productLevelInv ? productLevelInv.totalWeight : 0,
        productStock: productLevelInv ? productLevelInv.totalStock : 0,
        notes: existing.notes || ''
      };
    });
    setFormData(prev => ({ ...prev, items: updatedItems }));
    setStockErrors(prev => {
      const next = { ...prev };
      group.indices.forEach(i => delete next[i]);
      return next;
    });
    setWeightErrors(prev => {
      const next = { ...prev };
      group.indices.forEach(i => delete next[i]);
      return next;
    });
  };

  const getSubProductOptions = (productId) => {
    return subProductOptionsMap[productId] || [];
  };

  const handleSubProductSelect = (index, subProductId) => {
    const productId = formData.items[index].product;
    const spOptions = subProductOptionsMap[productId] || [];
    const selected = spOptions.find(sp => sp.subProductId === subProductId) || null;
    const updatedItems = [...formData.items];
    const item = { ...updatedItems[index] };
    item.subProduct = subProductId || '';
    item.subProductName = selected?.subProductName || '';
    item.availableStock = selected?.totalStock || 0;
    item.totalProductWeight = selected?.totalWeight || 0;
    item.productStock = selected?.totalStock || 0;
    item.unit = selected?.unit || item.unit || '';
    item.weight = item.quantity ? calculateWeight(item.quantity, item.totalProductWeight, item.productStock) : '';
    item.subProductWeights = [];
    updatedItems[index] = item;
    setFormData(prev => ({ ...prev, items: updatedItems }));
    setStockErrors(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setWeightErrors(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const calculateWeight = (quantity, totalWeight, totalStock) => {
    const qty = parseFloat(quantity) || 0;
    const weightPerUnit = totalStock > 0 ? parseFloat((totalWeight / totalStock).toFixed(4)) : 0;
    return weightPerUnit > 0 && qty > 0 ? parseFloat((qty * weightPerUnit).toFixed(2)) : '';
  };

  const handleCustomerSaved = async (customerData) => {
    try {
      // Create customer via API
      const response = await apiRequest('/master-data/customers', {
        method: 'POST',
        body: JSON.stringify(customerData)
      });
      
      setShowCustomerModal(false);

      if (response && response._id) {
        // Optimistically add the new customer and select it
        setCustomers(prev => [response, ...prev]);
        setFormData(prev => ({
          ...prev,
          customer: response._id
        }));
      }
      
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
        const hasSubProductOptions = getSubProductOptions(item.product).length > 0;
        if (hasSubProductOptions && !item.subProduct) {
          setError(`Please select a sub-product for item ${i + 1}`);
          setLoading(false);
          return;
        }
        if (!item.quantity || parseFloat(item.quantity) <= 0) {
          setError(`Please enter a valid quantity for item ${i + 1}`);
          setLoading(false);
          return;
        }
        const available = item.availableStock || 0;
        const qty = parseFloat(item.quantity) || 0;
        if (available > 0 && qty > available) {
          setError(`Item ${i + 1}: requested ${qty} ${item.unit} but only ${available} ${item.unit} available`);
          setLoading(false);
          return;
        }
        if (!item.unit) {
          setError(`Unit is missing for item ${i + 1}`);
          setLoading(false);
          return;
        }
      }

      // Group items by product+sub-product to validate total quantity and weight like the backend
      const grouped = new Map();
      formData.items.forEach((item, i) => {
        const key = `${item.product}-${item.subProduct || '__none__'}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            productName: item.productName || item.product,
            subProductName: item.subProductName,
            unit: item.unit,
            availableStock: item.availableStock || 0,
            availableWeight: item.totalProductWeight || 0,
            totalQty: 0,
            totalWeight: 0,
            indices: []
          });
        }
        const g = grouped.get(key);
        g.totalQty += parseFloat(item.quantity) || 0;
        g.totalWeight += parseFloat(item.weight) || 0;
        g.indices.push(i + 1);
      });

      for (const g of grouped.values()) {
        if (g.availableStock > 0 && g.totalQty > g.availableStock) {
          setError(`Items ${g.indices.join(', ')}: total ${g.totalQty} ${g.unit} exceeds available ${g.availableStock} ${g.unit}`);
          setLoading(false);
          return;
        }
        if (g.availableWeight > 0 && g.totalWeight > g.availableWeight) {
          setError(`Items ${g.indices.join(', ')}: total weight ${g.totalWeight.toFixed(2)} kg exceeds available ${g.availableWeight.toFixed(2)} kg`);
          setLoading(false);
          return;
        }
      }

      // Prepare data for API
      const orderData = {
        customer: formData.customer,
        category: formData.category,
        items: formData.items.map(item => {
          const selectedProduct = inventoryProducts.find(p => p.productId === item.product && p.subProduct === item.subProduct);
          return {
            product: item.product,
            productName: item.productName || selectedProduct?.productName || item.subProductName || 'Unknown Product',
            productCode: item.productCode || selectedProduct?.productCode || 'UNKNOWN',
            subProduct: item.subProduct || null,
            subProductName: item.subProductName || null,
            subProductWeights: Array.isArray(item.subProductWeights) ? item.subProductWeights : [],
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
                onSearch={handleCustomerSearch}
                loading={loadingCustomers}
                loadingMore={loadingMoreCustomers}
                hasMore={hasMoreCustomers}
                onLoadMore={loadMoreCustomers}
                total={totalCustomers}
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
              onSearch={handleCategorySearch}
              loading={loadingCategories}
              loadingMore={loadingMoreCategories}
              hasMore={hasMoreCategories}
              onLoadMore={loadMoreCategories}
              total={totalCategories}
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
                onClick={addProductGroup}
                disabled={!formData.category}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                    <SearchableSelect
                      label="Product"
                      required
                      options={getProductOptions()}
                      value={group.product}
                      onChange={(value) => updateGroupProduct(group, value)}
                      placeholder={formData.category ? 'Select Product' : 'Select Category First'}
                      searchPlaceholder="Search products..."
                      getOptionLabel={(product) => product.productName}
                      getOptionValue={(product) => product.value}
                      onSearch={handleInventoryProductSearch}
                      loading={inventoryProductLoading}
                      loadingMore={inventoryProductLoadingMore}
                      hasMore={inventoryProductHasMore}
                      onLoadMore={handleInventoryProductLoadMore}
                      total={inventoryProductTotal}
                      disabled={!formData.category}
                      emptyMessage={!formData.category ? 'Please select a category first' : 'No products in inventory'}
                      renderOption={(product, isSelected) => (
                        <div className="flex flex-col">
                          <span className="font-medium">{product.productName}</span>
                          <span className="text-xs text-gray-500">{product.productCode}</span>
                        </div>
                      )}
                    />
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                        </svg>
                        Unit
                      </label>
                      <input
                        type="text"
                        value={group.unit}
                        readOnly
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm bg-gray-50 text-gray-600 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {group.product && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-12 gap-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        <div className="col-span-3">Sub Product</div>
                        <div className="col-span-2">Qty</div>
                        <div className="col-span-2">Unit</div>
                        <div className="col-span-3">Weight (Kg)</div>
                        <div className="col-span-2"></div>
                      </div>
                      {group.items.map((item, rowIndex) => {
                        const globalIndex = group.indices[rowIndex];
                        const hasSubProductOptions = getSubProductOptions(group.product).length > 0;
                        return (
                          <div key={globalIndex} className="grid grid-cols-12 gap-3 items-start bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <div className="col-span-3">
                              {hasSubProductOptions ? (
                                <SearchableSelect
                                  options={getSubProductOptions(group.product)}
                                  value={item.subProduct || ''}
                                  onChange={(value) => handleSubProductSelect(globalIndex, value)}
                                  placeholder="Select Sub Product"
                                  searchPlaceholder="Search sub-products..."
                                  getOptionLabel={(sp) => `${sp.subProductName} (Stock: ${sp.totalStock})`}
                                  getOptionValue={(sp) => sp.subProductId}
                                  renderOption={(sp, isSelected) => (
                                    <div className="flex flex-col">
                                      <span className="font-medium">{sp.subProductName}</span>
                                      <span className="text-xs text-gray-500">
                                        Available: {sp.totalStock} {sp.unit} · Weight: {sp.totalWeight?.toFixed(2) || 0} kg
                                      </span>
                                    </div>
                                  )}
                                />
                              ) : (
                                <span className="text-xs text-gray-400 flex items-center h-full">-</span>
                              )}
                            </div>
                            <div className="col-span-2">
                              <label className="sr-only">Quantity</label>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(globalIndex, 'quantity', e.target.value)}
                                required
                                min="0.01"
                                max={item.availableStock || undefined}
                                step="0.01"
                                placeholder="Qty"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:border-blue-400 text-sm"
                              />
                            </div>
                            <div className="col-span-2">
                              <input
                                type="text"
                                value={item.unit}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-50 text-gray-600 text-sm cursor-not-allowed"
                              />
                            </div>
                            <div className="col-span-3">
                              <label className="sr-only">Weight</label>
                              <input
                                type="number"
                                value={item.weight}
                                onChange={(e) => handleItemChange(globalIndex, 'weight', e.target.value)}
                                required
                                min="0"
                                step="0.01"
                                placeholder={item.subProduct ? 'Auto' : 'Kg'}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:border-blue-400 text-sm ${item.subProduct ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                disabled={!!item.subProduct}
                                readOnly={!!item.subProduct}
                              />
                            </div>
                            <div className="col-span-2 flex justify-end">
                              <button
                                type="button"
                                onClick={() => removeSubProductRow(globalIndex)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove row"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="col-span-12">
                              {item.availableStock > 0 && (
                                <p className="text-xs text-green-600 flex items-center">
                                  <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  Available: {item.availableStock} {item.unit}
                                </p>
                              )}
                              {stockErrors[globalIndex] && (
                                <p className="text-xs text-red-600 flex items-center">
                                  <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  {stockErrors[globalIndex]}
                                </p>
                              )}
                              {weightErrors[globalIndex] && (
                                <p className="text-xs text-red-600 flex items-center">
                                  <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  {weightErrors[globalIndex]}
                                </p>
                              )}
                              {item.totalProductWeight > 0 && item.productStock > 0 && (
                                <p className="text-xs text-blue-600 mt-1 flex items-center">
                                  <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                  Suggested: {calculateWeight(item.quantity, item.totalProductWeight, item.productStock)} Kg
                                </p>
                              )}
                              {item.subProduct && item.quantity > 0 && (
                                <div className="mt-2">
                                  <SubProductSelector
                                    productId={item.product}
                                    selectedSubProduct={item.subProduct}
                                    selectedSubProductName={item.subProductName}
                                    quantity={item.quantity}
                                    weights={item.subProductWeights}
                                    categoryHasSubProducts={true}
                                    onSelectSubProduct={() => {}}
                                    onWeightsChange={(weights) => handleSubProductWeightsChange(globalIndex, weights)}
                                    disableSelection={true}
                                    allowAddNew={false}
                                    compact
                                  />
                                </div>
                              )}
                            </div>
                            <div className="col-span-12">
                              <textarea
                                value={item.notes || ''}
                                onChange={(e) => handleItemChange(globalIndex, 'notes', e.target.value)}
                                placeholder="Notes"
                                rows="1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:border-blue-400 transition-all resize-none text-sm"
                              />
                            </div>
                          </div>
                        );
                      })}
                      {getSubProductOptions(group.product).length > 0 && (
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
