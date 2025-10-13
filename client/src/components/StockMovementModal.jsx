import React, { useState } from 'react';
import { inventoryUtils } from '../services/inventoryAPI';

const StockMovementModal = ({ isOpen, onClose, onSubmit, movementType, lot, title }) => {
  const [formData, setFormData] = useState({
    quantity: '',
    reference: '',
    notes: '',
    performedBy: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (lot && ['Issued', 'Damaged', 'Transferred'].includes(movementType)) {
      if (parseFloat(formData.quantity) > lot.availableQuantity) {
        newErrors.quantity = `Insufficient stock. Available: ${lot.availableQuantity} ${lot.unit}`;
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
      await onSubmit({
        type: movementType,
        quantity: parseFloat(formData.quantity),
        reference: formData.reference,
        notes: formData.notes,
        performedBy: formData.performedBy
      });
      
      // Reset form
      setFormData({
        quantity: '',
        reference: '',
        notes: '',
        performedBy: ''
      });
      setErrors({});
    } catch (error) {
      console.error('Error submitting stock movement:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
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
          {/* Lot Information */}
          {lot && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Lot Information</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div><span className="font-medium">Lot:</span> {lot.lotNumber}</div>
                <div><span className="font-medium">Product:</span> {lot.productName}</div>
                <div><span className="font-medium">Available:</span> {lot.availableQuantity || lot.currentQuantity} {lot.unit}</div>
                <div><span className="font-medium">Supplier:</span> {lot.supplierName}</div>
              </div>
            </div>
          )}

          {/* Movement Type Info */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <span className="text-lg mr-2">
                {inventoryUtils.getMovementTypeIcon(movementType)}
              </span>
              <div>
                <div className="font-medium text-blue-900">
                  {inventoryUtils.formatMovementType(movementType)}
                </div>
                <div className="text-sm text-blue-700">
                  {movementType === 'Received' && 'Add inventory to this lot'}
                  {movementType === 'Issued' && 'Remove inventory from this lot'}
                  {movementType === 'Adjusted' && 'Adjust inventory quantity'}
                  {movementType === 'Returned' && 'Return inventory to this lot'}
                  {movementType === 'Damaged' && 'Mark inventory as damaged'}
                </div>
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
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
              {lot && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">{lot.unit}</span>
                </div>
              )}
            </div>
            {errors.quantity && (
              <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
            )}
          </div>

          {/* Reference */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference
            </label>
            <input
              type="text"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="SO number, invoice, etc."
            />
          </div>

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
              placeholder="Additional notes..."
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
                  : movementType === 'Received' 
                    ? 'bg-green-600 hover:bg-green-700'
                    : movementType === 'Issued'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Processing...' : `Confirm ${inventoryUtils.formatMovementType(movementType)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockMovementModal;
