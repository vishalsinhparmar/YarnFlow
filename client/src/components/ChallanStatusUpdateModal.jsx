import React, { useState } from 'react';
import { salesChallanUtils } from '../services/salesChallanAPI';

const ChallanStatusUpdateModal = ({ isOpen, onClose, challan, onSubmit }) => {
  const [formData, setFormData] = useState({
    status: '',
    notes: '',
    location: '',
    updatedBy: 'Admin'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.status) {
        throw new Error('Please select a status');
      }

      await onSubmit(formData);
      
      // Reset form
      setFormData({
        status: '',
        notes: '',
        location: '',
        updatedBy: 'Admin'
      });
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !challan) return null;

  const availableStatuses = salesChallanUtils.getNextStatuses(challan.status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Update Challan Status</h2>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Current Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Current Status</h3>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${salesChallanUtils.getStatusColor(challan.status)}`}>
              {salesChallanUtils.formatStatus(challan.status)}
            </span>
            <p className="text-sm text-gray-600 mt-1">
              Challan: {challan.challanNumber}
            </p>
          </div>

          {/* New Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Select New Status</option>
              {availableStatuses.map(status => (
                <option key={status} value={status}>
                  {salesChallanUtils.formatStatus(status)}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Current location (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows="3"
              placeholder="Add notes about this status change..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Status Impact Information */}
          {formData.status && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-1">Status Change Impact:</h4>
              <p className="text-sm text-blue-700">
                {formData.status === 'Dispatched' && 'Vehicle will be marked as dispatched and tracking will begin.'}
                {formData.status === 'In_Transit' && 'Challan will be marked as in transit.'}
                {formData.status === 'Out_for_Delivery' && 'Challan will be marked as out for delivery.'}
                {formData.status === 'Delivered' && 'Sales Order will be marked as delivered and inventory will be consumed.'}
                {formData.status === 'Returned' && 'Items will be returned to inventory.'}
                {formData.status === 'Cancelled' && 'Challan will be cancelled and inventory will be released.'}
                {formData.status === 'Packed' && 'Items will be marked as packed and ready for dispatch.'}
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
              disabled={loading || !formData.status}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChallanStatusUpdateModal;
