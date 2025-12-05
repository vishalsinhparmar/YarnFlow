import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { purchaseOrderAPI } from '../../services/purchaseOrderAPI';
import masterDataAPI from '../../services/masterDataAPI';
import PurchaseOrderForm from '../PurchaseOrders/PurchaseOrderForm';
import SearchableSelect from '../common/SearchableSelect';
import { WAREHOUSE_LOCATIONS, getWarehouseName } from '../../constants/warehouseLocations';

const GRNForm = ({ grn, onSubmit, onCancel, preSelectedPO, purchaseOrderData }) => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingPOs, setLoadingPOs] = useState(true);
  const [errors, setErrors] = useState({});
  const [showPOModal, setShowPOModal] = useState(false);

  const [formData, setFormData] = useState({
    purchaseOrder: '',
    receiptDate: new Date().toISOString().split('T')[0],
    warehouseLocation: '',
    storageInstructions: '',
    generalNotes: '',
    items: []
  });

  // Fetch purchase orders function (memoized for SearchableSelect)
  const fetchPurchaseOrders = useCallback(async (search = '') => {
    try {
      setLoadingPOs(true);
      console.log('Fetching purchase orders...', search ? `with search: ${search}` : '');
      
      const params = { limit: 100 };
      if (search) params.search = search;
      
      const response = await purchaseOrderAPI.getAll(params);
      console.log('Purchase Orders Response:', response);
      
      if (response && response.data) {
        // Filter out completed POs (Fully_Received status)
        const incompletePOs = response.data.filter(po => 
          po.status !== 'Fully_Received' && po.status !== 'Complete'
        );
        setPurchaseOrders(incompletePOs);
        console.log(`Purchase Orders loaded: ${incompletePOs.length} incomplete out of ${response.data.length} total`);
      } else {
        console.log('No purchase orders found in response');
        setPurchaseOrders([]);
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      setPurchaseOrders([]);
      if (!search) setErrors(prev => ({ ...prev, purchaseOrders: 'Failed to load purchase orders' }));
    } finally {
      setLoadingPOs(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

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
        
        return {
          purchaseOrderItem: item._id,
          productName: item.productName,
          productCode: item.productCode,
          
          // Ordered
          orderedQuantity: item.quantity,
          orderedWeight: orderedWeight,
          
          // Previously received (from other GRNs)
          previouslyReceived: receivedQty,
          previousWeight: receivedWt,
          
          // Receiving now (pre-fill with pending qty)
          receivedQuantity: pendingQty > 0 ? pendingQty : 0,
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50 rounded-xl">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600"></div>
            <p className="mt-4 text-green-600 font-medium">Creating GRN...</p>
          </div>
        </div>
      )}

      {errors.submit && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-800 font-medium">{errors.submit}</p>
          </div>
        </div>
      )}

      {/* Purchase Order Selection */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 shadow-sm border border-green-100">
        <div className="flex items-center mb-6">
          <svg className="h-6 w-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900">Purchase Order Selection</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              onSearch={fetchPurchaseOrders}
              loading={loadingPOs}
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
            {!loadingPOs && purchaseOrders.length > 0 && !formData.purchaseOrder && (
              <p className="text-xs text-green-600 mt-2 flex items-center">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {purchaseOrders.length} purchase order(s) available - Search to find specific PO
              </p>
            )}
          </div>

          {/* Receipt Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Receipt Date <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="date"
              name="receiptDate"
              value={formData.receiptDate}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white hover:border-green-400 transition-all ${
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
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-purple-100">
        <div className="flex items-center mb-6">
          <svg className="h-6 w-6 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900">Warehouse Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Warehouse Location <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <select
                name="warehouseLocation"
                value={formData.warehouseLocation}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white hover:border-purple-400 transition-all appearance-none ${
                  errors.warehouseLocation ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Select Warehouse Location</option>
                {WAREHOUSE_LOCATIONS.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {errors.warehouseLocation && (
              <p className="text-red-500 text-xs mt-1">{errors.warehouseLocation}</p>
            )}
            {!errors.warehouseLocation && (
              <p className="text-xs text-gray-500 mt-2">
                Select where the received goods will be stored
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Storage Notes
            </label>
            <input
              type="text"
              name="storageInstructions"
              value={formData.storageInstructions || ''}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white hover:border-purple-400 transition-all"
              placeholder="Additional storage instructions (optional)"
            />
          </div>
        </div>
      </div>

      {/* Items */}
      {selectedPO && formData.items.length > 0 && (
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 shadow-sm border border-orange-100">
          <div className="flex items-center mb-6">
            <svg className="h-6 w-6 text-orange-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900">Items Received</h3>
          </div>
          
          <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Ordered
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider bg-blue-50">
                    Prev. Received
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-green-700 uppercase tracking-wider bg-green-50">
                    Receiving Now *
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-orange-700 uppercase tracking-wider bg-orange-50">
                    Pending
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Mark Complete
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formData.items.map((item, index) => {
                  const completionPercentage = item.orderedQuantity > 0 
                    ? Math.round(((item.previouslyReceived + Number(item.receivedQuantity || 0)) / item.orderedQuantity) * 100)
                    : 0;
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                        <div className="text-sm text-gray-500">{item.productCode}</div>
                      </td>
                      
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {item.orderedQuantity} {item.unit}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.orderedWeight > 0 ? item.orderedWeight + ' kg' : '-'}
                        </div>
                      </td>
                      
                      <td className="px-4 py-4 bg-blue-50">
                        <div className="text-sm font-medium text-blue-700">
                          {item.previouslyReceived || 0} {item.unit}
                        </div>
                        <div className="text-xs text-blue-600">
                          {(item.previousWeight || 0).toFixed(2)} kg
                        </div>
                      </td>
                      
                      <td className="px-4 py-4 bg-green-50">
                        <div className="space-y-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={item.receivedQuantity}
                                onChange={(e) => {
                                  const qty = Number(e.target.value) || 0;
                                  const maxAllowed = item.orderedQuantity - item.previouslyReceived;
                                  
                                  // Enforce max validation
                                  const validQty = Math.min(qty, maxAllowed);
                                  
                                  const updatedItems = [...formData.items];
                                  updatedItems[index].receivedQuantity = validQty;
                                  
                                  if (item.orderedQuantity > 0 && item.orderedWeight > 0) {
                                    const weightPerUnit = item.orderedWeight / item.orderedQuantity;
                                    updatedItems[index].receivedWeight = validQty * weightPerUnit;
                                    updatedItems[index].pendingQuantity = item.orderedQuantity - item.previouslyReceived - validQty;
                                    updatedItems[index].pendingWeight = item.orderedWeight - item.previousWeight - (validQty * weightPerUnit);
                                  }
                                  
                                  setFormData(prev => ({ ...prev, items: updatedItems }));
                                }}
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                                min="0"
                                max={item.orderedQuantity - item.previouslyReceived}
                                step="0.1"
                                placeholder="0"
                              />
                              <span className="text-sm text-gray-600">{item.unit}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              Max: {item.orderedQuantity - item.previouslyReceived} {item.unit}
                            </div>
                            {item.receivedQuantity > (item.orderedQuantity - item.previouslyReceived) && (
                              <div className="text-xs text-red-600 mt-1">
                                Cannot receive more than pending ({item.orderedQuantity - item.previouslyReceived} {item.unit})
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={item.receivedWeight || 0}
                              onChange={(e) => {
                                const weight = Number(e.target.value) || 0;
                                const updatedItems = [...formData.items];
                                updatedItems[index].receivedWeight = weight;
                                updatedItems[index].pendingWeight = item.orderedWeight - item.previousWeight - weight;
                                setFormData(prev => ({ ...prev, items: updatedItems }));
                              }}
                              className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                              min="0"
                              step="0.01"
                            />
                            <span className="text-xs text-gray-600">kg</span>
                          </div>
                          
                          {errors['items.' + index + '.receivedQuantity'] && (
                            <p className="text-red-500 text-xs">{errors['items.' + index + '.receivedQuantity']}</p>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-4 py-4 bg-orange-50">
                        <div className="text-sm font-medium text-orange-700">
                          {Math.max(0, item.pendingQuantity || 0)} {item.unit}
                        </div>
                        <div className="text-xs text-orange-600">
                          {Math.max(0, item.pendingWeight || 0).toFixed(2)} kg
                        </div>
                      </td>
                      
                      <td className="px-4 py-4">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={'h-2.5 rounded-full transition-all ' + (completionPercentage === 100 ? 'bg-green-600' : completionPercentage > 0 ? 'bg-blue-600' : 'bg-gray-400')}
                            style={{ width: completionPercentage + '%' }}
                          />
                        </div>
                        <div className="text-xs text-center text-gray-600 mt-1">
                          {completionPercentage}%
                        </div>
                      </td>
                      
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <input
                            type="checkbox"
                            checked={item.markAsComplete || false}
                            onChange={(e) => {
                              const updatedItems = [...formData.items];
                              updatedItems[index].markAsComplete = e.target.checked;
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
      )}

      {/* Notes */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-blue-100">
        <div className="flex items-center mb-4">
          <svg className="h-6 w-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900">Additional Information</h3>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            General Notes
          </label>
          <textarea
            name="generalNotes"
            value={formData.generalNotes}
            onChange={handleChange}
            rows="4"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-blue-400 transition-all"
            placeholder="Any additional notes about this goods receipt..."
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
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
          className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {grn ? 'Update GRN' : 'Create GRN'}
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
                  
                  // Refresh PO list (filter out completed POs)
                  const posResponse = await purchaseOrderAPI.getAll({ limit: 100 });
                  if (posResponse && posResponse.data) {
                    const incompletePOs = posResponse.data.filter(po => 
                      po.status !== 'Fully_Received' && po.status !== 'Complete'
                    );
                    console.log(`Refreshed PO list: ${incompletePOs.length} incomplete out of ${posResponse.data.length} total`);
                    setPurchaseOrders(incompletePOs);
                    
                    // Auto-select the newly created PO
                    console.log('Auto-selecting new PO:', newPOId);
                    await handlePOSelection(newPOId);
                    
                    alert('✅ Purchase Order created and selected successfully!');
                  }
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
