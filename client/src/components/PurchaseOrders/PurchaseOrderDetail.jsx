import React, { useState } from 'react';
import { poUtils } from '../../services/purchaseOrderAPI';

const PurchaseOrderDetail = ({ purchaseOrder, onStatusUpdate, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    
    try {
      setLoading(true);
      await onStatusUpdate(purchaseOrder._id, newStatus, statusNotes);
      setShowStatusUpdate(false);
      setNewStatus('');
      setStatusNotes('');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const getNextStatuses = () => {
    return poUtils.getNextStatuses(purchaseOrder.status);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const completionPercentage = poUtils.calculateCompletion(purchaseOrder.items);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{purchaseOrder.poNumber}</h2>
          <p className="text-sm text-gray-500 mt-1">Created on {formatDate(purchaseOrder.createdAt)}</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`inline-flex px-3 py-1.5 text-sm font-semibold rounded-lg ${poUtils.getStatusColor(purchaseOrder.status)}`}>
            {poUtils.formatStatus(purchaseOrder.status)}
          </span>
          {getNextStatuses().length > 0 && (
            <button
              onClick={() => setShowStatusUpdate(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Update Status
            </button>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Update PO Status</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Status</option>
                  {getNextStatuses().map(status => (
                    <option key={status} value={status}>
                      {poUtils.formatStatus(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add notes about this status change..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowStatusUpdate(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={!newStatus || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Supplier</label>
              <p className="text-base text-gray-900 font-medium">{purchaseOrder.supplierDetails?.companyName}</p>
              <p className="text-sm text-gray-500">{purchaseOrder.supplierDetails?.supplierCode}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Order Date</label>
              <p className="text-base text-gray-900">{formatDate(purchaseOrder.orderDate)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Expected Delivery</label>
              <p className="text-base text-gray-900">
                {purchaseOrder.expectedDeliveryDate ? formatDate(purchaseOrder.expectedDeliveryDate) : 'Not specified'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Category</label>
              <p className="text-base text-gray-900">{purchaseOrder.category?.categoryName || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Created By</label>
              <p className="text-base text-gray-900">{purchaseOrder.createdBy || 'System'}</p>
            </div>
            {completionPercentage > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Completion</label>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full transition-all" 
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{completionPercentage}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Items */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Items ({purchaseOrder.items?.length || 0})</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {purchaseOrder.items?.map((item, index) => (
            <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Product</label>
                  <p className="text-base font-medium text-gray-900">{item.productName}</p>
                  <p className="text-sm text-gray-500">{item.productCode}</p>
                  {item.notes && (
                    <p className="text-xs text-gray-400 mt-1 italic">{item.notes}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Quantity</label>
                  <p className="text-base text-gray-900">{item.quantity} {item.unit}</p>
                  {item.receivedQuantity > 0 && (
                    <p className="text-sm text-green-600">Received: {item.receivedQuantity} {item.unit}</p>
                  )}
                  {!item.manuallyCompleted && item.pendingQuantity > 0 && (
                    <p className="text-sm text-orange-600">Pending: {item.pendingQuantity} {item.unit}</p>
                  )}
                  {item.manuallyCompleted && (
                    <p className="text-sm text-green-600 font-medium">✓ Manually Completed</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Weight</label>
                  <p className="text-base text-gray-900">{(item.specifications?.weight || item.weight || 0)} Kg</p>
                  {item.receivedWeight > 0 && (
                    <p className="text-sm text-green-600">Received: {item.receivedWeight.toFixed(2)} Kg</p>
                  )}
                  {!item.manuallyCompleted && item.pendingWeight > 0 && (
                    <p className="text-sm text-orange-600">Pending: {item.pendingWeight.toFixed(2)} Kg</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline & Notes */}
      {(purchaseOrder.sentDate || purchaseOrder.acknowledgedDate || purchaseOrder.notes) && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Timeline & Notes</h4>
          <div className="space-y-2 text-sm">
            {purchaseOrder.sentDate && (
              <div className="flex items-center text-gray-600">
                <span className="w-32 font-medium">Sent:</span>
                <span>{formatDate(purchaseOrder.sentDate)}</span>
              </div>
            )}
            {purchaseOrder.acknowledgedDate && (
              <div className="flex items-center text-gray-600">
                <span className="w-32 font-medium">Acknowledged:</span>
                <span>{formatDate(purchaseOrder.acknowledgedDate)}</span>
              </div>
            )}
            {purchaseOrder.notes && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <span className="font-medium text-gray-700">Notes:</span>
                <p className="text-gray-600 mt-1">{purchaseOrder.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button
          onClick={onClose}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Close
        </button>
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Print PO
        </button>
      </div>
    </div>
  );
};

export default PurchaseOrderDetail;
