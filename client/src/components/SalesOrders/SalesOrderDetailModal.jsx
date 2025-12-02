import React, { useState, useEffect } from 'react';
import { ShoppingCart, X, User, Calendar, Clock, Tag, Package, CheckCircle, Scale } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{order.soNumber}</h2>
                  <p className="text-blue-100 text-sm">Created on {formatDate(order.createdAt || order.orderDate)}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex px-4 py-1.5 text-sm font-semibold rounded-lg shadow-sm ${
                order.status === 'Delivered' ? 'bg-green-500 text-white' :
                order.status === 'Draft' ? 'bg-blue-100 text-blue-800' :
                order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {order.status}
              </span>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Order Information */}
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center mb-6">
              <ShoppingCart className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Order Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <ShoppingCart className="w-3 h-3" />
                  SO Number
                </span>
                <p className="text-lg font-bold text-gray-900 mt-2">{order.soNumber}</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Order Date
                </span>
                <p className="text-lg font-bold text-gray-900 mt-2">{formatDate(order.orderDate)}</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Expected Delivery
                </span>
                <p className="text-lg font-bold text-gray-900 mt-2">{formatDate(order.expectedDeliveryDate)}</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Customer
                </span>
                <p className="text-lg font-bold text-gray-900 mt-2">{order.customerDetails?.companyName || order.customer?.companyName || 'N/A'}</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  Category
                </span>
                <p className="text-lg font-bold text-gray-900 mt-2">{order.category?.categoryName || 'N/A'}</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <Scale className="w-3 h-3" />
                  Total Weight
                </span>
                <p className="text-lg font-bold text-gray-900 mt-2">{totalWeight.toFixed(2)} Kg</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center mb-6">
              <Package className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Order Items ({order.items?.length || 0})</h3>
            </div>
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
        <div className="px-8 py-4 border-t border-gray-200 flex items-center justify-end gap-3 flex-shrink-0 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesOrderDetailModal;