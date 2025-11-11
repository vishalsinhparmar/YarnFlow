import React, { useState, useEffect } from 'react';
import { salesOrderUtils } from '../../services/salesOrderAPI';

const SalesOrderDetailModal = ({ isOpen, onClose, order }) => {
  const [challans, setChallans] = useState([]);
  
  if (!isOpen || !order) return null;

  // Calculate total weight
  const totalWeight = order.items?.reduce((sum, item) => sum + (item.weight || 0), 0) || 0;
  
  // Calculate dispatch completion for each item
  const calculateItemCompletion = (item) => {
    const ordered = item.quantity || 0;
    const dispatched = item.deliveredQuantity || item.shippedQuantity || 0;
    return ordered > 0 ? Math.round((dispatched / ordered) * 100) : 0;
  };
  
  // Calculate pending quantity for each item
  const calculatePendingQty = (item) => {
    const ordered = item.quantity || 0;
    const dispatched = item.deliveredQuantity || item.shippedQuantity || 0;
    return Math.max(0, ordered - dispatched);
  };
  
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {order.soNumber}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Created on {formatDate(order.createdAt || order.orderDate)}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex px-3 py-1.5 text-sm font-semibold rounded-lg ${salesOrderUtils.getStatusColor(order.status)}`}>
              {order.status}
            </span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Order Information */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <span className="text-sm font-medium text-gray-500">SO Number</span>
                <p className="text-base font-semibold text-gray-900 mt-1">{order.soNumber}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">Order Date</span>
                <p className="text-base font-semibold text-gray-900 mt-1">{formatDate(order.orderDate)}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">Expected Delivery</span>
                <p className="text-base font-semibold text-gray-900 mt-1">{formatDate(order.expectedDeliveryDate)}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">Customer</span>
                <p className="text-base font-semibold text-gray-900 mt-1">{order.customerDetails?.companyName || order.customer?.companyName || 'N/A'}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">Category</span>
                <p className="text-base font-semibold text-gray-900 mt-1">{order.category?.categoryName || 'N/A'}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">Total Weight</span>
                <p className="text-base font-semibold text-gray-900 mt-1">{totalWeight.toFixed(2)} Kg</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">Created By</span>
                <p className="text-base font-semibold text-gray-900 mt-1">{order.createdBy || 'Admin'}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items ({order.items?.length || 0})</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items?.map((item, index) => {
                    const dispatched = item.deliveredQuantity || item.shippedQuantity || 0;
                    const pending = calculatePendingQty(item);
                    const completion = calculateItemCompletion(item);
                    const manuallyCompleted = item.manuallyCompleted || false;
                    
                    let itemStatus = 'Pending';
                    if (manuallyCompleted || dispatched >= item.quantity) {
                      itemStatus = 'Complete';
                    } else if (dispatched > 0) {
                      itemStatus = 'Partial';
                    }
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{item.productName || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{item.productCode || ''}</div>
                          {item.notes && (
                            <div className="text-xs text-blue-600 italic bg-blue-50 px-2 py-1 rounded mt-1 inline-block">
                              📝 {item.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-base text-gray-900">{item.quantity} {item.unit || 'Bags'}</div>
                          {dispatched > 0 && (
                            <p className="text-sm text-green-600">Dispatched: {dispatched} {item.unit || 'Bags'}</p>
                          )}
                          {!manuallyCompleted && pending > 0 && (
                            <p className="text-sm text-orange-600">Pending: {pending} {item.unit || 'Bags'}</p>
                          )}
                          {manuallyCompleted && (
                            <p className="text-sm text-green-600 font-medium">✓ Manually Completed</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-base text-gray-900">{item.weight ? `${item.weight.toFixed(2)} Kg` : 'N/A'}</div>
                          {item.dispatchedWeight > 0 && (
                            <p className="text-sm text-green-600">Dispatched: {item.dispatchedWeight.toFixed(2)} Kg</p>
                          )}
                          {!manuallyCompleted && pending > 0 && item.weight && (
                            <p className="text-sm text-orange-600">Pending: {((pending / item.quantity) * item.weight).toFixed(2)} Kg</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  completion === 100 ? 'bg-green-600' :
                                  completion > 0 ? 'bg-yellow-600' :
                                  'bg-gray-400'
                                }`}
                                style={{ width: `${Math.min(completion, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-700 min-w-[45px]">
                              {completion}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            itemStatus === 'Complete' ? 'bg-green-100 text-green-800' :
                            itemStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {itemStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 flex-shrink-0 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesOrderDetailModal;