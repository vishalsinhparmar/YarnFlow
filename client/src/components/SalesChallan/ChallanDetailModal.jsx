import React, { useState, useEffect } from 'react';
import { salesChallanUtils } from '../../services/salesChallanAPI';
import { salesOrderAPI } from '../../services/salesOrderAPI';

const ChallanDetailModal = ({ isOpen, onClose, challan }) => {
  const [soData, setSOData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Fetch SO data to get total dispatched information
  useEffect(() => {
    const fetchSOData = async () => {
      if (challan?.salesOrder) {
        try {
          setLoading(true);
          // Extract ID if salesOrder is an object, otherwise use as-is
          const soId = typeof challan.salesOrder === 'object' && challan.salesOrder !== null
            ? challan.salesOrder._id || challan.salesOrder
            : challan.salesOrder;
          
          // Only fetch if we have a valid ID string
          if (soId && typeof soId === 'string') {
            const response = await salesOrderAPI.getById(soId);
            setSOData(response.data);
          }
        } catch (error) {
          console.error('Error fetching SO data:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    if (isOpen) {
      fetchSOData();
    }
  }, [challan?.salesOrder, isOpen]);
  
  if (!isOpen || !challan) return null;

  // Calculate challan completion status
  const calculateChallanStatus = () => {
    if (!challan.items || challan.items.length === 0) return 'Pending';
    
    let allComplete = true;
    let anyPartial = false;
    
    challan.items.forEach(item => {
      const dispatched = item.dispatchQuantity || 0;
      const ordered = item.orderedQuantity || 0;
      const manuallyCompleted = item.manuallyCompleted || false;
      
      if (manuallyCompleted || dispatched >= ordered) {
        // Complete
      } else if (dispatched > 0 && dispatched < ordered) {
        allComplete = false;
        anyPartial = true;
      } else {
        allComplete = false;
      }
    });
    
    if (allComplete) return 'Delivered';
    if (anyPartial) return 'Partial';
    return 'Pending';
  };

  const challanStatus = calculateChallanStatus();
  
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
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{challan.challanNumber}</h2>
              <p className="text-gray-600">Created on {formatDate(challan.createdAt)}</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                challanStatus === 'Delivered' ? 'bg-green-100 text-green-800' :
                challanStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {challanStatus}
              </span>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Challan Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <span className="text-sm font-medium text-gray-500">Challan Number</span>
                <p className="text-base font-semibold text-gray-900 mt-1">{challan.challanNumber}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">SO Reference</span>
                <p className="text-base font-semibold text-gray-900 mt-1">{challan.soReference || 'N/A'}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">Dispatch Date</span>
                <p className="text-base font-semibold text-gray-900 mt-1">{formatDate(challan.challanDate)}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">Customer</span>
                <p className="text-base font-semibold text-gray-900 mt-1">{challan.customerDetails?.companyName || challan.customerName || 'N/A'}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">Warehouse Location</span>
                <p className="text-base font-semibold text-gray-900 mt-1">{challan.warehouseLocation || 'N/A'}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">Expected Delivery</span>
                <p className="text-base font-semibold text-gray-900 mt-1">{formatDate(challan.expectedDeliveryDate)}</p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dispatched Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SO Total Qty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      This Challan Qty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Weight
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Challan Completion
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {challan.items?.map((item, index) => {
                    const dispatchedInThisChallan = item.dispatchQuantity || 0;
                    const soTotalQty = item.orderedQuantity || 0;
                    const manuallyCompleted = item.manuallyCompleted || false;
                    
                    // Calculate REAL completion based on SO data (like GRN does with PO)
                    let totalDispatched = dispatchedInThisChallan;
                    let completionPercent = 0;
                    let itemStatus = 'Pending';
                    
                    if (soData && soData.items) {
                      // Find the SO item to get total dispatched across all challans
                      const soItem = soData.items.find(si => 
                        si.product === item.product || 
                        si.product?._id === item.product ||
                        si._id?.toString() === item.salesOrderItem?.toString()
                      );
                      
                      if (soItem) {
                        // Get total dispatched from SO item (includes all challans)
                        totalDispatched = soItem.deliveredQuantity || soItem.shippedQuantity || dispatchedInThisChallan;
                        
                        // Calculate completion percentage: total dispatched / SO quantity
                        completionPercent = soItem.quantity > 0 
                          ? Math.round((totalDispatched / soItem.quantity) * 100)
                          : 0;
                        
                        // Determine status based on total dispatched vs SO quantity
                        if (manuallyCompleted || totalDispatched >= soItem.quantity) {
                          itemStatus = 'Complete';
                        } else if (totalDispatched > 0) {
                          itemStatus = 'Partial';
                        } else {
                          itemStatus = 'Pending';
                        }
                      } else {
                        // Fallback if SO item not found
                        completionPercent = dispatchedInThisChallan > 0 ? 100 : 0;
                        itemStatus = dispatchedInThisChallan > 0 ? 'Complete' : 'Pending';
                      }
                    } else {
                      // Fallback if SO data not loaded yet
                      completionPercent = dispatchedInThisChallan > 0 ? 100 : 0;
                      itemStatus = dispatchedInThisChallan > 0 ? 'Complete' : 'Pending';
                    }
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                          <div className="text-sm text-gray-500">{item.productCode}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {soTotalQty} {item.unit}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{dispatchedInThisChallan} {item.unit}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Total: {totalDispatched} / {soTotalQty} {item.unit}
                          </div>
                          {manuallyCompleted && (
                            <div className="text-xs text-green-600 mt-1">✓ Manually Completed</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {(item.weight || 0).toFixed(2)} kg
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  completionPercent === 100 ? 'bg-green-600' :
                                  completionPercent > 0 ? 'bg-yellow-600' :
                                  'bg-gray-400'
                                }`}
                                style={{ width: `${Math.min(completionPercent, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-700 min-w-[45px]">
                              {completionPercent}%
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
          {challan.notes && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-sm text-gray-700">{challan.notes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChallanDetailModal;
