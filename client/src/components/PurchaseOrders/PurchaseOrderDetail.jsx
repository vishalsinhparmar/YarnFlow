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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{purchaseOrder.poNumber}</h2>
          <p className="text-gray-600">Created on {formatDate(purchaseOrder.createdAt)}</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${poUtils.getStatusColor(purchaseOrder.status)}`}>
            {poUtils.formatStatus(purchaseOrder.status)}
          </span>
          {getNextStatuses().length > 0 && (
            <button
              onClick={() => setShowStatusUpdate(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
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
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Order Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">PO Number:</span>
              <p className="text-gray-900">{purchaseOrder.poNumber}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Order Date:</span>
              <p className="text-gray-900">{formatDate(purchaseOrder.orderDate)}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Expected Delivery:</span>
              <p className="text-gray-900">{formatDate(purchaseOrder.expectedDeliveryDate)}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Priority:</span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                purchaseOrder.priority === 'High' ? 'bg-red-100 text-red-800' :
                purchaseOrder.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {purchaseOrder.priority}
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Payment Terms:</span>
              <p className="text-gray-900">{purchaseOrder.paymentTerms?.replace('_', ' ')}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Shipping Method:</span>
              <p className="text-gray-900">{purchaseOrder.shippingMethod?.replace('_', ' ')}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Created By:</span>
              <p className="text-gray-900">{purchaseOrder.createdBy}</p>
            </div>
            {completionPercentage > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-500">Completion:</span>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{completionPercentage}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Supplier Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Company Name:</span>
              <p className="text-gray-900">{purchaseOrder.supplierDetails?.companyName}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Contact Person:</span>
              <p className="text-gray-900">{purchaseOrder.supplierDetails?.contactPerson || 'N/A'}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Email:</span>
              <p className="text-gray-900">{purchaseOrder.supplierDetails?.email || 'N/A'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Phone:</span>
              <p className="text-gray-900">{purchaseOrder.supplierDetails?.phone || 'N/A'}</p>
            </div>
          </div>
        </div>

        {purchaseOrder.supplierDetails?.address && (
          <div className="mt-4">
            <span className="text-sm font-medium text-gray-500">Address:</span>
            <p className="text-gray-900">
              {[
                purchaseOrder.supplierDetails.address.street,
                purchaseOrder.supplierDetails.address.city,
                purchaseOrder.supplierDetails.address.state,
                purchaseOrder.supplierDetails.address.pincode
              ].filter(Boolean).join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Items</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Received
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchaseOrder.items?.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                    <div className="text-sm text-gray-500">{item.productCode}</div>
                    {item.specifications && (
                      <div className="text-xs text-gray-400">
                        {item.specifications.yarnCount && `${item.specifications.yarnCount} | `}
                        {item.specifications.color && `${item.specifications.color} | `}
                        {item.specifications.quality}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(item.totalPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.receivedQuantity || 0} {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.pendingQuantity || item.quantity} {item.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span className="text-gray-900">{formatCurrency(purchaseOrder.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax ({purchaseOrder.taxRate}%):</span>
            <span className="text-gray-900">{formatCurrency(purchaseOrder.taxAmount)}</span>
          </div>
          {purchaseOrder.discountAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Discount:</span>
              <span className="text-gray-900">-{formatCurrency(purchaseOrder.discountAmount)}</span>
            </div>
          )}
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span className="text-gray-900">Total Amount:</span>
            <span className="text-gray-900">{formatCurrency(purchaseOrder.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Delivery Address */}
      {purchaseOrder.deliveryAddress && Object.values(purchaseOrder.deliveryAddress).some(val => val) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Address</h3>
          <p className="text-gray-900">
            {[
              purchaseOrder.deliveryAddress.street,
              purchaseOrder.deliveryAddress.city,
              purchaseOrder.deliveryAddress.state,
              purchaseOrder.deliveryAddress.pincode,
              purchaseOrder.deliveryAddress.landmark
            ].filter(Boolean).join(', ')}
          </p>
        </div>
      )}

      {/* Terms and Notes */}
      {(purchaseOrder.terms || purchaseOrder.notes) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
          
          {purchaseOrder.terms && (
            <div className="mb-4">
              <span className="text-sm font-medium text-gray-500">Terms & Conditions:</span>
              <p className="text-gray-900 mt-1">{purchaseOrder.terms}</p>
            </div>
          )}
          
          {purchaseOrder.notes && (
            <div>
              <span className="text-sm font-medium text-gray-500">Notes:</span>
              <p className="text-gray-900 mt-1">{purchaseOrder.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Audit Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Audit Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Created:</span> {formatDate(purchaseOrder.createdAt)} by {purchaseOrder.createdBy}
          </div>
          <div>
            <span className="font-medium">Last Updated:</span> {formatDate(purchaseOrder.updatedAt)}
            {purchaseOrder.lastModifiedBy && ` by ${purchaseOrder.lastModifiedBy}`}
          </div>
          {purchaseOrder.sentDate && (
            <div>
              <span className="font-medium">Sent Date:</span> {formatDate(purchaseOrder.sentDate)}
            </div>
          )}
          {purchaseOrder.acknowledgedDate && (
            <div>
              <span className="font-medium">Acknowledged Date:</span> {formatDate(purchaseOrder.acknowledgedDate)}
            </div>
          )}
        </div>
      </div>

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
