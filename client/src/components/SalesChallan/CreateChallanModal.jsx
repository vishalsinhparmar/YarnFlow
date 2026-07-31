import React, { useState, useEffect, useCallback } from 'react';
import { FileText, X, FileCheck, Calendar, MapPin, Package, Truck, CheckCircle2, Info, StickyNote } from 'lucide-react';
import { salesOrderAPI } from '../../services/salesOrderAPI';
import { salesChallanAPI } from '../../services/salesChallanAPI';
import { apiRequest } from '../../services/common';
import NewSalesOrderModal from '../SalesOrders/NewSalesOrderModal';
import SearchableSelect from '../common/SearchableSelect';
import { usePaginatedSearch } from '../../hooks/usePaginatedSearch';

const isItemDispatchable = (item) => {
  const dispatchedQuantity = Number(item.previouslyDispatched) || 0;
  return !item.manuallyCompleted && item.orderedQuantity - dispatchedQuantity > 0;
};

const CreateChallanModal = ({ isOpen, onClose, onSubmit, preSelectedOrderId = null }) => {
  const [formData, setFormData] = useState({
    salesOrder: '',
    expectedDeliveryDate: '',
    warehouseLocation: '',
    items: [],
    notes: ''
  });

  const [selectedSO, setSelectedSO] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSODetails, setLoadingSODetails] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showNewSOModal, setShowNewSOModal] = useState(false);
  const [detectedWarehouse, setDetectedWarehouse] = useState('');

  // Paginated sales orders with client-side status filter
  const fetchSalesOrders = useCallback(async (params) => {
    const response = await salesOrderAPI.getAll(params);
    if (response.success && response.data) {
      const availableOrders = response.data.filter(so =>
        !['Delivered', 'Cancelled'].includes(so.status)
      );
      return { ...response, data: availableOrders };
    }
    return response;
  }, []);

  const {
    items: salesOrders,
    setItems: setSalesOrders,
    loading: loadingSOs,
    loadingMore: loadingMoreSOs,
    hasMore: hasMoreSOs,
    total: totalSOs,
    handleSearch: handleSOSearch,
    handleLoadMore: loadMoreSOs,
    refresh: refreshSOs
  } = usePaginatedSearch(fetchSalesOrders, { limit: 50, extraParams: { sortBy: 'createdAt', sortOrder: 'desc' } });

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
      setDetectedWarehouse('');
    }
  }, [isOpen]);

  // Handle pre-selected SO (separate effect to avoid race conditions)
  useEffect(() => {
    if (isOpen && preSelectedOrderId && salesOrders.length > 0) {
      console.log('Pre-selecting SO:', preSelectedOrderId);
      handleSOSelection(preSelectedOrderId);
    }
  }, [isOpen, preSelectedOrderId, salesOrders]);

  // Show message when no sales orders are available after loading
  // Only trigger after we have received a real response (totalSOs is not null)
  useEffect(() => {
    if (isOpen && !loadingSOs && totalSOs === 0 && salesOrders.length === 0 && !formData.salesOrder) {
      setError('No sales orders available. Please create a sales order first.');
    } else if (salesOrders.length > 0) {
      setError(prev => prev === 'No sales orders available. Please create a sales order first.' ? '' : prev);
    }
  }, [isOpen, loadingSOs, totalSOs, salesOrders.length, formData.salesOrder]);

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
        const dispatchStateMap = {};
        if (dispatchedResponse.success && dispatchedResponse.data) {
          dispatchedResponse.data.forEach(item => {
            dispatchStateMap[item.salesOrderItem] = {
              totalDispatched: item.totalDispatched,
              manuallyCompleted: item.manuallyCompleted === true
            };
          });
        }
        console.log('Dispatch states:', dispatchStateMap);
        
        // Auto-populate form from SO
        const items = so.items?.map(item => {
          const dispatchState = dispatchStateMap[item._id] || {};
          const dispatched = dispatchState.totalDispatched || 0;
          const manuallyCompleted = item.manuallyCompleted === true || dispatchState.manuallyCompleted === true;
          const remaining = Math.max(0, (item.quantity || 0) - dispatched);
          
          // Use sub-product ordered weights if available, otherwise fall back to total SO weight
          const orderedWeights = Array.isArray(item.subProductWeights) ? item.subProductWeights : [];
          const totalWeight = orderedWeights.length > 0
            ? orderedWeights.reduce((sum, w) => sum + (Number(w) || 0), 0)
            : (item.weight || 0);
          const totalQuantity = item.quantity || 1;
          const weightPerUnit = parseFloat((totalWeight / totalQuantity).toFixed(4));
          const remainingWeight = parseFloat((remaining * weightPerUnit).toFixed(2));
          const remainingWeights = orderedWeights.slice(
            Math.floor(dispatched),
            Math.floor(dispatched + remaining)
          );
          
          return {
            salesOrderItem: item._id,
            product: item.product?._id || item.product,
            productName: item.product?.productName || item.productName || '',
            productCode: item.product?.productCode || item.productCode || '',
            subProduct: item.subProduct?._id || item.subProduct || null,
            subProductName: item.subProductName || null,
            subProductWeights: remainingWeights,
            orderedSubProductWeights: orderedWeights,
            orderedQuantity: item.quantity || 0,
            dispatchQuantity: remaining, // Default to remaining quantity
            previouslyDispatched: dispatched,
            pendingQuantity: 0,
            unit: item.unit || '',
            weight: remainingWeight, // Proportional weight for remaining quantity
            totalSOWeight: totalWeight, // Store total SO weight for reference
            weightPerUnit: weightPerUnit, // Store weight per unit for calculations
            manuallyCompleted,
            markAsComplete: false,
            notes: item.notes || ''  // Include notes from Sales Order item
          };
        }) || [];

        console.log('Items mapped:', items);

        // Check if every item was fully dispatched or explicitly finalized.
        const allFullyDispatched = items.every(item => !isItemDispatchable(item));
        
        if (allFullyDispatched) {
          setError('⚠️ This Sales Order is already complete. No items remain to dispatch.');
        }

        // Fetch warehouse locations for each product/sub-product from inventory lots
        const itemsWithStock = items.filter(item => item.product && isItemDispatchable(item));
        if (itemsWithStock.length > 0) {
          try {
            // Fetch inventory lots for each product/sub-product
            const lotsPromises = itemsWithStock.map(item =>
              apiRequest(`/inventory/lots?product=${item.product}${item.subProduct ? `&subProduct=${item.subProduct}` : ''}&status=Active`)
            );
            
            const lotsResponses = await Promise.all(lotsPromises);
            
            // Map product/sub-product to warehouse locations with quantities
            const productWarehouseMap = {};
            lotsResponses.forEach((response, index) => {
              const item = itemsWithStock[index];
              const key = item.subProduct || item.product;
              if (response.success && response.data) {
                productWarehouseMap[key] = [];
                
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
                productWarehouseMap[key] = Object.values(warehouseStockMap);
              }
            });
            
            // Add warehouse info to items
            const itemsWithWarehouses = items.map(item => ({
              ...item,
              warehouses: productWarehouseMap[item.subProduct || item.product] || []
            }));
            
            console.log('📦 Warehouse data for products:', productWarehouseMap);
            
            // Auto-select warehouse if all products are in the same single warehouse
            const allWarehouses = itemsWithWarehouses.flatMap(item => 
              item.warehouses.map(wh => wh.warehouse)
            );
            const uniqueWarehouses = [...new Set(allWarehouses)];
            
            // Collect all unique warehouse names detected from lots
            const warehouseDisplay = uniqueWarehouses.filter(Boolean).join(', ') || '';
            setDetectedWarehouse(warehouseDisplay);
            
            // Update form data with auto-detected warehouse
            setFormData(prev => ({
              ...prev,
              salesOrder: soId,
              expectedDeliveryDate: so.expectedDeliveryDate ? 
                new Date(so.expectedDeliveryDate).toISOString().split('T')[0] : '',
              warehouseLocation: warehouseDisplay,
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
    const item = { ...updatedItems[index] };
    item[field] = value;

    // Calculate pending quantity and weight when dispatch quantity changes
    if (field === 'dispatchQuantity') {
      const orderedQty = item.orderedQuantity || 0;
      const dispatchQty = parseFloat(value) || 0;
      item.pendingQuantity = Math.max(0, orderedQty - dispatchQty);
      
      if (item.subProduct) {
        const orderedWeights = item.orderedSubProductWeights || [];
        const startIndex = Math.floor(item.previouslyDispatched || 0);
        item.subProductWeights = orderedWeights.slice(
          startIndex,
          startIndex + Math.floor(dispatchQty)
        );
        item.weight = item.subProductWeights.reduce((sum, w) => sum + (Number(w) || 0), 0);
      } else {
        // Auto-calculate proportional weight based on dispatch quantity
        const weightPerUnit = item.weightPerUnit || 0;
        item.weight = parseFloat((dispatchQty * weightPerUnit).toFixed(2));
      }
    }

    // When total weight is manually edited, update the item weight (and sub-product weights if applicable)
    if (field === 'weight') {
      const total = parseFloat(value) || 0;
      item.weight = total;
      if (item.subProduct) {
        const qty = Math.max(1, parseFloat(item.dispatchQuantity) || 1);
        item.subProductWeights = Array.from({ length: Math.floor(qty) }, () => total / qty);
      }
    }

    updatedItems[index] = item;
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  // Group dispatch items by product so multiple sub-product rows render under one product header
  const getProductGroups = (items) => {
    const groups = [];
    const seen = new Map();
    items.forEach((item, index) => {
      const key = item.product || `__empty__${index}`;
      if (!seen.has(key)) {
        seen.set(key, {
          product: item.product,
          productName: item.productName,
          productCode: item.productCode,
          unit: item.unit,
          indices: [],
          items: []
        });
        groups.push(seen.get(key));
      }
      seen.get(key).indices.push(index);
      seen.get(key).items.push(item);
    });
    return groups;
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
      
      // Optimistically add the new SO and refresh the list
      setSalesOrders(prev => [newSO, ...prev]);
      await refreshSOs();

      // Auto-select the new SO
      handleSOSelection(newSO._id);
      // Clear success message after selection
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const validateForm = () => {
    if (!formData.salesOrder) {
      setError('Please select a sales order');
      return false;
    }
    // Warehouse is auto-derived server-side from the inventory lot(s) fulfilling this
    // order — no longer a required manual field. Users may still override it below.
    if (!formData.items || formData.items.length === 0) {
      setError('No items to dispatch');
      return false;
    }

    // Filter items that have remaining quantity to dispatch
    const itemsToDispatch = formData.items.filter(isItemDispatchable);

    if (itemsToDispatch.length === 0) {
      setError('All items are already completed. No items remain to dispatch.');
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
      if (item.subProduct && !Number.isInteger(dispatchQty)) {
        setError(`Dispatch quantity for ${item.productName} must be a whole number`);
        return false;
      }

      // Weight validation is handled by the backend which checks actual inventory lot weights.
      // Frontend averaging (totalWeight / qty) is imprecise for non-divisible bag weights
      // and is not needed here — the backend is the single source of truth.
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
      const itemsToDispatch = formData.items.filter(
        item => isItemDispatchable(item) && parseFloat(item.dispatchQuantity || 0) > 0
      );

      const challanData = {
        salesOrder: formData.salesOrder,
        warehouseLocation: formData.warehouseLocation,
        items: itemsToDispatch.map((item, idx) => {
          const itemData = {
            salesOrderItem: item.salesOrderItem,
            product: item.product,
            productName: item.productName || '',
            productCode: item.productCode || '',
            subProduct: item.subProduct || null,
            subProductName: item.subProductName || null,
            subProductWeights: Array.isArray(item.subProductWeights) ? item.subProductWeights : [],
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
    <div className="fixed bottom-0 left-0 right-0 top-16 z-40 flex flex-col overflow-hidden bg-white shadow-2xl transition-[left] duration-200 lg:left-[var(--sidebar-width)]">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="relative mx-auto mb-4 w-16 h-16">
                <div className="w-16 h-16 rounded-full border-4 border-teal-100"></div>
                <div className="w-16 h-16 rounded-full border-4 border-teal-600 border-t-transparent animate-spin absolute inset-0"></div>
              </div>
              <p className="text-lg font-semibold text-gray-700">Creating Sales Challan...</p>
              <p className="text-sm text-gray-500 mt-2">Please wait</p>
            </div>
          </div>
        )}

        {/* Header — sticky */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Create Sales Challan</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all disabled:opacity-50"
          >
            <span className="sr-only">Close</span>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {successMessage && (
            <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <p className="text-green-800 font-medium">{successMessage}</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-red-800">Error</h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Sales Order Selection */}
          <section className="overflow-visible rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-gray-900">Sales order</h3>
                  <p className="text-xs text-gray-500">Source document for this delivery challan</p>
                </div>
              </div>
              {!loadingSOs && totalSOs !== null && (
                <p className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-900">{totalSOs}</span> available
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:px-5 md:grid-cols-[minmax(0,1fr)_15rem]">
              {/* Sales Order Selection with SearchableSelect */}
              <div className="min-w-0">
                <SearchableSelect
                  label="Sales Order"
                  required
                  options={salesOrders}
                  value={formData.salesOrder}
                  onChange={(value) => handleSOSelection(value)}
                  placeholder={loadingSOs ? 'Loading sales orders...' : 'Select Sales Order'}
                  searchPlaceholder="Search by SO number or customer..."
                  getOptionLabel={(so) => `${so.soNumber} - ${so.customer?.companyName || 'Unknown Customer'}`}
                  getOptionValue={(so) => so._id}
                  onSearch={handleSOSearch}
                  loading={loadingSOs || loadingSODetails}
                  loadingMore={loadingMoreSOs}
                  hasMore={hasMoreSOs}
                  onLoadMore={loadMoreSOs}
                  total={totalSOs}
                  disabled={loadingSODetails}
                  onAddNew={handleAddSO}
                  addNewLabel="Add SO"
                  renderValue={(so) => (
                    <div className="flex min-w-0 items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{so.soNumber}</p>
                        <p className="truncate text-xs text-gray-500">
                          {so.customer?.companyName || 'Unknown Customer'}
                        </p>
                      </div>
                      <span className="hidden flex-shrink-0 text-xs font-medium text-teal-700 sm:inline">
                        {so.status || 'Pending'}
                      </span>
                    </div>
                  )}
                  renderOption={(so, isSelected) => (
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
                          <span className="truncate font-semibold text-gray-900">{so.soNumber}</span>
                          <span className={`flex-shrink-0 text-xs font-medium ${
                            so.status === 'In Progress' ? 'text-blue-700' :
                            so.status === 'Partial' ? 'text-orange-700' :
                            so.status === 'Pending' ? 'text-amber-700' :
                            'text-gray-600'
                          }`}>
                            {so.status || 'Pending'}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-sm text-gray-600">
                          {so.customer?.companyName || 'Unknown Customer'}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                          {so.category?.categoryName && <span>{so.category.categoryName}</span>}
                          {isSelected && <span className="font-medium text-blue-700">Selected</span>}
                        </div>
                      </div>
                    </div>
                  )}
                />
                {!loadingSOs && salesOrders.length > 0 && !formData.salesOrder && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Search by SO number or customer
                  </p>
                )}
              </div>

              {/* Expected Delivery Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-gray-500" />
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  value={formData.expectedDeliveryDate}
                  onChange={(e) => handleInputChange('expectedDeliveryDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white hover:border-teal-400 transition-all"
                />
              </div>
            </div>
          </section>

          {/* Loading SO Details */}
          {loadingSODetails && (
            <div className="bg-teal-50 rounded-lg p-3 border border-teal-200">
              <div className="flex items-center justify-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600"></div>
                <span className="text-sm font-medium text-teal-800">Loading sales order details...</span>
              </div>
            </div>
          )}

          {/* Selected SO Details */}
          {!loadingSODetails && selectedSO && (
            <section className="overflow-hidden rounded-lg border border-blue-200 bg-white">
              <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50 px-4 py-2.5">
                <Info className="h-4 w-4 text-blue-700" />
                <h3 className="text-sm font-semibold text-blue-900">Selected order details</h3>
              </div>
              <dl className="grid grid-cols-1 divide-y divide-gray-200 md:grid-cols-3 md:divide-x md:divide-y-0">
                <div className="px-4 py-3">
                  <dt className="text-xs font-medium uppercase text-gray-500">Customer</dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-900">{selectedSO.customer?.companyName || 'N/A'}</dd>
                </div>
                <div className="px-4 py-3">
                  <dt className="text-xs font-medium uppercase text-gray-500">Order date</dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-900">{new Date(selectedSO.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</dd>
                </div>
                <div className="px-4 py-3">
                  <dt className="text-xs font-medium uppercase text-gray-500">Category</dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-900">{selectedSO.category?.categoryName || 'N/A'}</dd>
                </div>
              </dl>
            </section>
          )}

          {/* Dispatch Information */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-center mb-3 gap-2">
              <Truck className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Dispatch Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-gray-500" />
                  Warehouse Location
                </label>
                {detectedWarehouse ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                    <MapPin className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-semibold text-green-800">{detectedWarehouse}</span>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-400 italic">
                    {formData.salesOrder ? 'Detecting from inventory…' : 'Select a Sales Order to detect warehouse'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <StickyNote className="h-3 w-3 text-gray-500" />
                  Dispatch Notes
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Special dispatch instructions (optional)"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white hover:border-purple-400 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Items to Dispatch */}
          {!loadingSODetails && formData.items && formData.items.length > 0 && (() => {
            // Filter out fully dispatched items while preserving original formData index
            const itemsToDispatch = formData.items
              .map((item, originalIndex) => ({ ...item, originalIndex }))
              .filter(isItemDispatchable);

            return itemsToDispatch.length > 0 ? (
              <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-orange-50 text-orange-600">
                      <Package className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-gray-900">Items to dispatch</h3>
                      <p className="text-xs text-gray-500">Remaining sales order balance</p>
                    </div>
                  </div>
                </div>

                <div className="hidden grid-cols-12 gap-4 border-b border-gray-200 bg-white px-5 py-2.5 text-xs font-semibold uppercase text-gray-500 lg:grid">
                  <div className="col-span-3">Product / variant</div>
                  <div className="col-span-2">SO balance</div>
                  <div className="col-span-6">This dispatch</div>
                  <div className="col-span-1 text-center">Final</div>
                </div>

                <div className="divide-y divide-gray-200">
                  {getProductGroups(itemsToDispatch).map((group, groupIndex) => (
                    <div key={`${group.product || group.productName}-${groupIndex}`}>
                      <div className="flex flex-wrap items-center gap-2 border-b border-blue-100 bg-blue-50 px-4 py-2.5 sm:px-5">
                        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-semibold text-gray-900">{group.productName}</span>
                          {group.productCode && (
                            <span className="text-xs text-gray-500">{group.productCode}</span>
                          )}
                          <span className="text-xs font-medium text-blue-700">{group.unit}</span>
                        </div>
                      </div>

                      <div className="divide-y divide-gray-100">
                        {group.items.map((item) => {
                          const originalIndex = item.originalIndex;
                          const dispatchedQty = item.previouslyDispatched || 0;
                          const maxDispatch = item.orderedQuantity - dispatchedQty;

                          return (
                            <div key={originalIndex} className="px-4 py-4 transition-colors hover:bg-gray-50 sm:px-5">
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
                                      {item.subProductName && (
                                        <p className="mt-0.5 text-xs text-gray-500">Inventory variant</p>
                                      )}
                                    </div>
                                  </div>

                                  {item.notes && (
                                    <div className="mt-2 flex items-start gap-1.5 text-xs italic text-blue-700">
                                      <StickyNote className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                                      <span className="break-words">{item.notes}</span>
                                    </div>
                                  )}

                                  {dispatchedQty > 0 && (
                                    <p className="mt-2 text-xs text-gray-500">
                                      Previously dispatched: <span className="font-medium text-gray-700">{dispatchedQty} {item.unit}</span>
                                    </p>
                                  )}
                                </div>

                                <div className="lg:col-span-2">
                                  <p className="mb-1 text-xs font-semibold uppercase text-gray-500 lg:hidden">
                                    SO balance
                                  </p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {maxDispatch} {item.unit}
                                  </p>
                                </div>

                                <div className="min-w-0 lg:col-span-6">
                                  <p className="mb-2 text-xs font-semibold uppercase text-gray-500 lg:hidden">
                                    This dispatch
                                  </p>
                                  <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                                    <label className="min-w-0">
                                      <span className="mb-1 block text-xs font-medium text-gray-600">Quantity</span>
                                      <span className="flex min-w-0 items-center gap-2">
                                        <input
                                          type="number"
                                          aria-label={`Dispatch quantity for ${item.productName}${item.subProductName ? ` X ${item.subProductName}` : ''}`}
                                          value={item.dispatchQuantity}
                                          onChange={(e) => handleItemChange(originalIndex, 'dispatchQuantity', e.target.value)}
                                          required
                                          min={item.subProduct ? '1' : '0.01'}
                                          max={maxDispatch}
                                          step={item.subProduct ? '1' : '0.01'}
                                          inputMode={item.subProduct ? 'numeric' : 'decimal'}
                                          className="h-10 min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-900 shadow-sm outline-none transition-colors hover:border-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                                          placeholder="0"
                                        />
                                        <span className="flex-shrink-0 text-xs font-medium text-gray-500">{item.unit}</span>
                                      </span>
                                    </label>

                                    <label className="min-w-0">
                                      <span className="mb-1 block text-xs font-medium text-gray-600">Weight</span>
                                      <span className="flex min-w-0 items-center gap-2">
                                        <input
                                          type="number"
                                          aria-label={`Dispatch weight for ${item.productName}${item.subProductName ? ` X ${item.subProductName}` : ''}`}
                                          value={parseFloat(item.weight || 0).toFixed(2)}
                                          onChange={(e) => handleItemChange(originalIndex, 'weight', e.target.value)}
                                          min="0"
                                          step="0.01"
                                          className={`h-10 min-w-0 flex-1 rounded-md border border-gray-300 px-3 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 ${
                                            item.subProduct ? 'cursor-not-allowed bg-gray-100 text-gray-600' : 'bg-white hover:border-gray-400'
                                          }`}
                                          placeholder="Weight"
                                          disabled={!!item.subProduct}
                                          readOnly={!!item.subProduct}
                                        />
                                        <span className="flex-shrink-0 text-xs font-medium text-gray-500">kg</span>
                                      </span>
                                      {item.subProduct && (
                                        <span className="mt-1 block text-xs font-medium text-green-700">Auto-calculated</span>
                                      )}
                                    </label>
                                  </div>
                                </div>

                                <div className="lg:col-span-1">
                                  <p className="mb-2 text-xs font-semibold uppercase text-gray-500 lg:hidden">
                                    Final
                                  </p>
                                  <label className={`inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 transition-colors lg:w-10 lg:px-0 ${
                                    item.markAsComplete
                                      ? 'border-green-300 bg-green-50'
                                      : 'border-gray-200 bg-white hover:border-gray-300'
                                  } ${maxDispatch <= 0 ? 'cursor-not-allowed opacity-50' : ''}`}>
                                    <input
                                      type="checkbox"
                                      aria-label={`Mark ${item.productName}${item.subProductName ? ` X ${item.subProductName}` : ''} as final`}
                                      checked={item.markAsComplete || false}
                                      onChange={(e) => {
                                        const updatedItems = [...formData.items];
                                        updatedItems[originalIndex].markAsComplete = e.target.checked;
                                        setFormData(prev => ({ ...prev, items: updatedItems }));
                                      }}
                                      disabled={maxDispatch <= 0}
                                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                      title={maxDispatch <= 0 ? 'Already fully dispatched' : 'Mark this item as complete even if quantity doesn\'t match (e.g., due to losses)'}
                                    />
                                    <span className={`text-sm font-semibold lg:hidden ${
                                      item.markAsComplete ? 'text-green-800' : 'text-gray-700'
                                    }`}>
                                      {item.markAsComplete ? 'Marked final' : 'Mark final'}
                                    </span>
                                  </label>
                                </div>
                              </div>

                              {item.subProduct && Array.isArray(item.subProductWeights) && item.subProductWeights.length > 0 && (
                                <div className="mt-3 border-t border-gray-100 pt-3 lg:ml-[41.666667%] lg:mr-[8.333333%]">
                                  <p className="mb-2 text-xs font-medium text-gray-500">
                                    Exact bag weights ({item.subProductWeights.length})
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {item.subProductWeights.map((weight, weightIndex) => (
                                      <span
                                        key={weightIndex}
                                        className="rounded border border-green-200 bg-green-50 px-2 py-1 text-xs font-semibold text-green-700"
                                      >
                                        #{weightIndex + 1}: {Number(weight) % 1 === 0
                                          ? Number(weight)
                                          : Number(weight).toFixed(2)} kg
                                      </span>
                                    ))}
                                  </div>
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
            ) : (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                  <div>
                    <p className="text-sm font-semibold text-green-900">Sales order dispatch is complete</p>
                    <p className="mt-1 text-sm text-green-700">No items remain to dispatch.</p>
                  </div>
                </div>
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
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.salesOrder || formData.items.length === 0}
              className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Create Challan
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Sales Order Modal */}
      {showNewSOModal && (
        <NewSalesOrderModal
          isOpen={showNewSOModal}
          onClose={() => setShowNewSOModal(false)}
          onSubmit={handleSOCreated}
        />
      )}
    </div>
  );
};

export default CreateChallanModal;
