import React, { useState, useEffect, useCallback } from 'react';
import { FileText, X, FileCheck, Calendar, MapPin, Package, Truck, CheckCircle2, Info, StickyNote } from 'lucide-react';
import { salesOrderAPI } from '../../services/salesOrderAPI';
import { salesChallanAPI } from '../../services/salesChallanAPI';
import { inventoryAPI } from '../../services/inventoryAPI';
import { apiRequest } from '../../services/common';
import NewSalesOrderModal from '../SalesOrders/NewSalesOrderModal';
import SearchableSelect from '../common/SearchableSelect';
import { usePaginatedSearch } from '../../hooks/usePaginatedSearch';

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
  const [dispatchedQuantities, setDispatchedQuantities] = useState({});
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
      setDispatchedQuantities({});
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
          
          // Use sub-product ordered weights if available, otherwise fall back to total SO weight
          const orderedWeights = Array.isArray(item.subProductWeights) ? item.subProductWeights : [];
          const totalWeight = orderedWeights.length > 0
            ? orderedWeights.reduce((sum, w) => sum + (Number(w) || 0), 0)
            : (item.weight || 0);
          const totalQuantity = item.quantity || 1;
          const weightPerUnit = parseFloat((totalWeight / totalQuantity).toFixed(4));
          const remainingWeight = parseFloat((remaining * weightPerUnit).toFixed(2));
          const remainingWeights = orderedWeights.slice(0, remaining);
          
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

        // Fetch warehouse locations for each product/sub-product from inventory lots
        const itemsWithStock = items.filter(item => item.product);
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
        item.subProductWeights = orderedWeights.slice(0, dispatchQty);
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

  const handleSubProductWeightsChange = (index, weights) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      subProductWeights: weights,
      weight: weights.reduce((sum, w) => sum + (Number(w) || 0), 0)
    };
    setFormData(prev => ({ ...prev, items: updatedItems }));
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
    <div className="fixed top-16 left-64 right-0 bottom-0 z-40 flex flex-col bg-white shadow-2xl overflow-hidden">
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
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-lg p-4 border border-teal-100">
            <div className="flex items-center mb-3 gap-2">
              <FileText className="h-4 w-4 text-teal-600" />
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Sales Order Selection</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sales Order Selection with SearchableSelect */}
              <div>
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
                  renderOption={(so, isSelected) => (
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{so.soNumber}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          so.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          so.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          so.status === 'Partial' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {so.status}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">{so.customer?.companyName || 'Unknown Customer'}</span>
                      {so.category?.categoryName && (
                        <span className="text-xs text-teal-600">{so.category.categoryName}</span>
                      )}
                    </div>
                  )}
                />
                {!loadingSOs && salesOrders.length > 0 && !formData.salesOrder && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {salesOrders.length} orders available — search to filter
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
          </div>

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
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center mb-3 gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wide">Selected Order Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Customer</span>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{selectedSO.customer?.companyName || 'N/A'}</p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Order Date</span>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{new Date(selectedSO.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category</span>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{selectedSO.category?.categoryName || 'N/A'}</p>
                </div>
              </div>
            </div>
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
              .filter(item => {
                const dispatchedQty = item.previouslyDispatched || 0;
                const maxDispatch = item.orderedQuantity - dispatchedQty;
                return maxDispatch > 0; // Only show items with remaining quantity
              });

            return itemsToDispatch.length > 0 ? (
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-100">
                <div className="flex items-center mb-3 gap-2">
                  <Package className="h-4 w-4 text-orange-600" />
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Items to Dispatch</h3>
                  <span className="ml-1 bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                    {itemsToDispatch.length}
                  </span>
                </div>
                
                {/* Table Header */}
                <div className="bg-gray-50 border border-gray-200 rounded-t-lg px-4 py-2">
                  <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    <div className="col-span-3">Product</div>
                    <div className="col-span-2 text-center">Ordered</div>
                    <div className="col-span-4 text-center">Dispatch Qty / Weight</div>
                    <div className="col-span-3 text-center">Mark Final</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="border-l border-r border-b border-gray-200 rounded-b-lg">
                  {getProductGroups(itemsToDispatch).map((group, groupIndex) => (
                    <div key={groupIndex}>
                      {/* Product header */}
                      <div className="px-4 py-2 bg-blue-100 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{group.productName}</span>
                          {group.productCode && (
                            <span className="text-xs text-gray-500">({group.productCode})</span>
                          )}
                          <span className="text-xs text-blue-700 font-medium">Unit: {group.unit}</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {group.items.length} {group.items.length === 1 ? 'variant' : 'variants'}
                        </span>
                      </div>
                      {group.items.map((item, rowIndex) => {
                        const originalIndex = item.originalIndex;
                        const dispatchedQty = item.previouslyDispatched || 0;
                        const maxDispatch = item.orderedQuantity - dispatchedQty;
                        const currentDispatch = parseFloat(item.dispatchQuantity || 0);
                        const totalAfterThis = dispatchedQty + currentDispatch;
                        const progress = ((totalAfterThis) / item.orderedQuantity * 100).toFixed(0);

                        return (
                          <div key={originalIndex} className="px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                            <div className="grid grid-cols-12 gap-4 items-center">
                              {/* Product / Sub Product */}
                              <div className="col-span-3">
                                {item.subProductName ? (
                                  <div className="text-sm font-semibold text-green-700">{item.productName} X {item.subProductName}</div>
                                ) : (
                                  <div className="text-xs text-gray-400">—</div>
                                )}
                                {item.notes && (
                                  <div className="text-xs text-blue-600 italic mt-1 flex items-center gap-1">
                                    <StickyNote className="w-3 h-3" /> {item.notes}
                                  </div>
                                )}
                                {dispatchedQty > 0 && (
                                  <div className="text-xs text-gray-400 mt-1">Dispatched: {dispatchedQty} · Remaining: {maxDispatch}</div>
                                )}
                              </div>

                              {/* Ordered */}
                              <div className="col-span-2 text-center">
                                <div className="text-sm font-medium text-gray-900">{item.orderedQuantity} {item.unit}</div>
                                <div className="text-xs text-gray-500">{parseFloat(item.totalSOWeight || item.weight || 0).toFixed(2)} kg</div>
                              </div>

                              {/* Dispatching Now */}
                              <div className="col-span-4">
                                <div className="relative">
                                  <input
                                    type="number"
                                    value={item.dispatchQuantity}
                                    onChange={(e) => handleItemChange(originalIndex, 'dispatchQuantity', e.target.value)}
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
                                {/* Weight */}
                                <div className="relative mt-1">
                                  <input
                                    type="number"
                                    value={parseFloat(item.weight || 0).toFixed(2)}
                                    onChange={(e) => handleItemChange(originalIndex, 'weight', e.target.value)}
                                    min="0"
                                    step="0.01"
                                    className={`w-full px-2 py-1.5 pr-8 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 ${item.subProduct ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    placeholder="Weight"
                                    disabled={!!item.subProduct}
                                    readOnly={!!item.subProduct}
                                  />
                                  <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 pointer-events-none">kg</span>
                                  {item.subProduct && (
                                    <span className="text-xs text-green-600 block mt-0.5">Auto-calculated</span>
                                  )}
                                </div>
                              </div>

                              {/* Mark Complete Checkbox */}
                              <div className="col-span-3 flex flex-col items-center justify-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={item.markAsComplete || false}
                                  onChange={(e) => {
                                    const updatedItems = [...formData.items];
                                    updatedItems[originalIndex].markAsComplete = e.target.checked;
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

                            {/* Per-unit weight chips for sub-products — read-only, from inventory FIFO */}
                            {item.subProduct && Array.isArray(item.subProductWeights) && item.subProductWeights.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500 mb-1 font-medium">{item.subProductWeights.length} weight(s)</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {item.subProductWeights.map((w, wi) => (
                                    <span key={wi} className="px-2 py-0.5 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 rounded">
                                      #{wi + 1}: {Number(w) % 1 === 0 ? Number(w) : Number(w).toFixed(2)} kg
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  All items in this Sales Order have been fully dispatched. No items remaining to dispatch.
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
