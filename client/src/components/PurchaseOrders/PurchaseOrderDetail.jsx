import React from 'react';
import { ClipboardList, Building2, Calendar, Clock, Tag, CheckCircle2, CheckCircle, Package, X, FileText } from 'lucide-react';
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

  const getProductGroups = () => {
    const groups = [];
    const seen = new Map();
    (purchaseOrder.items || []).forEach((item, index) => {
      const key = item.product || `__empty__${index}`;
      if (!seen.has(key)) {
        seen.set(key, {
          product: item.product,
          productName: item.productName,
          productCode: item.productCode,
          unit: item.unit,
          indices: [],
          items: []
        });
        groups.push(seen.get(key));
      }
      seen.get(key).indices.push(index);
      seen.get(key).items.push(item);
    });
    return groups;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="text-white">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold">{purchaseOrder.poNumber}</h2>
            </div>
            <p className="text-orange-100 ml-[52px] text-sm">Created {formatDate(purchaseOrder.createdAt)}</p>
          </div>
          <span className={`inline-flex px-3 py-1.5 text-sm font-semibold rounded-lg shadow ${
            purchaseOrder.status === 'Fully_Received' ? 'bg-white text-green-700' :
            purchaseOrder.status === 'Partially_Received' ? 'bg-yellow-100 text-yellow-800' :
            purchaseOrder.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {poUtils.formatStatus(purchaseOrder.status)}
          </span>
        </div>
        {/* Progress bar */}
        <div className="mt-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-orange-100 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Receipt Progress
            </span>
            <span className="text-xs font-bold text-white">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-black bg-opacity-20 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                completionPercentage === 100 ? 'bg-green-300' :
                completionPercentage > 0 ? 'bg-yellow-300' : 'bg-white bg-opacity-30'
              }`}
              style={{ width: `${Math.min(completionPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Key Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
            <Building2 className="w-3.5 h-3.5 text-blue-500" /> Supplier
          </label>
          <p className="text-base font-bold text-gray-900">{purchaseOrder.supplierDetails?.companyName || '—'}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
            <Calendar className="w-3.5 h-3.5 text-green-500" /> Order Date
          </label>
          <p className="text-base font-bold text-gray-900">{formatDate(purchaseOrder.orderDate)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
            <Clock className="w-3.5 h-3.5 text-orange-500" /> Expected Delivery
          </label>
          <p className="text-base font-bold text-gray-900">
            {purchaseOrder.expectedDeliveryDate ? formatDate(purchaseOrder.expectedDeliveryDate) : <span className="text-gray-400 font-normal text-sm">Not specified</span>}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
            <Tag className="w-3.5 h-3.5 text-purple-500" /> Category
          </label>
          <p className="text-base font-bold text-gray-900">{purchaseOrder.category?.categoryName || '—'}</p>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <Package className="w-5 h-5 text-orange-600" />
          <h3 className="text-base font-semibold text-gray-900">
            Items — {getProductGroups().length} product{getProductGroups().length !== 1 ? 's' : ''}
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {getProductGroups().map((group, groupIndex) => (
            <div key={groupIndex} className="p-6">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <div>
                  <p className="text-base font-semibold text-gray-900">{group.productName}</p>
                  {group.productCode && <p className="text-xs text-gray-400">{group.productCode}</p>}
                </div>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{group.unit}</span>
              </div>

              {(() => {
                const hasSubProducts = group.items.some(i => i.subProductName);
                return (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      {hasSubProducts && <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Variant</th>}
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Ordered</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-green-700 uppercase tracking-wide bg-green-50">Received</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {group.items.map((item, rowIndex) => {
                      const isComplete = item.manuallyCompleted || item.receivedQuantity >= item.quantity;
                      return (
                        <tr key={rowIndex} className="hover:bg-gray-50">
                          {hasSubProducts && (
                          <td className="px-3 py-3">
                            {item.subProductName
                              ? <span className="font-medium text-green-700">{item.productName} × {item.subProductName}</span>
                              : <span className="text-gray-400 text-xs">—</span>
                            }
                            {Array.isArray(item.subProductWeights) && item.subProductWeights.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.subProductWeights.map((w, wi) => (
                                  <span key={wi} className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                    {Number(w) % 1 === 0 ? Number(w) : Number(w).toFixed(2)} kg
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.notes && (
                              <div className="text-xs text-blue-600 italic mt-1 flex items-center gap-1">
                                <FileText className="w-3 h-3" /> {item.notes}
                              </div>
                            )}
                          </td>
                          )}
                          <td className="px-3 py-3">
                            <div className="font-medium text-gray-900">{item.quantity} {item.unit}</div>
                            {(item.weight || 0) > 0 && (
                              <div className="text-xs text-gray-500">{item.weight} kg</div>
                            )}
                            {!hasSubProducts && item.notes && (
                              <div className="text-xs text-blue-600 italic mt-1 flex items-center gap-1">
                                <FileText className="w-3 h-3" /> {item.notes}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 bg-green-50">
                            {item.receivedQuantity > 0 ? (
                              <>
                                <div className="font-semibold text-green-700 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {item.receivedQuantity} {item.unit}
                                </div>
                                {item.receivedWeight > 0 && (
                                  <div className="text-xs text-green-600">{item.receivedWeight.toFixed(2)} kg</div>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
                              isComplete ? 'bg-green-100 text-green-800' :
                              item.receivedQuantity > 0 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {isComplete ? 'Complete' : item.receivedQuantity > 0 ? 'Partial' : 'Not Received'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
                );
              })()}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Close
        </button>
      </div>
    </div>
  );
};

export default PurchaseOrderDetail;
