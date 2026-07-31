import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Minus, Loader2, Warehouse, StickyNote, Package, MapPin, FileText, Calendar, ChevronDown, X, CheckCircle2 } from 'lucide-react';
import { purchaseOrderAPI } from '../../services/purchaseOrderAPI';
import PurchaseOrderForm from '../PurchaseOrders/PurchaseOrderForm';
import SearchableSelect from '../common/SearchableSelect';
import SubProductSelector from '../common/SubProductSelector';
import { usePaginatedSearch } from '../../hooks/usePaginatedSearch';
import warehouseAPI from '../../services/warehouseAPI';

const GRNForm = ({ grn, onSubmit, onCancel, preSelectedPO }) => {
  const [selectedPO, setSelectedPO] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPOModal, setShowPOModal] = useState(false);
  const [warehouseLocations, setWarehouseLocations] = useState([]);

  useEffect(() => {
    warehouseAPI.getAll().then(res => setWarehouseLocations(res.data || [])).catch(() => {});
  }, []);

  const [formData, setFormData] = useState({
    purchaseOrder: '',
    receiptDate: new Date().toISOString().split('T')[0],
    warehouseLocation: '',
    storageInstructions: '',
    generalNotes: '',
    items: []
  });

  // Paginated purchase orders with client-side status filter
  const fetchPurchaseOrders = useCallback(async (params) => {
    const response = await purchaseOrderAPI.getAll(params);
    if (response && response.data) {
      const incompletePOs = response.data.filter(po =>
        po.status !== 'Fully_Received' && po.status !== 'Complete'
      );
      return { ...response, data: incompletePOs };
    }
    return response;
  }, []);

  const {
    items: purchaseOrders,
    loading: loadingPOs,
    loadingMore: loadingMorePOs,
    hasMore: hasMorePOs,
    total: totalPOs,
    handleSearch: handlePOSearch,
    handleLoadMore: loadMorePOs,
    setItems: setPurchaseOrders,
    refresh: refreshPOs
  } = usePaginatedSearch(fetchPurchaseOrders, { limit: 50, extraParams: { sortBy: 'createdAt', sortOrder: 'desc' } });

  // Show error when POs are empty after loading
  useEffect(() => {
    if (!loadingPOs && purchaseOrders.length === 0 && !formData.purchaseOrder) {
      setErrors(prev => ({ ...prev, purchaseOrders: 'No purchase orders available. Please create a purchase order first.' }));
    }
  }, [loadingPOs, purchaseOrders.length, formData.purchaseOrder]);

  // Handle pre-selected PO (when clicking "+ Add GRN" from PO section)
  useEffect(() => {
    if (preSelectedPO) {
      console.log('Pre-selected PO:', preSelectedPO);
      // Just trigger the normal PO selection
      handlePOSelection(preSelectedPO);
    }
  // Selection should rerun only when the route-provided PO changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preSelectedPO]);

  // Populate form if editing
  useEffect(() => {
    if (grn) {
      setFormData({
        purchaseOrder: grn.purchaseOrder?._id || '',
        receiptDate: grn.receiptDate ? new Date(grn.receiptDate).toISOString().split('T')[0] : '',
        warehouseLocation: grn.warehouseLocation || '',
        generalNotes: grn.generalNotes || '',
        items: grn.items?.map(item => ({
          purchaseOrderItem: item.purchaseOrderItem || item._id,
          productName: item.productName,
          productCode: item.productCode,
          orderedQuantity: item.orderedQuantity,
          receivedQuantity: item.receivedQuantity || 0,
          unit: item.unit,
          specifications: item.specifications || {},
          warehouseLocation: item.warehouseLocation || '',
          notes: item.notes || ''
        })) || []
      });
      
      if (grn.purchaseOrder) {
        setSelectedPO(grn.purchaseOrder);
      }
    }
  }, [grn]);

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

  const handlePOSelection = async (poId) => {
    if (!poId) {
      setSelectedPO(null);
      setFormData(prev => ({
        ...prev,
        purchaseOrder: '',
        items: []
      }));
      return;
    }

    try {
      const response = await purchaseOrderAPI.getById(poId);
      const po = response.data;
      setSelectedPO(po);
      
      // Populate items from PO with receipt tracking
      const items = po.items.map(item => {
        // Get weight from item.weight (new) or specifications.weight (old) for backward compatibility
        const orderedWeight = item.weight || item.specifications?.weight || 0;
        const receivedQty = item.receivedQuantity || 0;
        
        // Calculate received weight from backend OR calculate from quantity
        let receivedWt = item.receivedWeight || 0;
        if (receivedWt === 0 && receivedQty > 0 && item.quantity > 0 && orderedWeight > 0) {
          // If backend doesn't have receivedWeight, calculate it
          const weightPerUnit = orderedWeight / item.quantity;
          receivedWt = receivedQty * weightPerUnit;
        }
        
        const pendingQty = item.quantity - receivedQty;
        const pendingWt = orderedWeight - receivedWt;
        
        // Default received per-unit weights from PO ordered weights
        const orderedSubProductWeights = item.subProductWeights || [];
        const receiveQty = pendingQty > 0 ? pendingQty : 0;
        const defaultReceivedWeights = orderedSubProductWeights.length > 0
          ? orderedSubProductWeights.slice(0, receiveQty)
          : [];

        return {
          purchaseOrderItem: item._id,
          productName: item.productName,
          productCode: item.productCode,
          product: item.product?._id || item.product,
          
          // Sub-product tracking
          subProduct: item.subProduct?._id || item.subProduct || null,
          subProductName: item.subProductName || null,
          orderedSubProductWeights: orderedSubProductWeights,
          receivedSubProductWeights: defaultReceivedWeights,
          
          // Ordered
          orderedQuantity: item.quantity,
          orderedWeight: orderedWeight,
          
          // Previously received (from other GRNs)
          previouslyReceived: receivedQty,
          previousWeight: receivedWt,
          
          // Receiving now (pre-fill with pending qty)
          receivedQuantity: receiveQty,
          receivedWeight: pendingWt > 0 ? pendingWt : 0,
          
          // Pending (auto-calculated)
          pendingQuantity: pendingQty,
          pendingWeight: pendingWt,
          
          unit: item.unit,
          specifications: item.specifications || {},
          receiptStatus: item.receiptStatus || 'Pending',
          warehouseLocation: formData.warehouseLocation,
          notes: '',
          
          // Track if item is already completed (either fully received OR manually completed)
          isCompleted: pendingQty <= 0 || item.manuallyCompleted,
          manuallyCompleted: item.manuallyCompleted || false
        };
      }).filter(item => !item.isCompleted); // Only show items with pending qty or not manually completed
      
      setFormData(prev => ({
        ...prev,
        purchaseOrder: poId,
        items
      }));
    } catch (error) {
      console.error('Error fetching PO details:', error);
      alert('Failed to load PO details');
    }
  };

  const normalizeWeights = (weights, length) => {
    const w = Array.isArray(weights) ? weights : [];
    const result = [];
    for (let i = 0; i < length; i++) {
      result.push(i < w.length ? (Number(w[i]) || 0) : 0);
    }
    return result;
  };

  // Group GRN items by product so one card can contain multiple sub-product rows
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

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    const item = { ...updatedItems[index] };
    item[field] = value;

    if (field === 'receivedQuantity') {
      const qty = Math.max(0, Number(value) || 0);
      const maxAllowed = item.orderedQuantity - item.previouslyReceived;
      const validQty = Math.min(qty, maxAllowed);
      item.receivedQuantity = validQty;
      if (item.subProduct) {
        const orderedWeights = item.orderedSubProductWeights || [];
        item.receivedSubProductWeights = normalizeWeights(orderedWeights, validQty);
        item.receivedWeight = item.receivedSubProductWeights.reduce((sum, w) => sum + w, 0);
      } else if (item.orderedQuantity > 0 && item.orderedWeight > 0) {
        const weightPerUnit = item.orderedWeight / item.orderedQuantity;
        item.receivedWeight = validQty * weightPerUnit;
      }
      item.pendingQuantity = Math.max(0, item.orderedQuantity - item.previouslyReceived - validQty);
      item.pendingWeight = Math.max(0, item.orderedWeight - item.previousWeight - item.receivedWeight);
    } else if (field === 'receivedWeight') {
      const weight = Math.max(0, Number(value) || 0);
      item.receivedWeight = weight;
      if (item.subProduct) {
        const qty = Math.max(1, Number(item.receivedQuantity) || 1);
        const perUnit = weight / qty;
        item.receivedSubProductWeights = Array.from({ length: qty }, () => perUnit);
      }
      item.pendingWeight = Math.max(0, item.orderedWeight - item.previousWeight - weight);
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

  const handleReceivedSubProductWeightsChange = (index, weights) => {
    const updatedItems = [...formData.items];
    const item = { ...updatedItems[index] };
    item.receivedSubProductWeights = weights;
    item.receivedWeight = weights.reduce((sum, w) => sum + (Number(w) || 0), 0);
    item.pendingWeight = Math.max(0, item.orderedWeight - item.previousWeight - item.receivedWeight);
    updatedItems[index] = item;
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Basic validations
    if (!formData.purchaseOrder) {
      newErrors.purchaseOrder = 'Purchase Order is required';
    }

    if (!formData.receiptDate) {
      newErrors.receiptDate = 'Receipt date is required';
    }

    if (!formData.warehouseLocation) {
      newErrors.warehouseLocation = 'Warehouse Location is required';
    }

    // Item validations
    let hasAtLeastOneItem = false;
    formData.items.forEach((item, index) => {
      // Allow if received qty > 0 OR marked as complete
      if (item.receivedQuantity > 0 || item.markAsComplete) {
        hasAtLeastOneItem = true;
        
        // Check if receiving more than pending (only if not marked complete)
        if (item.receivedQuantity > 0 && !item.markAsComplete) {
          const maxAllowed = item.orderedQuantity - item.previouslyReceived;
          if (item.receivedQuantity > maxAllowed) {
            newErrors['items.' + index + '.receivedQuantity'] = 
              'Cannot receive more than pending (' + maxAllowed + ' ' + item.unit + ')';
          }
        }
      }
    });
    
    if (!hasAtLeastOneItem) {
      newErrors.items = 'Please enter received quantity for at least one item or mark as complete';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
          receivedQuantity: Number(item.receivedQuantity)
        }))
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ submit: error.message || 'Failed to save GRN' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-5">

      {errors.submit && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <X className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-800 font-medium">{errors.submit}</p>
          </div>
        </div>
      )}

      {/* Purchase Order Selection */}
      <section className="overflow-visible rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-green-50 text-green-700">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-gray-900">Purchase order</h3>
              <p className="text-xs text-gray-500">Source document for this goods receipt</p>
            </div>
          </div>
          {!loadingPOs && totalPOs !== null && (
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900">{totalPOs}</span> available
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:px-5 md:grid-cols-[minmax(0,1fr)_15rem]">
          {/* PO Selection with SearchableSelect */}
          <div className="min-w-0">
            <SearchableSelect
              label="Purchase Order"
              required
              options={purchaseOrders}
              value={formData.purchaseOrder}
              onChange={(value) => handlePOSelection(value)}
              placeholder={loadingPOs ? 'Loading purchase orders...' : 'Select Purchase Order'}
              searchPlaceholder="Search by PO number or supplier..."
              getOptionLabel={(po) => `${po.poNumber} - ${po.supplierDetails?.companyName || po.supplier?.companyName || 'Unknown Supplier'}`}
              getOptionValue={(po) => po._id}
              onSearch={handlePOSearch}
              loading={loadingPOs}
              loadingMore={loadingMorePOs}
              hasMore={hasMorePOs}
              onLoadMore={loadMorePOs}
              total={totalPOs}
              disabled={!!grn}
              onAddNew={() => setShowPOModal(true)}
              addNewLabel="Add PO"
              error={errors.purchaseOrder}
              renderValue={(po) => (
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{po.poNumber}</p>
                    <p className="truncate text-xs text-gray-500">
                      {po.supplierDetails?.companyName || po.supplier?.companyName || 'Unknown Supplier'}
                    </p>
                  </div>
                  <span className="hidden flex-shrink-0 text-xs font-medium text-green-700 sm:inline">
                    {po.status?.replaceAll('_', ' ') || 'Pending'}
                  </span>
                </div>
              )}
              renderOption={(po, isSelected) => (
                <div className="flex min-w-0 items-start gap-3">
                  <span className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md ${
                    isSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {isSelected
                      ? <CheckCircle2 className="h-4 w-4" />
                      : <FileText className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center justify-between gap-3">
                      <span className="truncate font-semibold text-gray-900">{po.poNumber}</span>
                      <span className={`flex-shrink-0 text-xs font-medium ${
                        po.status === 'Approved' ? 'text-green-700' :
                        po.status === 'Partially_Received' ? 'text-blue-700' :
                        po.status === 'Pending' ? 'text-amber-700' :
                        'text-gray-600'
                      }`}>
                        {po.status?.replaceAll('_', ' ') || 'Pending'}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-gray-600">
                      {po.supplierDetails?.companyName || po.supplier?.companyName || 'Unknown Supplier'}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      {po.category?.categoryName && <span>{po.category.categoryName}</span>}
                      {isSelected && <span className="font-medium text-blue-700">Selected</span>}
                    </div>
                  </div>
                </div>
              )}
            />
          </div>

          {/* Receipt Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
              <Calendar className="h-3 w-3 text-gray-500" />
              Receipt Date <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="date"
              name="receiptDate"
              value={formData.receiptDate}
              onChange={handleChange}
              className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white hover:border-green-400 transition-all ${
                errors.receiptDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.receiptDate && (
              <p className="text-red-500 text-xs mt-1">{errors.receiptDate}</p>
            )}
          </div>
        </div>
      </section>

      {/* Warehouse Information */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-100">
        <div className="flex items-center mb-3 gap-2">
          <Warehouse className="h-4 w-4 text-purple-600" />
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Warehouse Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
              <MapPin className="h-3 w-3 text-gray-500" />
              Warehouse Location <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <select
                name="warehouseLocation"
                value={formData.warehouseLocation}
                onChange={handleChange}
                className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white hover:border-purple-400 transition-all appearance-none ${
                  errors.warehouseLocation ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Select Warehouse Location</option>
                {warehouseLocations.map(warehouse => (
                  <option key={warehouse._id} value={warehouse._id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            {errors.warehouseLocation && (
              <p className="text-red-500 text-xs mt-1">{errors.warehouseLocation}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
              <StickyNote className="h-3 w-3 text-gray-500" />
              Storage Notes
            </label>
            <input
              type="text"
              name="storageInstructions"
              value={formData.storageInstructions || ''}
              onChange={handleChange}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white hover:border-purple-400 transition-all"
              placeholder="Additional storage instructions (optional)"
            />
          </div>
        </div>
      </div>

      {/* Items */}
      {selectedPO && formData.items.length > 0 && (
        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-green-50 text-green-700">
                <Package className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-900">Items to receive</h3>
                <p className="text-xs text-gray-500">Remaining purchase order balance</p>
              </div>
            </div>
          </div>

          <div className="hidden grid-cols-12 gap-4 border-b border-gray-200 bg-white px-5 py-2.5 text-xs font-semibold uppercase text-gray-500 lg:grid">
            <div className="col-span-3">Product / variant</div>
            <div className="col-span-2">PO balance</div>
            <div className="col-span-6">Receiving now</div>
            <div className="col-span-1 text-center">Final</div>
          </div>

          <div className="divide-y divide-gray-200">
            {getProductGroups().map((group, groupIndex) => (
              <div key={`${group.product || group.productName}-${groupIndex}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-green-100 bg-green-50 px-4 py-2.5 sm:px-5">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold text-gray-900">{group.productName}</span>
                    {group.productCode && (
                      <span className="text-xs text-gray-500">{group.productCode}</span>
                    )}
                    <span className="text-xs font-medium text-green-700">{group.unit}</span>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {group.items.map((item, rowIndex) => {
                    const globalIndex = group.indices[rowIndex];
                    const maxReceivable = item.orderedQuantity - item.previouslyReceived;

                    return (
                      <div key={globalIndex} className="px-4 py-4 transition-colors hover:bg-gray-50 sm:px-5">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start">
                          <div className="min-w-0 lg:col-span-3">
                            <p className="mb-1 text-xs font-semibold uppercase text-gray-500 lg:hidden">
                              Product / variant
                            </p>
                            <div className="flex min-w-0 items-start gap-2">
                              <span className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${
                                item.subProductName ? 'bg-green-500' : 'bg-blue-500'
                              }`} />
                              <div className="min-w-0">
                                <p className="break-words text-sm font-semibold text-gray-900">
                                  {item.subProductName
                                    ? `${item.productName} X ${item.subProductName}`
                                    : item.productName}
                                </p>
                              </div>
                            </div>
                            {item.previouslyReceived > 0 && (
                              <p className="mt-2 text-xs text-gray-500">
                                Previously received: <span className="font-medium text-gray-700">{item.previouslyReceived} {item.unit}</span>
                              </p>
                            )}
                          </div>

                          <div className="lg:col-span-2">
                            <p className="mb-1 text-xs font-semibold uppercase text-gray-500 lg:hidden">
                              PO balance
                            </p>
                            <p className="text-sm font-semibold text-gray-900">
                              {maxReceivable} {item.unit}
                            </p>
                          </div>

                          <div className="min-w-0 lg:col-span-6">
                            <p className="mb-2 text-xs font-semibold uppercase text-gray-500 lg:hidden">
                              Receiving now
                            </p>
                            <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-[minmax(15rem,1.2fr)_minmax(10rem,0.8fr)]">
                              <div className="min-w-0">
                                <span className="mb-1 block text-xs font-medium text-gray-600">Quantity</span>
                                <div className="grid grid-cols-[2.25rem_minmax(6rem,1fr)_2.25rem_auto] items-center gap-2">
                                  <button
                                    type="button"
                                    aria-label={`Decrease received quantity for ${item.productName}${item.subProductName ? ` X ${item.subProductName}` : ''}`}
                                    onClick={() => {
                                      const newQty = Math.max(0, Number(item.receivedQuantity) - 1);
                                      handleItemChange(globalIndex, 'receivedQuantity', newQty);
                                    }}
                                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                                    disabled={item.receivedQuantity <= 0}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </button>
                                  <input
                                    type="number"
                                    aria-label={`Received quantity for ${item.productName}${item.subProductName ? ` X ${item.subProductName}` : ''}`}
                                    value={item.receivedQuantity}
                                    onChange={(e) => handleItemChange(globalIndex, 'receivedQuantity', e.target.value)}
                                    className="h-9 min-w-0 w-full rounded-md border border-gray-300 bg-white px-2 text-center text-sm font-medium text-gray-900 outline-none transition-colors focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                                    min="0"
                                    max={maxReceivable}
                                    step="1"
                                    placeholder="0"
                                  />
                                  <button
                                    type="button"
                                    aria-label={`Increase received quantity for ${item.productName}${item.subProductName ? ` X ${item.subProductName}` : ''}`}
                                    onClick={() => {
                                      const newQty = Math.min(maxReceivable, Number(item.receivedQuantity) + 1);
                                      handleItemChange(globalIndex, 'receivedQuantity', newQty);
                                    }}
                                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                                    disabled={item.receivedQuantity >= maxReceivable}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                  <span className="text-xs font-medium text-gray-600">{item.unit}</span>
                                </div>
                              </div>

                              <div className="min-w-0">
                                <span className="mb-1 block text-xs font-medium text-gray-600">Weight</span>
                                {item.subProduct ? (
                                  <div className="flex h-9 items-center rounded-md border border-green-200 bg-green-50 px-3">
                                    <span className="text-sm font-semibold text-green-800">
                                      {(Number(item.receivedWeight) || 0).toFixed(2)} kg
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      aria-label={`Decrease received weight for ${item.productName}`}
                                      onClick={() => {
                                        const weight = Math.max(0, Number(item.receivedWeight || 0) - 1);
                                        handleItemChange(globalIndex, 'receivedWeight', weight);
                                      }}
                                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                                      disabled={item.receivedWeight <= 0}
                                    >
                                      <Minus className="h-4 w-4" />
                                    </button>
                                    <span className="relative min-w-0 flex-1">
                                      <input
                                        type="number"
                                        aria-label={`Received weight for ${item.productName}`}
                                        value={item.receivedWeight || 0}
                                        onChange={(e) => handleItemChange(globalIndex, 'receivedWeight', e.target.value)}
                                        className="h-9 w-full rounded-md border border-gray-300 bg-white px-2 pr-8 text-center text-sm text-gray-900 outline-none transition-colors focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                                        min="0"
                                        step="0.01"
                                      />
                                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">kg</span>
                                    </span>
                                    <button
                                      type="button"
                                      aria-label={`Increase received weight for ${item.productName}`}
                                      onClick={() => {
                                        const maxWeight = item.orderedWeight - item.previousWeight;
                                        const weight = Math.min(maxWeight, Number(item.receivedWeight || 0) + 1);
                                        handleItemChange(globalIndex, 'receivedWeight', weight);
                                      }}
                                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                                      disabled={item.receivedWeight >= (item.orderedWeight - item.previousWeight)}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {errors['items.' + globalIndex + '.receivedQuantity'] && (
                              <p className="mt-2 text-xs text-red-600">{errors['items.' + globalIndex + '.receivedQuantity']}</p>
                            )}
                          </div>

                          <div className="lg:col-span-1">
                            <p className="mb-2 text-xs font-semibold uppercase text-gray-500 lg:hidden">
                              Final
                            </p>
                            <label className={`inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 transition-colors lg:w-10 lg:px-0 ${
                              item.markAsComplete
                                ? 'border-green-300 bg-green-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}>
                              <input
                                type="checkbox"
                                aria-label={`Mark ${item.productName}${item.subProductName ? ` X ${item.subProductName}` : ''} as final`}
                                checked={item.markAsComplete || false}
                                onChange={(e) => {
                                  const updatedItems = [...formData.items];
                                  updatedItems[globalIndex].markAsComplete = e.target.checked;
                                  setFormData(prev => ({ ...prev, items: updatedItems }));
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                title="Mark this item as complete even if quantity doesn't match (e.g., due to losses)"
                              />
                              <span className={`text-sm font-semibold lg:hidden ${
                                item.markAsComplete ? 'text-green-800' : 'text-gray-700'
                              }`}>
                                {item.markAsComplete ? 'Marked final' : 'Mark final'}
                              </span>
                            </label>
                          </div>
                        </div>

                        {item.subProduct && (
                          <div className="mt-3 border-t border-gray-100 pt-3 lg:ml-[41.666667%] lg:mr-[8.333333%]">
                            <SubProductSelector
                              productId={item.product}
                              selectedSubProduct={item.subProduct}
                              selectedSubProductName={item.subProductName}
                              quantity={item.receivedQuantity}
                              weights={item.receivedSubProductWeights}
                              categoryHasSubProducts={true}
                              onSelectSubProduct={() => {}}
                              onWeightsChange={(weights) => handleReceivedSubProductWeightsChange(globalIndex, weights)}
                              disableSelection={true}
                              allowAddNew={false}
                              compact
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Notes */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
        <div className="flex items-center mb-3 gap-2">
          <StickyNote className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Additional Information</h3>
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            General Notes
          </label>
          <textarea
            name="generalNotes"
            value={formData.generalNotes}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-blue-400 transition-all"
            placeholder="Any additional notes about this goods receipt..."
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !selectedPO}
          className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 min-w-[180px] justify-center"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>{grn ? 'Update GRN' : 'Create GRN'}</span>
            </>
          )}
        </button>
      </div>
    </form>
    
    {/* PO Quick-Add Modal - Rendered outside form using Portal */}
    {showPOModal && createPortal(
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
        onClick={(e) => {
          // Close modal if clicking on overlay
          if (e.target === e.currentTarget) {
            setShowPOModal(false);
          }
        }}
      >
        <div 
          className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
            <h3 className="text-lg font-semibold text-gray-900">Create New Purchase Order</h3>
            <button
              type="button"
              onClick={() => setShowPOModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="text-2xl leading-none">×</span>
            </button>
          </div>
          <div className="p-6">
            <PurchaseOrderForm
              isModal={true}
              onSubmit={async (poData) => {
                try {
                  console.log('Creating PO from GRN modal...');
                  const response = await purchaseOrderAPI.create(poData);
                  console.log('PO created:', response.data);
                  
                  if (!response || !response.data || !response.data._id) {
                    throw new Error('Invalid response from server');
                  }
                  
                  const newPOId = response.data._id;
                  
                  // Close modal
                  setShowPOModal(false);
                  
                  // Optimistically add the new PO and refresh the list
                  if (response.data) setPurchaseOrders(prev => [response.data, ...prev]);
                  await refreshPOs();

                  // Auto-select the newly created PO
                  await handlePOSelection(newPOId);
                  alert('✅ Purchase Order created and selected successfully!');
                } catch (error) {
                  console.error('Error creating PO:', error);
                  alert('❌ Failed to create Purchase Order: ' + (error.message || 'Unknown error'));
                }
              }}
              onCancel={() => {
                console.log('PO creation cancelled');
                setShowPOModal(false);
              }}
            />
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
};

export default GRNForm;
