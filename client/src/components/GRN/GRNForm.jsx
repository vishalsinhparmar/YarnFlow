import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Minus, Loader2, Warehouse, StickyNote, Package, MapPin, FileText, Calendar, ChevronDown, X, CheckCircle2 } from 'lucide-react';
import { purchaseOrderAPI } from '../../services/purchaseOrderAPI';
import masterDataAPI from '../../services/masterDataAPI';
import PurchaseOrderForm from '../PurchaseOrders/PurchaseOrderForm';
import SearchableSelect from '../common/SearchableSelect';
import SubProductSelector from '../common/SubProductSelector';
import { usePaginatedSearch } from '../../hooks/usePaginatedSearch';
import warehouseAPI from '../../services/warehouseAPI';

const GRNForm = ({ grn, onSubmit, onCancel, preSelectedPO, purchaseOrderData }) => {
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
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
        <div className="flex items-center mb-3 gap-2">
          <FileText className="h-4 w-4 text-green-600" />
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Purchase Order Selection</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PO Selection with SearchableSelect */}
          <div>
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
              renderOption={(po, isSelected) => (
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{po.poNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      po.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      po.status === 'Partially_Received' ? 'bg-blue-100 text-blue-800' :
                      po.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {po.status?.replace('_', ' ') || 'Pending'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{po.supplierDetails?.companyName || po.supplier?.companyName || 'Unknown Supplier'}</span>
                  {po.category?.categoryName && (
                    <span className="text-xs text-green-600">{po.category.categoryName}</span>
                  )}
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
      </div>

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
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-100">
          <div className="flex items-center mb-3 gap-2">
            <Package className="h-4 w-4 text-orange-600" />
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Items Received</h3>
          </div>
          
          <div className="space-y-3">
            {getProductGroups().map((group, groupIndex) => (
              <div key={groupIndex} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-orange-100 to-amber-100 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{group.productName}</div>
                    <div className="text-xs text-gray-500">{group.productCode} • Unit: {group.unit}</div>
                  </div>
                  <div className="text-xs font-semibold text-orange-700 bg-white px-2 py-1 rounded border border-orange-200">
                    {group.items.length} variant{group.items.length > 1 ? 's' : ''}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Product / Variant
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Ordered
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-green-700 uppercase tracking-wider bg-green-50/50">
                          Receiving Now
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Mark Final
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {group.items.map((item, rowIndex) => {
                        const globalIndex = group.indices[rowIndex];
                        const completionPercentage = item.orderedQuantity > 0
                          ? Math.round(((item.previouslyReceived + Number(item.receivedQuantity || 0)) / item.orderedQuantity) * 100)
                          : 0;
                        return (
                          <tr key={globalIndex} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div className="text-sm font-semibold text-green-700">
                                {item.subProductName ? `${item.productName} X ${item.subProductName}` : <span className="text-gray-400">-</span>}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm font-medium text-gray-900">{item.orderedQuantity} {item.unit}</div>
                              <div className="text-xs text-gray-500">{item.orderedWeight > 0 ? item.orderedWeight + ' kg' : '-'}</div>
                            </td>
                            <td className="px-4 py-4 bg-green-50/30">
                              <div className="space-y-3">
                                <div>
                                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Quantity</div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newQty = Math.max(0, Number(item.receivedQuantity) - 1);
                                        handleItemChange(globalIndex, 'receivedQuantity', newQty);
                                      }}
                                      className="p-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
                                      disabled={item.receivedQuantity <= 0}
                                    >
                                      <Minus className="w-3.5 h-3.5 text-gray-600" />
                                    </button>
                                    <input
                                      type="number"
                                      value={item.receivedQuantity}
                                      onChange={(e) => handleItemChange(globalIndex, 'receivedQuantity', e.target.value)}
                                      className="w-20 px-2 py-1.5 text-sm text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                                      min="0"
                                      max={item.orderedQuantity - item.previouslyReceived}
                                      step="1"
                                      placeholder="0"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const maxAllowed = item.orderedQuantity - item.previouslyReceived;
                                        const newQty = Math.min(maxAllowed, Number(item.receivedQuantity) + 1);
                                        handleItemChange(globalIndex, 'receivedQuantity', newQty);
                                      }}
                                      className="p-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
                                      disabled={item.receivedQuantity >= (item.orderedQuantity - item.previouslyReceived)}
                                    >
                                      <Plus className="w-3.5 h-3.5 text-gray-600" />
                                    </button>
                                    <span className="text-sm text-gray-600">{item.unit}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Max: {item.orderedQuantity - item.previouslyReceived} {item.unit}
                                  </div>
                                  {item.receivedQuantity > (item.orderedQuantity - item.previouslyReceived) && (
                                    <div className="text-xs text-red-600 mt-1">
                                      Max allowed: {item.orderedQuantity - item.previouslyReceived} {item.unit}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Weight</div>
                                  {item.subProduct ? (
                                    <div>
                                      <div className="text-sm font-semibold text-green-700">Total: {(Number(item.receivedWeight) || 0).toFixed(2)} kg</div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const weight = Math.max(0, Number(item.receivedWeight || 0) - 1);
                                          handleItemChange(globalIndex, 'receivedWeight', weight);
                                        }}
                                        className="p-0.5 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
                                        disabled={item.receivedWeight <= 0}
                                      >
                                        <Minus className="w-3 h-3 text-gray-600" />
                                      </button>
                                      <input
                                        type="number"
                                        value={item.receivedWeight || 0}
                                        onChange={(e) => handleItemChange(globalIndex, 'receivedWeight', e.target.value)}
                                        className="w-20 px-2 py-1 text-xs text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                                        min="0"
                                        step="0.01"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const maxWeight = item.orderedWeight - item.previousWeight;
                                          const weight = Math.min(maxWeight, Number(item.receivedWeight || 0) + 1);
                                          handleItemChange(globalIndex, 'receivedWeight', weight);
                                        }}
                                        className="p-0.5 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
                                        disabled={item.receivedWeight >= (item.orderedWeight - item.previousWeight)}
                                      >
                                        <Plus className="w-3 h-3 text-gray-600" />
                                      </button>
                                      <span className="text-xs text-gray-600">kg</span>
                                    </div>
                                  )}
                                </div>
                                {item.subProduct && (
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
                                )}
                                {errors['items.' + globalIndex + '.receivedQuantity'] && (
                                  <p className="text-red-500 text-xs">{errors['items.' + globalIndex + '.receivedQuantity']}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={item.markAsComplete || false}
                                  onChange={(e) => {
                                    const updatedItems = [...formData.items];
                                    updatedItems[globalIndex].markAsComplete = e.target.checked;
                                    setFormData(prev => ({ ...prev, items: updatedItems }));
                                  }}
                                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                  title="Mark this item as complete even if quantity doesn't match (e.g., due to losses)"
                                />
                                {item.markAsComplete && (
                                  <span className="text-xs text-green-600 font-medium">Final</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
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
