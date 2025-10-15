import React, { useState } from 'react';
import { salesOrderAPI } from '../services/salesOrderAPI';

const StatusUpdateModal = ({ isOpen, onClose, order }) => {
  const [newStatus, setNewStatus] = useState(order?.status || 'Draft');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const statusOptions = [
    { value: 'Draft', label: 'Draft', description: 'Order created, under review' },
    { value: 'Pending', label: 'Pending', description: 'Sent to customer for approval' },
    { value: 'Confirmed', label: 'Confirmed', description: 'Customer approved the order' },
    { value: 'Processing', label: 'Processing', description: 'Preparing for shipment' },
    { value: 'Shipped', label: 'Shipped', description: 'Order dispatched to customer' },
    { value: 'Delivered', label: 'Delivered', description: 'Customer received the goods' },
    { value: 'Cancelled', label: 'Cancelled', description: 'Order cancelled' }
  ];

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await salesOrderAPI.updateStatus(order._id, {
        status: newStatus,
        notes: notes,
        updatedBy: 'Admin'
      });
      
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Update Order Status
          </h2>
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

        <form onSubmit={handleStatusUpdate} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Order Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Order Information</h3>
            <div className="text-sm text-gray-600">
              <p><span className="font-medium">SO Number:</span> {order.soNumber}</p>
              <p><span className="font-medium">Customer:</span> {order.customerDetails?.companyName}</p>
              <p><span className="font-medium">Current Status:</span> 
                <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800`}>
                  {order.status}
                </span>
              </p>
            </div>
          </div>

          {/* New Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Status *
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label} - {status.description}
                </option>
              ))}
            </select>
          </div>

          {/* Status Change Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              placeholder="Add notes about this status change..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Change Impact */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Status Change Impact
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  {newStatus === 'Confirmed' && (
                    <p>• Order will be ready for inventory reservation</p>
                  )}
                  {newStatus === 'Processing' && (
                    <p>• Inventory will be reserved for this order</p>
                  )}
                  {newStatus === 'Shipped' && (
                    <p>• Sales Challan should be created<br/>• Inventory will be reduced</p>
                  )}
                  {newStatus === 'Delivered' && (
                    <p>• Order marked as completed<br/>• Ready for invoice generation</p>
                  )}
                  {newStatus === 'Cancelled' && (
                    <p>• Reserved inventory will be released<br/>• Order will be closed</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StatusUpdateModal;