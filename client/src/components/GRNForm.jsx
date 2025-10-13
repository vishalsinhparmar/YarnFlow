import React, { useState, useEffect } from 'react';
import { purchaseOrderAPI } from '../services/purchaseOrderAPI';
import masterDataAPI from '../services/masterDataAPI';

const GRNForm = ({ grn, onSubmit, onCancel }) => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingPOs, setLoadingPOs] = useState(true);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    purchaseOrder: '',
    receiptDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    invoiceNumber: '',
    invoiceDate: '',
    invoiceAmount: 0,
    vehicleNumber: '',
    driverName: '',
    driverPhone: '',
    transportCompany: '',
    receivedBy: '',
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
        // Fetch all POs first to test, you can change this to getByStatus('Approved') later
        const response = await purchaseOrderAPI.getAll({ limit: 100 });
        console.log('Purchase Orders Response:', response);
        
        if (response && response.data) {
          setPurchaseOrders(response.data);
          console.log('Purchase Orders loaded:', response.data.length);
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

  // Populate form if editing
  useEffect(() => {
    if (grn) {
      setFormData({
        purchaseOrder: grn.purchaseOrder?._id || '',
        receiptDate: grn.receiptDate ? new Date(grn.receiptDate).toISOString().split('T')[0] : '',
        deliveryDate: grn.deliveryDate ? new Date(grn.deliveryDate).toISOString().split('T')[0] : '',
        invoiceNumber: grn.invoiceNumber || '',
        invoiceDate: grn.invoiceDate ? new Date(grn.invoiceDate).toISOString().split('T')[0] : '',
        invoiceAmount: grn.invoiceAmount || 0,
        vehicleNumber: grn.vehicleNumber || '',
        driverName: grn.driverName || '',
        driverPhone: grn.driverPhone || '',
        transportCompany: grn.transportCompany || '',
        receivedBy: grn.receivedBy || '',
        warehouseLocation: grn.warehouseLocation || '',
        generalNotes: grn.generalNotes || '',
        items: grn.items?.map(item => ({
          purchaseOrderItem: item.purchaseOrderItem || item._id,
          productName: item.productName,
          productCode: item.productCode,
          orderedQuantity: item.orderedQuantity,
          receivedQuantity: item.receivedQuantity || 0,
          acceptedQuantity: item.acceptedQuantity || 0,
          rejectedQuantity: item.rejectedQuantity || 0,
          unit: item.unit,
          qualityStatus: item.qualityStatus || 'Pending',
          qualityNotes: item.qualityNotes || '',
          warehouseLocation: item.warehouseLocation || '',
          batchNumber: item.batchNumber || '',
          damageQuantity: item.damageQuantity || 0,
          damageNotes: item.damageNotes || '',
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
      setFormData(prev => ({ ...prev, items: [] }));
      return;
    }

    try {
      const response = await purchaseOrderAPI.getById(poId);
      const po = response.data;
      setSelectedPO(po);
      
      // Populate items from PO
      const items = po.items.map(item => ({
        purchaseOrderItem: item._id,
        productName: item.productName,
        productCode: item.productCode,
        orderedQuantity: item.quantity,
        receivedQuantity: 0,
        acceptedQuantity: 0,
        rejectedQuantity: 0,
        unit: item.unit,
        qualityStatus: 'Pending',
        qualityNotes: '',
        warehouseLocation: formData.warehouseLocation,
        batchNumber: '',
        damageQuantity: 0,
        damageNotes: '',
        notes: ''
      }));
      
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
    
    // Auto-calculate accepted quantity if not manually set
    if (field === 'receivedQuantity' || field === 'rejectedQuantity' || field === 'damageQuantity') {
      const item = updatedItems[index];
      const received = Number(item.receivedQuantity) || 0;
      const rejected = Number(item.rejectedQuantity) || 0;
      const damaged = Number(item.damageQuantity) || 0;
      
      if (field === 'receivedQuantity') {
        // Auto-set accepted quantity to received minus rejected and damaged
        updatedItems[index].acceptedQuantity = Math.max(0, received - rejected - damaged);
      }
    }
    
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

    if (!formData.receivedBy) {
      newErrors.receivedBy = 'Received by is required';
    }

    if (!formData.receiptDate) {
      newErrors.receiptDate = 'Receipt date is required';
    }

    // Item validations
    formData.items.forEach((item, index) => {
      if (!item.receivedQuantity || item.receivedQuantity <= 0) {
        newErrors[`items.${index}.receivedQuantity`] = 'Received quantity is required';
      }
      
      const received = Number(item.receivedQuantity) || 0;
      const accepted = Number(item.acceptedQuantity) || 0;
      const rejected = Number(item.rejectedQuantity) || 0;
      const damaged = Number(item.damageQuantity) || 0;
      
      if (accepted + rejected + damaged > received) {
        newErrors[`items.${index}.quantities`] = 'Accepted + Rejected + Damaged cannot exceed received quantity';
      }
    });

    // Driver phone validation
    if (formData.driverPhone && !/^\d{10}$/.test(formData.driverPhone)) {
      newErrors.driverPhone = 'Driver phone must be 10 digits';
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
        invoiceAmount: Number(formData.invoiceAmount),
        items: formData.items.map(item => ({
          ...item,
          receivedQuantity: Number(item.receivedQuantity),
          acceptedQuantity: Number(item.acceptedQuantity),
          rejectedQuantity: Number(item.rejectedQuantity),
          damageQuantity: Number(item.damageQuantity)
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purchase Order *
            </label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Date
            </label>
            <input
              type="date"
              name="deliveryDate"
              value={formData.deliveryDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Received By *
            </label>
            <input
              type="text"
              name="receivedBy"
              value={formData.receivedBy}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.receivedBy ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Name of person who received goods"
            />
            {errors.receivedBy && (
              <p className="text-red-500 text-xs mt-1">{errors.receivedBy}</p>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Invoice Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Number
            </label>
            <input
              type="text"
              name="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Supplier invoice number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Date
            </label>
            <input
              type="date"
              name="invoiceDate"
              value={formData.invoiceDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Amount (₹)
            </label>
            <input
              type="number"
              name="invoiceAmount"
              value={formData.invoiceAmount}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* Transport Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Transport Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Number
            </label>
            <input
              type="text"
              name="vehicleNumber"
              value={formData.vehicleNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="GJ01AB1234"
              style={{ textTransform: 'uppercase' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transport Company
            </label>
            <input
              type="text"
              name="transportCompany"
              value={formData.transportCompany}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Transport company name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Driver Name
            </label>
            <input
              type="text"
              name="driverName"
              value={formData.driverName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Driver name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Driver Phone
            </label>
            <input
              type="text"
              name="driverPhone"
              value={formData.driverPhone}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.driverPhone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="10-digit phone number"
              maxLength="10"
            />
            {errors.driverPhone && (
              <p className="text-red-500 text-xs mt-1">{errors.driverPhone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Warehouse Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Warehouse Information</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Warehouse Location
          </label>
          <input
            type="text"
            name="warehouseLocation"
            value={formData.warehouseLocation}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Warehouse location or zone"
          />
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Received *
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accepted
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rejected
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Damaged
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quality Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formData.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                      <div className="text-sm text-gray-500">{item.productCode}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {item.orderedQuantity} {item.unit}
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        value={item.receivedQuantity}
                        onChange={(e) => handleItemChange(index, 'receivedQuantity', e.target.value)}
                        className={`w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          errors[`items.${index}.receivedQuantity`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        min="0"
                        step="1"
                      />
                      {errors[`items.${index}.receivedQuantity`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`items.${index}.receivedQuantity`]}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        value={item.acceptedQuantity}
                        onChange={(e) => handleItemChange(index, 'acceptedQuantity', e.target.value)}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        min="0"
                        step="1"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        value={item.rejectedQuantity}
                        onChange={(e) => handleItemChange(index, 'rejectedQuantity', e.target.value)}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        min="0"
                        step="1"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        value={item.damageQuantity}
                        onChange={(e) => handleItemChange(index, 'damageQuantity', e.target.value)}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        min="0"
                        step="1"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={item.qualityStatus}
                        onChange={(e) => handleItemChange(index, 'qualityStatus', e.target.value)}
                        className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Partial">Partial</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Show quantity validation errors */}
          {formData.items.some((_, index) => errors[`items.${index}.quantities`]) && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600 text-sm">Please check item quantities - Accepted + Rejected + Damaged cannot exceed received quantity</p>
            </div>
          )}
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
  );
};

export default GRNForm;
