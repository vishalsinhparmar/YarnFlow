import React from 'react';
import { poUtils } from '../../services/purchaseOrderAPI';

const PurchaseOrderDetail = ({ purchaseOrder, onClose }) => {

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
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 rounded-t-xl">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Basic Information
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-4 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center">
                <svg className="w-4 h-4 mr-1.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Supplier
              </label>
              <p className="text-lg font-bold text-gray-900">{purchaseOrder.supplierDetails?.companyName}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center">
                <svg className="w-4 h-4 mr-1.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Order Date
              </label>
              <p className="text-lg font-bold text-gray-900">{formatDate(purchaseOrder.orderDate)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center">
                <svg className="w-4 h-4 mr-1.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Expected Delivery
              </label>
              <p className="text-lg font-bold text-gray-900">
                {purchaseOrder.expectedDeliveryDate ? formatDate(purchaseOrder.expectedDeliveryDate) : <span className="text-gray-400">Not specified</span>}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center">
                <svg className="w-4 h-4 mr-1.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Category
              </label>
              <p className="text-lg font-bold text-gray-900">{purchaseOrder.category?.categoryName || 'N/A'}</p>
            </div>
          </div>
          {completionPercentage > 0 && (
            <div className="mt-6 bg-white p-4 rounded-lg border border-gray-100">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center">
                <svg className="w-4 h-4 mr-1.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Order Completion
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm" 
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
                <span className="text-lg font-bold text-green-600 min-w-[60px] text-right">{completionPercentage}%</span>
              </div>
            </div>
          )}
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
                  {item.receivedQuantity > 0 && !item.manuallyCompleted && item.receivedQuantity < item.quantity && (
                    <p className="text-sm text-orange-600">Pending: {item.quantity - item.receivedQuantity} {item.unit}</p>
                  )}
                  {item.manuallyCompleted && (
                    <p className="text-sm text-green-600 font-medium">✓ Manually Completed</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Weight</label>
                  <p className="text-base text-gray-900">{(item.weight || item.specifications?.weight || 0)} Kg</p>
                  {item.receivedWeight > 0 && (
                    <p className="text-sm text-green-600">Received: {item.receivedWeight.toFixed(2)} Kg</p>
                  )}
                  {item.receivedWeight > 0 && !item.manuallyCompleted && item.receivedWeight < (item.weight || 0) && (
                    <p className="text-sm text-orange-600">Pending: {((item.weight || 0) - item.receivedWeight).toFixed(2)} Kg</p>
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
      <div className="flex justify-end pt-6 border-t">
        <button
          onClick={onClose}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default PurchaseOrderDetail;
