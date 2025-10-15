import React, { useState } from 'react';
import { grnUtils } from '../../services/grnAPI';

const GRNDetail = ({ grn, onStatusUpdate, onApprove, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [showApproval, setShowApproval] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    
    try {
      setLoading(true);
      await onStatusUpdate(grn._id, newStatus, statusNotes);
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

  const handleApproval = async () => {
    if (!approvedBy) {
      alert('Please enter approver name');
      return;
    }
    
    try {
      setLoading(true);
      await onApprove(grn._id, approvedBy, approvalNotes);
      setShowApproval(false);
      setApprovedBy('');
      setApprovalNotes('');
    } catch (error) {
      console.error('Error approving GRN:', error);
      alert('Failed to approve GRN');
    } finally {
      setLoading(false);
    }
  };

  const getNextStatuses = () => {
    return grnUtils.getNextStatuses(grn.status);
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

  const completionPercentage = grnUtils.calculateCompletion(grn.items);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{grn.grnNumber}</h2>
          <p className="text-gray-600">Created on {formatDate(grn.createdAt)}</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${grnUtils.getStatusColor(grn.status)}`}>
            {grnUtils.formatStatus(grn.status)}
          </span>
          {getNextStatuses().length > 0 && (
            <button
              onClick={() => setShowStatusUpdate(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              Update Status
            </button>
          )}
          {grnUtils.canApprove(grn.status, grn.qualityCheckStatus) && (
            <button
              onClick={() => setShowApproval(true)}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
            >
              Approve GRN
            </button>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Update GRN Status</h3>
            
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
                      {grnUtils.formatStatus(status)}
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

      {/* Approval Modal */}
      {showApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Approve GRN</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Approved By *
                </label>
                <input
                  type="text"
                  value={approvedBy}
                  onChange={(e) => setApprovedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Approval Notes (Optional)
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Add notes about this approval..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowApproval(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApproval}
                disabled={!approvedBy || loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Approving...' : 'Approve GRN'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">GRN Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">GRN Number:</span>
              <p className="text-gray-900">{grn.grnNumber}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">PO Reference:</span>
              <p className="text-gray-900">{grn.poNumber}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Receipt Date:</span>
              <p className="text-gray-900">{formatDate(grn.receiptDate)}</p>
            </div>
            {grn.deliveryDate && (
              <div>
                <span className="text-sm font-medium text-gray-500">Delivery Date:</span>
                <p className="text-gray-900">{formatDate(grn.deliveryDate)}</p>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-gray-500">Received By:</span>
              <p className="text-gray-900">{grn.receivedBy}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Quality Status:</span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${grnUtils.getQualityStatusColor(grn.qualityCheckStatus)}`}>
                {grnUtils.formatQualityStatus(grn.qualityCheckStatus)}
              </span>
            </div>
            {grn.qualityCheckBy && (
              <div>
                <span className="text-sm font-medium text-gray-500">Quality Checked By:</span>
                <p className="text-gray-900">{grn.qualityCheckBy}</p>
              </div>
            )}
            {grn.approvedBy && (
              <div>
                <span className="text-sm font-medium text-gray-500">Approved By:</span>
                <p className="text-gray-900">{grn.approvedBy}</p>
              </div>
            )}
            {completionPercentage > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-500">Quality Check Progress:</span>
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
              <p className="text-gray-900">{grn.supplierDetails?.companyName}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Contact Person:</span>
              <p className="text-gray-900">{grn.supplierDetails?.contactPerson || 'N/A'}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Email:</span>
              <p className="text-gray-900">{grn.supplierDetails?.email || 'N/A'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Phone:</span>
              <p className="text-gray-900">{grn.supplierDetails?.phone || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Information */}
      {(grn.invoiceNumber || grn.invoiceAmount > 0) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {grn.invoiceNumber && (
              <div>
                <span className="text-sm font-medium text-gray-500">Invoice Number:</span>
                <p className="text-gray-900">{grn.invoiceNumber}</p>
              </div>
            )}
            {grn.invoiceDate && (
              <div>
                <span className="text-sm font-medium text-gray-500">Invoice Date:</span>
                <p className="text-gray-900">{formatDate(grn.invoiceDate)}</p>
              </div>
            )}
            {grn.invoiceAmount > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-500">Invoice Amount:</span>
                <p className="text-gray-900">{formatCurrency(grn.invoiceAmount)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transport Information */}
      {(grn.vehicleNumber || grn.driverName || grn.transportCompany) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transport Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              {grn.vehicleNumber && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Vehicle Number:</span>
                  <p className="text-gray-900">{grn.vehicleNumber}</p>
                </div>
              )}
              {grn.transportCompany && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Transport Company:</span>
                  <p className="text-gray-900">{grn.transportCompany}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              {grn.driverName && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Driver Name:</span>
                  <p className="text-gray-900">{grn.driverName}</p>
                </div>
              )}
              {grn.driverPhone && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Driver Phone:</span>
                  <p className="text-gray-900">{grn.driverPhone}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Items Received</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ordered
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Received
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accepted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rejected
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quality Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {grn.items?.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                    <div className="text-sm text-gray-500">{item.productCode}</div>
                    {item.batchNumber && (
                      <div className="text-xs text-gray-400">Batch: {item.batchNumber}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.orderedQuantity} {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.receivedQuantity} {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    {item.acceptedQuantity} {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    {item.rejectedQuantity || 0} {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.qualityStatus === 'Approved' ? 'bg-green-100 text-green-800' :
                      item.qualityStatus === 'Rejected' ? 'bg-red-100 text-red-800' :
                      item.qualityStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.qualityStatus}
                    </span>
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
            <span className="text-gray-600">Total Received Value:</span>
            <span className="text-gray-900">{formatCurrency(grn.totalReceivedValue || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Accepted Value:</span>
            <span className="text-green-600">{formatCurrency(grn.totalAcceptedValue || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Rejected Value:</span>
            <span className="text-red-600">{formatCurrency(grn.totalRejectedValue || 0)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {grn.generalNotes && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
          <p className="text-gray-900">{grn.generalNotes}</p>
        </div>
      )}

      {/* Audit Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Audit Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Created:</span> {formatDate(grn.createdAt)} by {grn.createdBy}
          </div>
          <div>
            <span className="font-medium">Last Updated:</span> {formatDate(grn.updatedAt)}
            {grn.lastModifiedBy && ` by ${grn.lastModifiedBy}`}
          </div>
          {grn.qualityCheckDate && (
            <div>
              <span className="font-medium">Quality Check Date:</span> {formatDate(grn.qualityCheckDate)}
            </div>
          )}
          {grn.approvedDate && (
            <div>
              <span className="font-medium">Approved Date:</span> {formatDate(grn.approvedDate)}
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
          Print GRN
        </button>
      </div>
    </div>
  );
};

export default GRNDetail;
