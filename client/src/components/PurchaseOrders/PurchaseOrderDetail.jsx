import React from 'react';
import { ClipboardList, Building2, Calendar, Clock, Tag, CheckCircle, Package, X, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
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
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold">{purchaseOrder.poNumber}</h2>
            </div>
            <p className="text-orange-100 ml-[52px]">Created on {formatDate(purchaseOrder.createdAt)}</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-xl shadow-md ${
              purchaseOrder.status === 'Fully_Received' ? 'bg-white text-green-700' : 
              purchaseOrder.status === 'Partially_Received' ? 'bg-yellow-100 text-yellow-800' : 
              purchaseOrder.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {poUtils.formatStatus(purchaseOrder.status)}
            </span>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-gray-200 rounded-t-xl">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <ClipboardList className="w-5 h-5 mr-2 text-orange-600" />
            Basic Information
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-4 rounded-lg border border-gray-100 hover:border-orange-200 transition-colors hover:shadow-md">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center">
                <Building2 className="w-4 h-4 mr-1.5 text-blue-500" />
                Supplier
              </label>
              <p className="text-lg font-bold text-gray-900">{purchaseOrder.supplierDetails?.companyName}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-100 hover:border-orange-200 transition-colors hover:shadow-md">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1.5 text-green-500" />
                Order Date
              </label>
              <p className="text-lg font-bold text-gray-900">{formatDate(purchaseOrder.orderDate)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-100 hover:border-orange-200 transition-colors hover:shadow-md">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-orange-500" />
                Expected Delivery
              </label>
              <p className="text-lg font-bold text-gray-900">
                {purchaseOrder.expectedDeliveryDate ? formatDate(purchaseOrder.expectedDeliveryDate) : <span className="text-gray-400">Not specified</span>}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-100 hover:border-orange-200 transition-colors hover:shadow-md">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center">
                <Tag className="w-4 h-4 mr-1.5 text-purple-500" />
                Category
              </label>
              <p className="text-lg font-bold text-gray-900">{purchaseOrder.category?.categoryName || 'N/A'}</p>
            </div>
          </div>
          {completionPercentage > 0 && (
            <div className="mt-6 bg-white p-4 rounded-lg border border-gray-100">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1.5 text-green-500" />
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
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Package className="w-5 h-5 mr-2 text-orange-600" />
            Items ({purchaseOrder.items?.length || 0})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {purchaseOrder.items?.map((item, index) => (
            <div key={index} className="p-6 hover:bg-orange-50 transition-colors">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Product</label>
                  <p className="text-base font-semibold text-gray-900">{item.productName}</p>
                  <p className="text-sm text-gray-500">{item.productCode}</p>
                  {item.notes && (
                    <div className="text-xs text-blue-600 mt-1 italic bg-blue-50 px-2 py-1 rounded inline-flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {item.notes}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Quantity</label>
                  <p className="text-base font-medium text-gray-900">{item.quantity} {item.unit}</p>
                  {item.receivedQuantity > 0 && (
                    <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Received: {item.receivedQuantity} {item.unit}
                    </p>
                  )}
                  {item.receivedQuantity > 0 && !item.manuallyCompleted && item.receivedQuantity < item.quantity && (
                    <p className="text-sm text-orange-600 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Pending: {item.quantity - item.receivedQuantity} {item.unit}
                    </p>
                  )}
                  {item.manuallyCompleted && (
                    <p className="text-sm text-green-600 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Manually Completed
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Weight</label>
                  <p className="text-base font-medium text-gray-900">{(item.weight || item.specifications?.weight || 0)} Kg</p>
                  {item.receivedWeight > 0 && (
                    <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Received: {item.receivedWeight.toFixed(2)} Kg
                    </p>
                  )}
                  {item.receivedWeight > 0 && !item.manuallyCompleted && item.receivedWeight < (item.weight || 0) && (
                    <p className="text-sm text-orange-600 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Pending: {((item.weight || 0) - item.receivedWeight).toFixed(2)} Kg
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Actions */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button
          onClick={onClose}
          className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Close
        </button>
      </div>
    </div>
  );
};

export default PurchaseOrderDetail;
