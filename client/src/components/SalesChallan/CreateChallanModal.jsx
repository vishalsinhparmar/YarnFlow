import React, { useState, useEffect } from 'react';
import { salesOrderAPI } from '../../services/salesOrderAPI';
import { salesChallanAPI } from '../../services/salesChallanAPI';
import { inventoryAPI } from '../../services/inventoryAPI';
import { apiRequest } from '../../services/common';
import NewSalesOrderModal from '../SalesOrders/NewSalesOrderModal';
import { WAREHOUSE_LOCATIONS, getWarehouseName } from '../../constants/warehouseLocations';

const CreateChallanModal = ({ isOpen, onClose, onSubmit, preSelectedOrderId = null }) => {
  const [formData, setFormData] = useState({
    salesOrder: '',
    expectedDeliveryDate: '',
    warehouseLocation: '',
    items: [],
    notes: ''
  });

  const [salesOrders, setSalesOrders] = useState([]);
  const [selectedSO, setSelectedSO] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSOs, setLoadingSOs] = useState(false);
  const [loadingSODetails, setLoadingSODetails] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showNewSOModal, setShowNewSOModal] = useState(false);
  const [dispatchedQuantities, setDispatchedQuantities] = useState({});

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Reset all state when modal closes
      setFormData({
        salesOrder: '',
        expectedDeliveryDate: '',
        warehouseLocation: '',
        items: [],
        notes: ''
      });
      setSelectedSO(null);
      setError('');
      setSuccessMessage('');
      setDispatchedQuantities({});
    }
  }, [isOpen]);

  // Load sales orders when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSalesOrders();
    }
  }, [isOpen]);

  // Handle pre-selected SO (separate effect to avoid race conditions)
  useEffect(() => {
    if (isOpen && preSelectedOrderId && salesOrders.length > 0) {
      console.log('Pre-selecting SO:', preSelectedOrderId);
      handleSOSelection(preSelectedOrderId);
    }
  }, [isOpen, preSelectedOrderId, salesOrders]);

  const loadSalesOrders = async () => {
    try {
      setLoadingSOs(true);
      setError('');
      
      console.log('Loading sales orders...');
      const response = await salesOrderAPI.getAll({ limit: 100 });
      console.log('Sales Orders API Response:', response);
      
      if (response.success && response.data) {
        console.log('Total SOs received:', response.data.length);
        
        // Filter out Delivered and Cancelled orders
        const availableOrders = response.data.filter(so => 
          !['Delivered', 'Cancelled'].includes(so.status)
        );
        console.log('Available SOs (excluding Delivered/Cancelled):', availableOrders);
        
        setSalesOrders(availableOrders);
        
        if (availableOrders.length === 0) {
          setError('No sales orders available. Please create a sales order first.');
        }
      } else {
        console.error('API returned unsuccessful response:', response);
        setSalesOrders([]);
        setError('Failed to load sales orders');
      }
    } catch (err) {
      console.error('Error loading sales orders:', err);
      setError('Failed to load sales orders: ' + err.message);
      setSalesOrders([]);
    } finally {
      setLoadingSOs(false);
    }
  };

  // Handle sales order selection
  const handleSOSelection = async (soId) => {
    if (!soId) {
      setSelectedSO(null);
      setFormData(prev => ({
        ...prev,
        salesOrder: '',
        expectedDeliveryDate: '',
        items: []
      }));
      return;
    }

    setLoadingSODetails(true);
    setError('');

    try {
      // Fetch SO details and dispatched quantities in parallel
      const [soResponse, dispatchedResponse] = await Promise.all([
        salesOrderAPI.getById(soId),
        salesChallanAPI.getDispatchedQuantities(soId)
      ]);

      if (soResponse.success && soResponse.data) {
        const so = soResponse.data;
        console.log('SO loaded:', so);
        setSelectedSO(so);
        
        // Build dispatched map
        const dispatchedMap = {};
        if (dispatchedResponse.success && dispatchedResponse.data) {
          dispatchedResponse.data.forEach(item => {
            dispatchedMap[item.salesOrderItem] = item.totalDispatched;
          });
        }
        setDispatchedQuantities(dispatchedMap);
        console.log('Dispatched quantities:', dispatchedMap);
        
        // Auto-populate form from SO
        const items = so.items?.map(item => {
          const dispatched = dispatchedMap[item._id] || 0;
          const remaining = Math.max(0, (item.quantity || 0) - dispatched);
          
          // Calculate proportional weight based on remaining quantity
          const totalWeight = item.weight || 0;
          const totalQuantity = item.quantity || 1;
          const weightPerUnit = totalWeight / totalQuantity;
          const remainingWeight = remaining * weightPerUnit;
          
          return {
            salesOrderItem: item._id,
            product: item.product?._id || item.product,
            productName: item.product?.productName || item.productName || '',
            productCode: item.product?.productCode || item.productCode || '',
            orderedQuantity: item.quantity || 0,
            dispatchQuantity: remaining, // Default to remaining quantity
            previouslyDispatched: dispatched,
            pendingQuantity: 0,
            unit: item.unit || '',
            weight: remainingWeight, // Proportional weight for remaining quantity
            totalSOWeight: totalWeight, // Store total SO weight for reference
            weightPerUnit: weightPerUnit, // Store weight per unit for calculations
            markAsComplete: false,
            notes: item.notes || ''  // Include notes from Sales Order item
          };
        }) || [];

        console.log('Items mapped:', items);

        // Check if all items are fully dispatched
        const allFullyDispatched = items.every(item => item.previouslyDispatched >= item.orderedQuantity);
        
        if (allFullyDispatched) {
          setError('⚠️ This Sales Order is already fully dispatched. All items have been completed.');
        }

        // Fetch warehouse locations for each product from inventory lots
        const productIds = items.map(item => item.product).filter(Boolean);
        if (productIds.length > 0) {
          try {
            // Fetch inventory lots for these products
            const lotsPromises = productIds.map(productId =>
              apiRequest(`/inventory/lots?product=${productId}&status=Active`)
            );
            
            const lotsResponses = await Promise.all(lotsPromises);
            
            // Map product to warehouse locations with quantities
            const productWarehouseMap = {};
            lotsResponses.forEach((response, index) => {
              const productId = productIds[index];
              if (response.success && response.data) {
                productWarehouseMap[productId] = [];
                
                // Group lots by warehouse
                const warehouseStockMap = {};
                response.data.forEach(lot => {
                  if (lot.warehouse && lot.currentQuantity > 0) {
                    if (!warehouseStockMap[lot.warehouse]) {
                      warehouseStockMap[lot.warehouse] = {
                        warehouse: lot.warehouse,
                        availableQuantity: 0,
                        lots: []
                      };
                    }
                    warehouseStockMap[lot.warehouse].availableQuantity += lot.currentQuantity;
                    warehouseStockMap[lot.warehouse].lots.push(lot);
                  }
                });
                
                // Convert to array
                productWarehouseMap[productId] = Object.values(warehouseStockMap);
              }
            });
            
            // Add warehouse info to items
            const itemsWithWarehouses = items.map(item => ({
              ...item,
              warehouses: productWarehouseMap[item.product] || []
            }));
            
            console.log('📦 Warehouse data for products:', productWarehouseMap);
            
            // Auto-select warehouse if all products are in the same single warehouse
            const allWarehouses = itemsWithWarehouses.flatMap(item => 
              item.warehouses.map(wh => wh.warehouse)
            );
            const uniqueWarehouses = [...new Set(allWarehouses)];
            
            let autoSelectedWarehouse = '';
            if (uniqueWarehouses.length === 1 && uniqueWarehouses[0]) {
              // All products are in the same warehouse
              autoSelectedWarehouse = uniqueWarehouses[0];
              console.log('✅ Auto-selected warehouse:', autoSelectedWarehouse, getWarehouseName(autoSelectedWarehouse));
            } else if (uniqueWarehouses.length > 1) {
              console.log('⚠️ Products are in multiple warehouses:', uniqueWarehouses.map(wh => getWarehouseName(wh)));
            }
            
            // Update form data with auto-selected warehouse
            setFormData(prev => ({
              ...prev,
              salesOrder: soId,
              expectedDeliveryDate: so.expectedDeliveryDate ? 
                new Date(so.expectedDeliveryDate).toISOString().split('T')[0] : '',
              warehouseLocation: autoSelectedWarehouse,
              items: itemsWithWarehouses
            }));
            
            return; // Exit early since we've set formData
          } catch (err) {
            console.error('Error fetching warehouse info:', err);
            // Continue without warehouse info
          }
        }

        setFormData(prev => ({
          ...prev,
          salesOrder: soId,
          expectedDeliveryDate: so.expectedDeliveryDate ? 
            new Date(so.expectedDeliveryDate).toISOString().split('T')[0] : '',
          items: items
        }));
      } else {
        setError('Failed to load sales order details');
      }
    } catch (err) {
      console.error('Error loading sales order details:', err);
      setError('Failed to load sales order details');
    } finally {
      setLoadingSODetails(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (error) setError('');
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

    // Calculate pending quantity and weight when dispatch quantity changes
    if (field === 'dispatchQuantity') {
      const orderedQty = updatedItems[index].orderedQuantity || 0;
      const dispatchQty = parseFloat(value) || 0;
      updatedItems[index].pendingQuantity = Math.max(0, orderedQty - dispatchQty);
      
      // Auto-calculate proportional weight based on dispatch quantity
      const weightPerUnit = updatedItems[index].weightPerUnit || 0;
      updatedItems[index].weight = dispatchQty * weightPerUnit;
    }

    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const handleAddSO = () => {
    setShowNewSOModal(true);
  };

  const handleSOCreated = async (newSO) => {
    setShowNewSOModal(false);
    
    if (newSO && newSO._id) {
      // Clear any previous errors
      setError('');
      
      // Show success notification
      const successMsg = `✅ Sales Order ${newSO.soNumber || 'created'} successfully! Auto-selecting...`;
      setSuccessMessage(successMsg);
      
      // Reload SOs and auto-select the new one
      await loadSalesOrders();
      
      // Small delay to ensure SO is in the list, then auto-select
      setTimeout(() => {
        handleSOSelection(newSO._id);
        // Clear success message after selection
        setTimeout(() => setSuccessMessage(''), 3000);
      }, 300);
    }
  };

  const validateForm = () => {
    if (!formData.salesOrder) {
      setError('Please select a sales order');
      return false;
    }
    if (!formData.warehouseLocation) {
      setError('Please enter warehouse location');
      return false;
    }
    if (!formData.items || formData.items.length === 0) {
      setError('No items to dispatch');
      return false;
    }

    // Filter items that have remaining quantity to dispatch
    const itemsToDispatch = formData.items.filter(item => {
      const dispatchedQty = item.previouslyDispatched || 0;
      const maxDispatch = item.orderedQuantity - dispatchedQty;
      return maxDispatch > 0;
    });

    if (itemsToDispatch.length === 0) {
      setError('All items are already fully dispatched. No items remaining to dispatch.');
      return false;
    }

    for (let i = 0; i < itemsToDispatch.length; i++) {
      const item = itemsToDispatch[i];
      const dispatchQty = parseFloat(item.dispatchQuantity) || 0;
      const dispatchedQty = item.previouslyDispatched || 0;
      const maxDispatch = item.orderedQuantity - dispatchedQty;

      if (dispatchQty <= 0) {
        setError(`Please enter dispatch quantity for ${item.productName}`);
        return false;
      }
      if (dispatchQty > maxDispatch) {
        setError(`Dispatch quantity for ${item.productName} cannot exceed remaining quantity (${maxDispatch} ${item.unit})`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Prepare challan data - only include items with remaining quantity
      const itemsToDispatch = formData.items.filter(item => {
        const dispatchedQty = item.previouslyDispatched || 0;
        const maxDispatch = item.orderedQuantity - dispatchedQty;
        return maxDispatch > 0 && parseFloat(item.dispatchQuantity || 0) > 0;
      });

      const challanData = {
        salesOrder: formData.salesOrder,
        warehouseLocation: formData.warehouseLocation,
        items: itemsToDispatch.map((item, idx) => {
          const itemData = {
            salesOrderItem: item.salesOrderItem,
            product: item.product,
            productName: item.productName || '',
            productCode: item.productCode || '',
            orderedQuantity: parseFloat(item.orderedQuantity) || 0,
            dispatchQuantity: parseFloat(item.dispatchQuantity) || 0,
            unit: item.unit || '',
            weight: parseFloat(item.weight) || 0,
            markAsComplete: item.markAsComplete || false
          };
          console.log(`Item ${idx}:`, itemData);
          return itemData;
        }),
        notes: formData.notes || '',
        createdBy: 'Admin'
      };

      // Only include expectedDeliveryDate if it has a value
      if (formData.expectedDeliveryDate) {
        challanData.expectedDeliveryDate = formData.expectedDeliveryDate;
      }

      console.log('=== Submitting Challan Data ===');
      console.log('Sales Order:', challanData.salesOrder);
      console.log('Warehouse:', challanData.warehouseLocation);
      console.log('Items Count:', challanData.items.length);
      console.log('Full Data:', JSON.stringify(challanData, null, 2));
      
      await onSubmit(challanData);
      
      // Reset form
      setFormData({
        salesOrder: '',
        expectedDeliveryDate: '',
        warehouseLocation: '',
        items: [],
        notes: ''
      });
      setSelectedSO(null);
    } catch (err) {
      setError(err.message || 'Failed to create challan');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Create Sales Challan</h2>
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
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-800 text-sm">{successMessage}</p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sales Order Selection with Add Button */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Sales Order *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSO}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    + Add SO
                  </button>
                </div>
                <div className="relative">
                  <select
                    value={formData.salesOrder}
                    onChange={(e) => handleSOSelection(e.target.value)}
                    required
                    disabled={loadingSOs || loadingSODetails}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {loadingSOs ? 'Loading sales orders...' : 
                       salesOrders.length === 0 ? 'No sales orders available - Click + Add SO' :
                       'Select Sales Order'}
                    </option>
                    {salesOrders.map(so => (
                      <option key={so._id} value={so._id}>
                        {so.soNumber} - {so.customer?.companyName || 'Unknown Customer'}
                      </option>
                    ))}
                  </select>
                  {loadingSODetails && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                    </div>
                  )}
                </div>
                {/* Debug Info */}
                {!loadingSOs && salesOrders.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    ⚠️ No sales orders found. Click "+ Add SO" to create one.
                  </p>
                )}
                {!loadingSOs && salesOrders.length > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ {salesOrders.length} sales order(s) available
                  </p>
                )}
              </div>

              {/* Expected Delivery Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  value={formData.expectedDeliveryDate}
                  onChange={(e) => handleInputChange('expectedDeliveryDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Loading SO Details */}
          {loadingSODetails && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-800">Loading sales order details...</span>
              </div>
            </div>
          )}

          {/* Selected SO Details */}
          {!loadingSODetails && selectedSO && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Selected Order Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
                <div>
                  <span className="font-medium">Customer:</span> {selectedSO.customer?.companyName || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Order Date:</span> {new Date(selectedSO.createdAt).toLocaleDateString('en-IN')}
                </div>
                <div>
                  <span className="font-medium">Category:</span> {selectedSO.category?.categoryName || 'N/A'}
                </div>
              </div>
            </div>
          )}

          {/* Warehouse Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Dispatch Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warehouse Location *
                </label>
                <select
                  value={formData.warehouseLocation}
                  onChange={(e) => handleInputChange('warehouseLocation', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select Warehouse Location</option>
                  {WAREHOUSE_LOCATIONS.map(warehouse => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select the warehouse location where goods will be dispatched from
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dispatch Notes
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Special dispatch instructions (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Items to Dispatch - GRN Style */}
          {!loadingSODetails && formData.items && formData.items.length > 0 && (() => {
            // Filter out fully dispatched items
            const itemsToDispatch = formData.items.filter(item => {
              const dispatchedQty = item.previouslyDispatched || 0;
              const maxDispatch = item.orderedQuantity - dispatchedQty;
              return maxDispatch > 0; // Only show items with remaining quantity
            });

            return itemsToDispatch.length > 0 ? (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Items to Dispatch
                </h3>
                
                {/* Table Header */}
                <div className="bg-gray-50 border border-gray-200 rounded-t-lg px-4 py-2">
                  <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-600 uppercase">
                    <div className="col-span-2">Product</div>
                    <div className="col-span-2">Warehouse</div>
                    <div className="col-span-2 text-center">Ordered</div>
                    <div className="col-span-1 text-center">Prev. Disp.</div>
                    <div className="col-span-2 text-center">Dispatching Now *</div>
                    <div className="col-span-2 text-center">Pending</div>
                    <div className="col-span-1 text-center">Complete</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="border-l border-r border-b border-gray-200 rounded-b-lg">
                  {itemsToDispatch.map((item, index) => {
                    const dispatchedQty = item.previouslyDispatched || 0;
                    const maxDispatch = item.orderedQuantity - dispatchedQty;
                    const currentDispatch = parseFloat(item.dispatchQuantity || 0);
                    const totalAfterThis = dispatchedQty + currentDispatch;
                    const progress = ((totalAfterThis) / item.orderedQuantity * 100).toFixed(0);
                  
                  return (
                    <div key={index} className="px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Product */}
                        <div className="col-span-2">
                          <div className="font-medium text-gray-900 text-sm">{item.productName}</div>
                          {item.notes && (
                            <div className="text-xs text-blue-600 italic mt-1 bg-blue-50 px-2 py-1 rounded inline-block">
                              📝 {item.notes}
                            </div>
                          )}
                        </div>

                        {/* Warehouse */}
                        <div className="col-span-2">
                          {item.warehouses && item.warehouses.length > 0 ? (
                            <div className="text-xs space-y-1">
                              {item.warehouses.map((whData, idx) => (
                                <div key={idx} className="flex flex-col">
                                  <div className="flex items-center text-purple-600 font-medium">
                                    <span className="mr-1">📍</span>
                                    <span>{getWarehouseName(whData.warehouse)}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 ml-4">
                                    Stock: {whData.availableQuantity} {item.unit}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400">No stock</div>
                          )}
                        </div>

                        {/* Ordered */}
                        <div className="col-span-2 text-center">
                          <div className="text-sm font-medium text-gray-900">{item.orderedQuantity} {item.unit}</div>
                          <div className="text-xs text-gray-500">{item.weight} kg</div>
                        </div>

                        {/* Previously Dispatched */}
                        <div className="col-span-1 text-center">
                          <div className="text-sm font-medium text-blue-600">{dispatchedQty}</div>
                          <div className="text-xs text-gray-500">Max: {maxDispatch}</div>
                        </div>

                        {/* Dispatching Now */}
                        <div className="col-span-2">
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <input
                                type="number"
                                value={item.dispatchQuantity}
                                onChange={(e) => handleItemChange(index, 'dispatchQuantity', e.target.value)}
                                required
                                min="0.01"
                                max={maxDispatch}
                                step="0.01"
                                className="w-full px-2 py-1.5 pr-12 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                placeholder="0"
                              />
                              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
                                {item.unit}
                              </span>
                            </div>
                          </div>
                          {/* Weight Input */}
                          <div className="relative mt-1">
                            <input
                              type="number"
                              value={item.weight}
                              onChange={(e) => handleItemChange(index, 'weight', e.target.value)}
                              min="0"
                              step="0.01"
                              className="w-full px-2 py-1.5 pr-8 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                              placeholder="Weight"
                            />
                            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
                              kg
                            </span>
                          </div>
                        </div>

                        {/* Pending */}
                        <div className="col-span-2 text-center">
                          <div className="text-sm font-medium text-orange-600">
                            {(item.orderedQuantity - dispatchedQty - parseFloat(item.dispatchQuantity || 0)).toFixed(2)} {item.unit}
                          </div>
                          <div className="text-xs text-gray-500">
                            {((item.orderedQuantity - dispatchedQty - parseFloat(item.dispatchQuantity || 0)) * (item.weight / item.orderedQuantity)).toFixed(2)} kg
                          </div>
                        </div>

                        {/* Mark Complete Checkbox */}
                        <div className="col-span-1 flex flex-col items-center justify-center gap-1">
                          <input
                            type="checkbox"
                            checked={item.markAsComplete || false}
                            onChange={(e) => {
                              const updatedItems = [...formData.items];
                              updatedItems[index].markAsComplete = e.target.checked;
                              setFormData(prev => ({ ...prev, items: updatedItems }));
                            }}
                            disabled={maxDispatch <= 0}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            title={maxDispatch <= 0 ? 'Already fully dispatched' : 'Mark this item as complete even if quantity doesn\'t match (e.g., due to losses)'}
                          />
                          {item.markAsComplete && (
                            <span className="text-xs text-green-600 font-medium">Final</span>
                          )}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  ✅ All items in this Sales Order have been fully dispatched. No items remaining to dispatch.
                </p>
              </div>
            );
          })()}

          {/* No Items Message */}
          {!loadingSODetails && formData.salesOrder && (!formData.items || formData.items.length === 0) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                No items found in this sales order. Please select a different order or add items to the selected order.
              </p>
            </div>
          )}


          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.salesOrder || formData.items.length === 0}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Challan'}
            </button>
          </div>
        </form>
      </div>

      {/* Sales Order Modal */}
      {showNewSOModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <NewSalesOrderModal
              isOpen={showNewSOModal}
              onClose={() => setShowNewSOModal(false)}
              onSubmit={handleSOCreated}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateChallanModal;
