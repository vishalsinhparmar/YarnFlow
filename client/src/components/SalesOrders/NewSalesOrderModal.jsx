import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ShoppingCart, X, User, Package, Calendar, Plus } from 'lucide-react';
import { salesOrderAPI } from '../../services/salesOrderAPI.js';
import { apiRequest } from '../../services/common.js';
import { inventoryAPI } from '../../services/inventoryAPI.js';
import masterDataAPI from '../../services/masterDataAPI';
import CustomerForm from '../masterdata/Customers/CustomerForm';
import SearchableSelect from '../common/SearchableSelect';
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
                    .map(sp => {
                      // Flatten REAL individual per-unit weights from active lots, oldest first (FIFO) —
                      // this must mirror the exact order the backend consumes them in at challan time.
                      const activeLots = (sp.lots || [])
                        .filter(l => l.status === 'Active' && (l.currentQuantity || 0) > 0)
                        .sort((a, b) => new Date(a.receivedDate) - new Date(b.receivedDate));
                      const availableWeights = activeLots.flatMap(l =>
                        Array.isArray(l.subProductWeights) ? l.subProductWeights.map(w => Number(w) || 0) : []
                      );
                      return {
                        subProductId: sp.subProductId,
                        subProductName: sp.subProductName,
                        totalStock: sp.currentStock || 0,
                        totalWeight: sp.currentWeight || 0,
                        unit: p.unit,
                        availableWeights
                      };
                    });
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
                  const availableWeights = sp.availableWeights || [];
                  // Rebuild selectedWeightIndices from the saved subProductWeights so bag chips
                  // render pre-selected in edit mode. Match each saved weight to the first
                  // un-matched index in availableWeights (FIFO order mirrors backend consumption).
                  const savedWeights = Array.isArray(item.subProductWeights) ? [...item.subProductWeights] : [];
                  const usedIndices = new Set();
                  const selectedWeightIndices = [];
                  savedWeights.forEach(sw => {
                    const idx = availableWeights.findIndex((w, i) => !usedIndices.has(i) && Number(w) === Number(sw));
                    if (idx !== -1) {
                      usedIndices.add(idx);
                      selectedWeightIndices.push(idx);
                    }
                  });
                  selectedWeightIndices.sort((a, b) => a - b);
                  return {
                    ...item,
                    availableStock: sp.totalStock,
                    totalProductWeight: sp.totalWeight,
                    productStock: sp.totalStock,
                    availableWeights,
                    selectedWeightIndices,
                  };
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
      // If sub-product is selected, qty is locked to available weights count — ignore manual changes
      if (item.subProduct) {
        updatedItems[index] = item;
        setFormData(prev => ({ ...prev, items: updatedItems }));
        return;
      }

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
      if (weightPerUnit > 0 && qty > 0) {
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
    // Guard: don't add a new row if all sub-products are already selected in this group
    const spOptions = getSubProductOptions(group.product).filter(sp => (sp.totalStock || 0) > 0);
    const usedSubProductIds = new Set(
      group.items.map(item => item.subProduct).filter(Boolean)
    );
    const hasUnused = spOptions.some(sp => !usedSubProductIds.has(sp.subProductId));
    if (!hasUnused) return; // All sub-products already added

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

    // Guard: for non-sub-product products, block if this product is already in another group
    if (!hasSubProductOptions && productId) {
      const alreadyUsed = formData.items.some((item, i) =>
        !group.indices.includes(i) && item.product === productId && !item.subProduct
      );
      if (alreadyUsed) {
        setError(`"${selected?.productName || productId}" is already added. You can only have one row per non-variant product.`);
        setTimeout(() => setError(''), 3000);
        return;
      }
    }

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
    const currentSubProduct = formData.items[index].subProduct;
    const updatedItems = [...formData.items];
    const item = { ...updatedItems[index] };

    // Toggle off: if the same sub-product is selected again, clear the selection
    if (subProductId && subProductId === currentSubProduct) {
      item.subProduct = '';
      item.subProductName = '';
      item.availableWeights = [];
      item.selectedWeightIndices = [];
      item.subProductWeights = [];
      item.quantity = '';
      item.weight = '';
      updatedItems[index] = item;
      setFormData(prev => ({ ...prev, items: updatedItems }));
      setStockErrors(prev => { const next = { ...prev }; delete next[index]; return next; });
      setWeightErrors(prev => { const next = { ...prev }; delete next[index]; return next; });
      return;
    }

    // Duplicate check: block if another row for the same product already uses this sub-product
    const isDuplicate = subProductId && formData.items.some((other, i) =>
      i !== index &&
      other.product === productId &&
      other.subProduct === subProductId
    );
    if (isDuplicate) {
      const spOptions = subProductOptionsMap[productId] || [];
      const sp = spOptions.find(s => s.subProductId === subProductId);
      setError(`Sub-product "${sp?.subProductName || subProductId}" is already selected in another row for this product.`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    const spOptions = subProductOptionsMap[productId] || [];
    const selected = spOptions.find(sp => sp.subProductId === subProductId) || null;
    item.subProduct = subProductId || '';
    item.subProductName = selected?.subProductName || '';
    item.availableStock = selected?.totalStock || 0;
    item.totalProductWeight = selected?.totalWeight || 0;
    item.productStock = selected?.totalStock || 0;
    item.unit = selected?.unit || item.unit || '';
    item.availableWeights = Array.isArray(selected?.availableWeights) ? selected.availableWeights : [];
    // All chips pre-selected by default; user can toggle individual ones.
    item.selectedWeightIndices = item.availableWeights.map((_, i) => i);
    item.subProductWeights = [...item.availableWeights];
    item.quantity = item.availableWeights.length;
    item.weight = item.subProductWeights.length > 0
      ? parseFloat(item.subProductWeights.reduce((s, w) => s + (Number(w) || 0), 0).toFixed(2))
      : 0;
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
    <div className="fixed top-16 left-64 right-0 bottom-0 z-40 flex flex-col bg-white shadow-2xl overflow-hidden">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="relative mx-auto mb-4 w-16 h-16">
                <div className="w-16 h-16 rounded-full border-4 border-blue-100"></div>
                <div className="w-16 h-16 rounded-full border-4 border-blue-600 border-t-transparent animate-spin absolute inset-0"></div>
              </div>
              <p className="text-lg font-semibold text-gray-700">
                {order ? 'Updating' : 'Creating'} Sales Order...
              </p>
              <p className="text-sm text-gray-500 mt-2">Please wait</p>
            </div>
          </div>
        )}

        {/* Header — sticky so it stays visible while scrolling */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">
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

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
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
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center mb-3 gap-2">
              <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Customer Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <svg className="h-3 w-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-blue-400 transition-all"
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
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Order Items</h3>
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

            <div className="space-y-3">
              {getProductGroups().map((group, groupIndex) => (
                <div key={groupIndex} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 text-blue-700 font-bold rounded-full h-8 w-8 flex items-center justify-center text-sm">
                        {groupIndex + 1}
                      </div>
                      <h4 className="font-semibold text-gray-800 text-sm">Product Section</h4>
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
                      {/* Column headers — only show Sub Product col if product has sub-products */}
                      <div className="grid grid-cols-12 gap-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {getSubProductOptions(group.product).filter(sp => (sp.totalStock || 0) > 0).length > 0 && (
                          <div className="col-span-3">Sub Product</div>
                        )}
                        <div className={getSubProductOptions(group.product).filter(sp => (sp.totalStock || 0) > 0).length > 0 ? 'col-span-2' : 'col-span-3'}>Qty</div>
                        <div className="col-span-2">Unit</div>
                        <div className={getSubProductOptions(group.product).filter(sp => (sp.totalStock || 0) > 0).length > 0 ? 'col-span-3' : 'col-span-5'}>Weight (Kg)</div>
                        <div className="col-span-2"></div>
                      </div>
                      {group.items.map((item, rowIndex) => {
                        const globalIndex = group.indices[rowIndex];
                        const hasSubProductOptions = getSubProductOptions(group.product).filter(sp => (sp.totalStock || 0) > 0).length > 0;
                        return (
                          <div key={globalIndex} className="grid grid-cols-12 gap-3 items-start bg-gray-50 rounded-lg p-3 border border-gray-100">
                            {/* Sub-product select — only rendered when product has sub-products */}
                            {hasSubProductOptions && (
                              <div className="col-span-3">
                                <SearchableSelect
                                  options={getSubProductOptions(group.product).filter(sp => (sp.totalStock || 0) > 0)}
                                  value={item.subProduct || ''}
                                  onChange={(value) => handleSubProductSelect(globalIndex, value)}
                                  placeholder="Select Sub Pr..."
                                  searchPlaceholder="Search sub-products..."
                                  getOptionLabel={(sp) => `${sp.subProductName} (Stock: ${sp.totalStock})`}
                                  getOptionValue={(sp) => sp.subProductId}
                                  renderOption={(sp, isSelected) => (
                                    <div className="flex flex-col gap-1">
                                      <span className="font-semibold text-gray-900">{sp.subProductName}</span>
                                      <span className="text-xs text-gray-500">
                                        Available: {sp.totalStock} {sp.unit} · Weight: {(sp.totalWeight || 0).toFixed(2)} kg
                                      </span>
                                      {Array.isArray(sp.availableWeights) && sp.availableWeights.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-0.5">
                                          {sp.availableWeights.slice(0, 6).map((w, wi) => (
                                            <span key={wi} className="px-1.5 py-0.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded">
                                              {Number(w).toFixed(2)} kg
                                            </span>
                                          ))}
                                          {sp.availableWeights.length > 6 && (
                                            <span className="text-xs text-gray-400">+{sp.availableWeights.length - 6} more</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                />
                              </div>
                            )}
                            {/* Qty — read-only when sub-product selected (auto-set from inventory weights count) */}
                            <div className={hasSubProductOptions ? 'col-span-2' : 'col-span-3'}>
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
                                readOnly={!!item.subProduct}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm ${item.subProduct ? 'bg-gray-100 cursor-not-allowed focus:ring-0' : 'focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:border-blue-400'}`}
                              />
                              {item.subProduct && (
                                <span className="text-xs text-blue-500 mt-0.5 block">Auto from inventory</span>
                              )}
                            </div>
                            {/* Unit */}
                            <div className="col-span-2">
                              <input
                                type="text"
                                value={item.unit}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-50 text-gray-600 text-sm cursor-not-allowed"
                              />
                            </div>
                            {/* Weight */}
                            <div className={hasSubProductOptions ? 'col-span-3' : 'col-span-5'}>
                              <label className="sr-only">Weight</label>
                              <input
                                type="number"
                                value={item.weight}
                                onChange={(e) => handleItemChange(globalIndex, 'weight', e.target.value)}
                                required
                                min="0"
                                step="0.01"
                                placeholder={item.subProduct ? 'Auto' : 'Kg'}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${item.subProduct ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-blue-400'}`}
                                disabled={!!item.subProduct}
                                readOnly={!!item.subProduct}
                              />
                            </div>
                            {/* Remove row */}
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

                            {/* Stock / weight info row */}
                            <div className="col-span-12 flex flex-wrap gap-x-4 gap-y-1">
                              {item.availableStock > 0 && (
                                <p className="text-xs text-green-600 flex items-center">
                                  ✓ Available: {item.availableStock} {item.unit}
                                </p>
                              )}
                              {stockErrors[globalIndex] && (
                                <p className="text-xs text-red-600">⚠ {stockErrors[globalIndex]}</p>
                              )}
                              {weightErrors[globalIndex] && (
                                <p className="text-xs text-red-600">⚠ {weightErrors[globalIndex]}</p>
                              )}
                              {!item.subProduct && item.totalProductWeight > 0 && item.productStock > 0 && (
                                <p className="text-xs text-blue-600">
                                  ⓘ Suggested: {calculateWeight(item.quantity, item.totalProductWeight, item.productStock)} Kg
                                </p>
                              )}
                            </div>

                            {/* Selectable weight chips for sub-product — click to include/exclude bags */}
                            {item.subProduct && Array.isArray(item.availableWeights) && item.availableWeights.length > 0 && (
                              <div className="col-span-12">
                                <p className="text-xs text-gray-500 mb-1.5 font-medium">
                                  Select bags to include ({(item.selectedWeightIndices || []).length} of {item.availableWeights.length} selected):
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {item.availableWeights.map((w, wi) => {
                                    const isSelected = (item.selectedWeightIndices || []).includes(wi);
                                    return (
                                      <button
                                        key={wi}
                                        type="button"
                                        onClick={() => {
                                          const updatedItems = [...formData.items];
                                          const it = { ...updatedItems[globalIndex] };
                                          const current = it.selectedWeightIndices || [];
                                          const next = isSelected
                                            ? current.filter(i => i !== wi)
                                            : [...current, wi].sort((a, b) => a - b);
                                          it.selectedWeightIndices = next;
                                          it.subProductWeights = next.map(i => it.availableWeights[i]);
                                          it.quantity = next.length;
                                          it.weight = parseFloat(it.subProductWeights.reduce((s, v) => s + (Number(v) || 0), 0).toFixed(2));
                                          updatedItems[globalIndex] = it;
                                          setFormData(prev => ({ ...prev, items: updatedItems }));
                                        }}
                                        className={`px-2 py-1 text-xs font-semibold rounded border transition-all ${
                                          isSelected
                                            ? 'bg-green-600 text-white border-green-600 shadow-sm'
                                            : 'bg-white text-gray-400 border-gray-300 line-through'
                                        }`}
                                        title={isSelected ? 'Click to exclude' : 'Click to include'}
                                      >
                                        #{wi + 1}: {Number(w) % 1 === 0 ? Number(w) : Number(w).toFixed(2)} kg
                                      </button>
                                    );
                                  })}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Click a chip to include/exclude that bag from the order.</p>
                              </div>
                            )}

                            {/* Notes */}
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
                      {(() => {
                        const spOptions = getSubProductOptions(group.product).filter(sp => (sp.totalStock || 0) > 0);
                        const usedIds = new Set(group.items.map(i => i.subProduct).filter(Boolean));
                        const canAdd = spOptions.length > 0 && spOptions.some(sp => !usedIds.has(sp.subProductId));
                        return canAdd ? (
                          <button
                            type="button"
                            onClick={() => addSubProductRow(group)}
                            className="mt-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add Sub Product
                          </button>
                        ) : spOptions.length > 0 ? (
                          <p className="mt-2 text-xs text-gray-400 italic">All sub-products for this product have been added.</p>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>



          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
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
