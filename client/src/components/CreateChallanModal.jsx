import React, { useState, useEffect } from 'react';
import { salesOrderAPI } from '../services/salesOrderAPI';

const CreateChallanModal = ({ isOpen, onClose, onSubmit, preSelectedOrderId = null }) => {
  const [formData, setFormData] = useState({
    salesOrderId: '',
    deliveryAddress: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    transportDetails: {
      vehicleNumber: '',
      vehicleType: 'Truck',
      driverName: '',
      driverPhone: '',
      transporterName: '',
      freightCharges: 0
    },
    expectedDeliveryDate: '',
    preparationNotes: '',
    createdBy: 'Admin'
  });

  const [salesOrders, setSalesOrders] = useState([]);
  const [selectedSO, setSelectedSO] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load sales orders on modal open
  useEffect(() => {
    if (isOpen) {
      loadSalesOrders();
      // Auto-select order if preSelectedOrderId is provided
      if (preSelectedOrderId) {
        handleSOSelection(preSelectedOrderId);
      }
    }
  }, [isOpen, preSelectedOrderId]);

  const loadSalesOrders = async () => {
    try {
      // Load both Confirmed and Processing orders
      const [confirmedRes, processingRes] = await Promise.all([
        salesOrderAPI.getAll({ status: 'Confirmed', limit: 50 }),
        salesOrderAPI.getAll({ status: 'Processing', limit: 50 })
      ]);
      
      const allOrders = [];
      if (confirmedRes.success) allOrders.push(...confirmedRes.data);
      if (processingRes.success) allOrders.push(...processingRes.data);
      
      setSalesOrders(allOrders);
    } catch (err) {
      console.error('Error loading sales orders:', err);
      setError('Failed to load sales orders');
    }
  };

  // Handle sales order selection
  const handleSOSelection = async (soId) => {
    if (!soId) {
      setSelectedSO(null);
      return;
    }

    try {
      const response = await salesOrderAPI.getById(soId);
      if (response.success) {
        const so = response.data;
        setSelectedSO(so);
        
        // Auto-fill delivery address from customer
        setFormData(prev => ({
          ...prev,
          salesOrderId: soId,
          deliveryAddress: {
            street: so.customerDetails?.address?.street || '',
            city: so.customerDetails?.address?.city || '',
            state: so.customerDetails?.address?.state || '',
            pincode: so.customerDetails?.address?.pincode || '',
            country: so.customerDetails?.address?.country || 'India'
          },
          expectedDeliveryDate: so.expectedDeliveryDate ? 
            new Date(so.expectedDeliveryDate).toISOString().split('T')[0] : ''
        }));
      }
    } catch (err) {
      console.error('Error loading sales order details:', err);
      setError('Failed to load sales order details');
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validation
      if (!formData.salesOrderId) {
        throw new Error('Please select a sales order');
      }
      if (!formData.deliveryAddress.street || !formData.deliveryAddress.city) {
        throw new Error('Please fill delivery address details');
      }

      // Prepare challan data
      const challanData = {
        salesOrderId: formData.salesOrderId,
        deliveryAddress: formData.deliveryAddress,
        transportDetails: formData.transportDetails,
        expectedDeliveryDate: formData.expectedDeliveryDate,
        items: selectedSO?.items?.map(item => ({
          salesOrderItemId: item._id,
          dispatchQuantity: item.orderedQuantity // Default to full quantity
        })) || [],
        preparationNotes: formData.preparationNotes,
        createdBy: formData.createdBy
      };

      await onSubmit(challanData);
      
      // Reset form
      setFormData({
        salesOrderId: '',
        deliveryAddress: {
          street: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India'
        },
        transportDetails: {
          vehicleNumber: '',
          vehicleType: 'Truck',
          driverName: '',
          driverPhone: '',
          transporterName: '',
          freightCharges: 0
        },
        expectedDeliveryDate: '',
        preparationNotes: '',
        createdBy: 'Admin'
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
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Sales Order Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sales Order *
              </label>
              <select
                value={formData.salesOrderId}
                onChange={(e) => handleSOSelection(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select Sales Order</option>
                {salesOrders.map(so => (
                  <option key={so._id} value={so._id}>
                    {so.soNumber} - {so.customerDetails?.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={formData.expectedDeliveryDate}
                onChange={(e) => handleInputChange('expectedDeliveryDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Selected SO Details */}
          {selectedSO && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Selected Order Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Customer:</span> {selectedSO.customerDetails?.companyName}
                </div>
                <div>
                  <span className="font-medium">Order Date:</span> {new Date(selectedSO.orderDate).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Total Amount:</span> ₹{selectedSO.totalAmount?.toLocaleString()}
                </div>
              </div>
              <div className="mt-2">
                <span className="font-medium">Items:</span> {selectedSO.items?.length} items
              </div>
            </div>
          )}

          {/* Delivery Address */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  value={formData.deliveryAddress.street}
                  onChange={(e) => handleInputChange('deliveryAddress.street', e.target.value)}
                  required
                  placeholder="Enter street address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.deliveryAddress.city}
                  onChange={(e) => handleInputChange('deliveryAddress.city', e.target.value)}
                  required
                  placeholder="Enter city"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  value={formData.deliveryAddress.state}
                  onChange={(e) => handleInputChange('deliveryAddress.state', e.target.value)}
                  required
                  placeholder="Enter state"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pincode *
                </label>
                <input
                  type="text"
                  value={formData.deliveryAddress.pincode}
                  onChange={(e) => handleInputChange('deliveryAddress.pincode', e.target.value)}
                  required
                  placeholder="Enter pincode"
                  pattern="[1-9][0-9]{5}"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.deliveryAddress.country}
                  onChange={(e) => handleInputChange('deliveryAddress.country', e.target.value)}
                  placeholder="Enter country"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Transport Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Transport Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  value={formData.transportDetails.vehicleNumber}
                  onChange={(e) => handleInputChange('transportDetails.vehicleNumber', e.target.value)}
                  placeholder="e.g., GJ01AB1234"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Type
                </label>
                <select
                  value={formData.transportDetails.vehicleType}
                  onChange={(e) => handleInputChange('transportDetails.vehicleType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Truck">Truck</option>
                  <option value="Tempo">Tempo</option>
                  <option value="Van">Van</option>
                  <option value="Car">Car</option>
                  <option value="Bike">Bike</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Driver Name
                </label>
                <input
                  type="text"
                  value={formData.transportDetails.driverName}
                  onChange={(e) => handleInputChange('transportDetails.driverName', e.target.value)}
                  placeholder="Enter driver name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Driver Phone
                </label>
                <input
                  type="tel"
                  value={formData.transportDetails.driverPhone}
                  onChange={(e) => handleInputChange('transportDetails.driverPhone', e.target.value)}
                  placeholder="Enter driver phone"
                  pattern="[6-9][0-9]{9}"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transporter Name
                </label>
                <input
                  type="text"
                  value={formData.transportDetails.transporterName}
                  onChange={(e) => handleInputChange('transportDetails.transporterName', e.target.value)}
                  placeholder="Enter transporter company"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Freight Charges (₹)
                </label>
                <input
                  type="number"
                  value={formData.transportDetails.freightCharges}
                  onChange={(e) => handleInputChange('transportDetails.freightCharges', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  placeholder="Enter freight charges"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Preparation Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preparation Notes
            </label>
            <textarea
              value={formData.preparationNotes}
              onChange={(e) => handleInputChange('preparationNotes', e.target.value)}
              rows="3"
              placeholder="Add any special preparation instructions..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

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
              disabled={loading || !formData.salesOrderId}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Challan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChallanModal;
