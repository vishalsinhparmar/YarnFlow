import React, { useState, useEffect } from 'react';
import { inventoryAPI, inventoryUtils } from '../services/inventoryAPI';

const StockTransferModal = ({ isOpen, onClose, onSubmit, sourceLot }) => {
  const [transferType, setTransferType] = useState('lot-to-lot');
  const [availableLots, setAvailableLots] = useState([]);
  const [formData, setFormData] = useState({
    quantity: '',
    toLotId: '',
    newLocation: {
      zone: '',
      rack: '',
      shelf: '',
      bin: ''
    },
    notes: '',
    performedBy: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingLots, setLoadingLots] = useState(false);

  // Fetch available lots for transfer
  useEffect(() => {
    if (isOpen && transferType === 'lot-to-lot') {
      fetchAvailableLots();
    }
  }, [isOpen, transferType]);

  const fetchAvailableLots = async () => {
    try {
      setLoadingLots(true);
      const response = await inventoryAPI.getAll({ 
        status: 'Active',
        limit: 100 
      });
      
      if (response.success) {
        // Filter out the source lot
        const filteredLots = response.data.filter(lot => 
          lot._id !== sourceLot?._id && lot.currentQuantity > 0
        );
        setAvailableLots(filteredLots);
      }
    } catch (error) {
      console.error('Error fetching lots:', error);
    } finally {
      setLoadingLots(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('newLocation.')) {
      const locationField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        newLocation: {
          ...prev.newLocation,
          [locationField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (sourceLot && parseFloat(formData.quantity) > sourceLot.availableQuantity) {
      newErrors.quantity = `Insufficient stock. Available: ${sourceLot.availableQuantity} ${sourceLot.unit}`;
    }

    if (transferType === 'lot-to-lot' && !formData.toLotId) {
      newErrors.toLotId = 'Please select a destination lot';
    }

    if (transferType === 'location-change') {
      if (!formData.newLocation.zone && !formData.newLocation.rack && 
          !formData.newLocation.shelf && !formData.newLocation.bin) {
        newErrors.newLocation = 'Please specify at least one location field';
      }
    }

    if (!formData.performedBy.trim()) {
      newErrors.performedBy = 'Performed by is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const transferData = {
        fromLotId: sourceLot._id,
        quantity: parseFloat(formData.quantity),
        transferType,
        notes: formData.notes,
        performedBy: formData.performedBy
      };

      if (transferType === 'lot-to-lot') {
        transferData.toLotId = formData.toLotId;
      } else {
        transferData.newLocation = formData.newLocation;
      }

      await onSubmit(transferData);
      
      // Reset form
      setFormData({
        quantity: '',
        toLotId: '',
        newLocation: { zone: '', rack: '', shelf: '', bin: '' },
        notes: '',
        performedBy: ''
      });
      setErrors({});
    } catch (error) {
      console.error('Error submitting transfer:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Stock Transfer</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Source Lot Information */}
          {sourceLot && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Source Lot</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <div><span className="font-medium">Lot:</span> {sourceLot.lotNumber}</div>
                <div><span className="font-medium">Product:</span> {sourceLot.productName}</div>
                <div><span className="font-medium">Available:</span> {sourceLot.availableQuantity || sourceLot.currentQuantity} {sourceLot.unit}</div>
                <div><span className="font-medium">Location:</span> {inventoryUtils.formatLocation(sourceLot.location)}</div>
              </div>
            </div>
          )}

          {/* Transfer Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transfer Type
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="transferType"
                  value="lot-to-lot"
                  checked={transferType === 'lot-to-lot'}
                  onChange={(e) => setTransferType(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Transfer to another lot</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="transferType"
                  value="location-change"
                  checked={transferType === 'location-change'}
                  onChange={(e) => setTransferType(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Change location within same lot</span>
              </label>
            </div>
          </div>

          {/* Quantity */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity to Transfer *
            </label>
            <div className="relative">
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                step="0.01"
                min="0.01"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.quantity ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter quantity"
              />
              {sourceLot && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">{sourceLot.unit}</span>
                </div>
              )}
            </div>
            {errors.quantity && (
              <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
            )}
          </div>

          {/* Destination Lot (for lot-to-lot transfer) */}
          {transferType === 'lot-to-lot' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination Lot *
              </label>
              {loadingLots ? (
                <div className="text-sm text-gray-500">Loading lots...</div>
              ) : (
                <select
                  name="toLotId"
                  value={formData.toLotId}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.toLotId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select destination lot</option>
                  {availableLots.map(lot => (
                    <option key={lot._id} value={lot._id}>
                      {lot.lotNumber} - {lot.productName} ({lot.currentQuantity} {lot.unit})
                    </option>
                  ))}
                </select>
              )}
              {errors.toLotId && (
                <p className="text-red-500 text-xs mt-1">{errors.toLotId}</p>
              )}
            </div>
          )}

          {/* New Location (for location change) */}
          {transferType === 'location-change' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Location
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    name="newLocation.zone"
                    value={formData.newLocation.zone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Zone"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="newLocation.rack"
                    value={formData.newLocation.rack}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Rack"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="newLocation.shelf"
                    value={formData.newLocation.shelf}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Shelf"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="newLocation.bin"
                    value={formData.newLocation.bin}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Bin"
                  />
                </div>
              </div>
              {errors.newLocation && (
                <p className="text-red-500 text-xs mt-1">{errors.newLocation}</p>
              )}
            </div>
          )}

          {/* Performed By */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Performed By *
            </label>
            <input
              type="text"
              name="performedBy"
              value={formData.performedBy}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.performedBy ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Your name"
            />
            {errors.performedBy && (
              <p className="text-red-500 text-xs mt-1">{errors.performedBy}</p>
            )}
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Transfer reason, special instructions..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {loading ? 'Processing...' : 'Confirm Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockTransferModal;
