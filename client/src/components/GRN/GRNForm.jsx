import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { purchaseOrderAPI } from '../../services/purchaseOrderAPI';
import masterDataAPI from '../../services/masterDataAPI';
import PurchaseOrderForm from '../PurchaseOrders/PurchaseOrderForm';
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
    generalNotes: '',
    items: []
  });

  // Fetch purchase orders (all statuses for testing, you can change to 'Approved' later)
  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      try {
        setLoadingPOs(true);
        console.log('Fetching purchase orders...');
        // Fetch all POs and filter out completed ones
        const response = await purchaseOrderAPI.getAll({ limit: 100 });
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
        setErrors(prev => ({ ...prev, purchaseOrders: 'Failed to load purchase orders' }));
      } finally {
        setLoadingPOs(false);
      }
    };
    fetchPurchaseOrders();
  }, []);

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
                Purchase Order *
              </label>
              {!grn && (
                <button
                  type="button"
                  onClick={() => setShowPOModal(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <span className="text-lg">+</span> Add PO
                </button>
              )}
            </div>
            <select
              name="purchaseOrder"
              value={formData.purchaseOrder}
              onChange={(e) => handlePOSelection(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.purchaseOrder ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={!!grn || loadingPOs} // Disable if editing existing GRN or loading
            >
              <option value="">
                {loadingPOs ? 'Loading Purchase Orders...' : 
                 purchaseOrders.length === 0 ? 'No Purchase Orders Available' : 
                 'Select Purchase Order'}
              </option>
              {!loadingPOs && purchaseOrders.map(po => (
                <option key={po._id} value={po._id}>
                  {po.poNumber} - {po.supplierDetails?.companyName || po.supplier?.companyName || 'Unknown Supplier'}
                </option>
              ))}
            </select>
            {errors.purchaseOrder && (
              <p className="text-red-500 text-xs mt-1">{errors.purchaseOrder}</p>
            )}
            {errors.purchaseOrders && (
              <p className="text-red-500 text-xs mt-1">{errors.purchaseOrders}</p>
            )}
            {!loadingPOs && purchaseOrders.length === 0 && (
              <p className="text-yellow-600 text-xs mt-1">
                No Purchase Orders found. Please create some Purchase Orders first.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Receipt Date *
            </label>
            <input
              type="date"
              name="receiptDate"
              value={formData.receiptDate}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
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
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Warehouse Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Warehouse Location *
            </label>
            <select
              name="warehouseLocation"
              value={formData.warehouseLocation}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
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
            {errors.warehouseLocation && (
              <p className="text-red-500 text-xs mt-1">{errors.warehouseLocation}</p>
            )}
            {!errors.warehouseLocation && (
              <p className="text-xs text-gray-500 mt-1">
                Select where the received goods will be stored
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Storage Notes
            </label>
            <input
              type="text"
              name="generalNotes"
              value={formData.generalNotes}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Additional storage instructions (optional)"
            />
          </div>
        </div>
      </div>

      {/* Items */}
      {selectedPO && formData.items.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Items Received</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ordered
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                    Prev. Received
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                    Receiving Now *
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-orange-50">
                    Pending
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                                  
                                  const updatedItems = [...formData.items];
                                  updatedItems[index].receivedQuantity = qty;
                                  
                                  if (item.orderedQuantity > 0 && item.orderedWeight > 0) {
                                    const weightPerUnit = item.orderedWeight / item.orderedQuantity;
                                    updatedItems[index].receivedWeight = qty * weightPerUnit;
                                    updatedItems[index].pendingQuantity = item.orderedQuantity - item.previouslyReceived - qty;
                                    updatedItems[index].pendingWeight = item.orderedWeight - item.previousWeight - (qty * weightPerUnit);
                                  }
                                  
                                  setFormData(prev => ({ ...prev, items: updatedItems }));
                                }}
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                                min="0"
                                step="1"
                                placeholder="0"
                              />
                              <span className="text-sm text-gray-600">{item.unit}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              Max: {item.orderedQuantity - item.previouslyReceived} {item.unit}
                            </div>
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
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            General Notes
          </label>
          <textarea
            name="generalNotes"
            value={formData.generalNotes}
            onChange={handleChange}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Any additional notes about this goods receipt..."
          />
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
          disabled={loading || !selectedPO}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : (grn ? 'Update GRN' : 'Create GRN')}
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
