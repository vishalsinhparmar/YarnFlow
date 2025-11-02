import React from 'react';
import { salesOrderUtils } from '../../services/salesOrderAPI';

const SalesOrderDetailModal = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) return null;

  // Calculate total weight
  const totalWeight = order.items?.reduce((sum, item) => sum + (item.weight || 0), 0) || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Sales Order - {order.soNumber}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Created on {salesOrderUtils.formatDate(order.orderDate)}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${salesOrderUtils.getStatusColor(order.status)}`}>
              {order.status}
            </span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Basic Information */}
          <div className="mb-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{order.customerDetails?.companyName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Order Date</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{salesOrderUtils.formatDate(order.orderDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Expected Delivery</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{salesOrderUtils.formatDate(order.expectedDeliveryDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{order.category?.categoryName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created By</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{order.createdBy || 'System'}</p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-md font-semibold text-gray-900 mb-3">Items ({order.items?.length || 0})</h3>
            <div className="space-y-3">
              {order.items?.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Product</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{item.productName}</p>
                      <p className="text-xs text-gray-500">{item.productCode}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Quantity</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{item.quantity || item.orderedQuantity} {item.unit}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Weight</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{item.weight ? `${item.weight} Kg` : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {totalWeight > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Total Weight: {totalWeight.toFixed(2)} Kg</p>
              </div>
            )}
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="mt-6">
              <h3 className="text-md font-semibold text-gray-900 mb-2">Notes</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">{order.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesOrderDetailModal;
