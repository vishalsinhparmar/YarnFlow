import React from 'react';
import { salesChallanUtils } from '../services/salesChallanAPI';

const ChallanDetailModal = ({ isOpen, onClose, challan, onStatusUpdate }) => {
  if (!isOpen || !challan) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Challan Details - {challan.challanNumber}
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

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Challan Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Challan Number:</span>
                  <span>{challan.challanNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Challan Date:</span>
                  <span>{salesChallanUtils.formatDate(challan.challanDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">SO Reference:</span>
                  <span>{challan.soReference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${salesChallanUtils.getStatusColor(challan.status)}`}>
                    {salesChallanUtils.formatStatus(challan.status)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Total Value:</span>
                  <span>{salesChallanUtils.formatCurrency(challan.totalValue)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Company:</span>
                  <span>{challan.customerDetails?.companyName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Contact Person:</span>
                  <span>{challan.customerDetails?.contactPerson || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Phone:</span>
                  <span>{challan.customerDetails?.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Email:</span>
                  <span>{challan.customerDetails?.email || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Address</h3>
            <div className="text-sm">
              <p>{challan.deliveryAddress?.street}</p>
              <p>{challan.deliveryAddress?.city}, {challan.deliveryAddress?.state} - {challan.deliveryAddress?.pincode}</p>
              <p>{challan.deliveryAddress?.country}</p>
            </div>
          </div>

          {/* Transport Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Transport Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Vehicle Number:</span>
                <span>{challan.transportDetails?.vehicleNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Vehicle Type:</span>
                <span>{challan.transportDetails?.vehicleType || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Driver Name:</span>
                <span>{challan.transportDetails?.driverName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Driver Phone:</span>
                <span>{challan.transportDetails?.driverPhone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Transporter:</span>
                <span>{challan.transportDetails?.transporterName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Freight Charges:</span>
                <span>{salesChallanUtils.formatCurrency(challan.transportDetails?.freightCharges)}</span>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Product
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Code
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Ordered Qty
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Dispatch Qty
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Unit Price
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {challan.items?.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {item.productName}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {item.productCode}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {item.orderedQuantity} {item.unit}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {item.dispatchQuantity} {item.unit}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {salesChallanUtils.formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {salesChallanUtils.formatCurrency(item.totalValue)}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${salesChallanUtils.getStatusColor(item.itemStatus)}`}>
                          {salesChallanUtils.formatStatus(item.itemStatus)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Expected Delivery:</span>
                <span>{salesChallanUtils.formatDate(challan.deliveryDetails?.expectedDeliveryDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Actual Delivery:</span>
                <span>{salesChallanUtils.formatDate(challan.deliveryDetails?.actualDeliveryDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Received By:</span>
                <span>{challan.deliveryDetails?.receivedBy || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Delivery Notes:</span>
                <span>{challan.deliveryDetails?.deliveryNotes || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Status History */}
          {challan.statusHistory && challan.statusHistory.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Status History</h3>
              <div className="space-y-3">
                {challan.statusHistory.map((history, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                    <div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${salesChallanUtils.getStatusColor(history.status)}`}>
                        {salesChallanUtils.formatStatus(history.status)}
                      </span>
                      <span className="ml-2 text-sm text-gray-600">{history.notes}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      <div>{salesChallanUtils.formatDate(history.timestamp)}</div>
                      <div>by {history.updatedBy}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {challan.preparationNotes && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Preparation Notes</h3>
              <p className="text-sm text-gray-700">{challan.preparationNotes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          
          {salesChallanUtils.canUpdate(challan.status) && (
            <button
              onClick={() => {
                onClose();
                // This would trigger the status update modal
                // The parent component handles this logic
              }}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md"
            >
              Update Status
            </button>
          )}
          
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChallanDetailModal;
