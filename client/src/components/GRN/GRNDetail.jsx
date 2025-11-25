import React, { useState, useEffect } from 'react';
import { grnUtils } from '../../services/grnAPI';
import { purchaseOrderAPI } from '../../services/purchaseOrderAPI';
import { getWarehouseName } from '../../constants/warehouseLocations';

const GRNDetail = ({ grn, onClose }) => {
  const [poData, setPOData] = useState(null);
  
  // Fetch PO data to get previouslyReceived information
  useEffect(() => {
    const fetchPOData = async () => {
      if (grn.purchaseOrder) {
        try {
          // Extract ID if purchaseOrder is an object, otherwise use as-is
          const poId = typeof grn.purchaseOrder === 'object' && grn.purchaseOrder !== null
            ? grn.purchaseOrder._id || grn.purchaseOrder
            : grn.purchaseOrder;
          
          // Only fetch if we have a valid ID string
          if (poId && typeof poId === 'string') {
            const response = await purchaseOrderAPI.getById(poId);
            setPOData(response.data);
          }
        } catch (error) {
          console.error('Error fetching PO data:', error);
        }
      }
    };
    
    fetchPOData();
  }, [grn.purchaseOrder]);

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
        </div>
      </div>

      {/* Approval Modal - Keeping for quality check approval */}
      {false && (
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <span className="text-sm font-medium text-gray-500">GRN Number</span>
            <p className="text-base font-semibold text-gray-900 mt-1">{grn.grnNumber}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">PO Reference</span>
            <p className="text-base font-semibold text-gray-900 mt-1">{grn.poNumber}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Receipt Date</span>
            <p className="text-base font-semibold text-gray-900 mt-1">{formatDate(grn.receiptDate)}</p>
          </div>
          {grn.deliveryDate && (
            <div>
              <span className="text-sm font-medium text-gray-500">Delivery Date</span>
              <p className="text-base font-semibold text-gray-900 mt-1">{formatDate(grn.deliveryDate)}</p>
            </div>
          )}
          <div>
            <span className="text-sm font-medium text-gray-500">Status</span>
            <div className="mt-1">
              <span className={'inline-flex px-3 py-1.5 text-sm font-semibold rounded-full ' + (grn.receiptStatus === 'Complete' ? 'bg-green-100 text-green-800' : grn.receiptStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800')}>
                {grn.receiptStatus || 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Supplier Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Information</h3>
        
        <div>
          <span className="text-sm font-medium text-gray-500">Company Name</span>
          <p className="text-base font-semibold text-gray-900 mt-1">{grn.supplierDetails?.companyName}</p>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                  Previously Received
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                  This GRN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-orange-50">
                  Pending
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {grn.items?.map((item, index) => {
                // Find matching PO item to get receivedQuantity and receivedWeight
                let previouslyReceived = item.previouslyReceived || 0;
                let previousWeight = item.previousWeight || 0;
                
                if (poData && poData.items) {
                  const poItem = poData.items.find(pi => pi._id === item.purchaseOrderItem);
                  if (poItem) {
                    // PO has total received (including this GRN)
                    // So previouslyReceived = PO.receivedQuantity - thisGRN.receivedQuantity
                    previouslyReceived = (poItem.receivedQuantity || 0) - item.receivedQuantity;
                    
                    // Calculate previousWeight
                    if (poItem.receivedWeight) {
                      previousWeight = poItem.receivedWeight - (item.receivedWeight || 0);
                    } else if (previouslyReceived > 0 && item.orderedQuantity > 0 && item.orderedWeight > 0) {
                      const weightPerUnit = item.orderedWeight / item.orderedQuantity;
                      previousWeight = previouslyReceived * weightPerUnit;
                    }
                  }
                }
                
                // If still 0, try to calculate from item data
                if (previousWeight === 0 && previouslyReceived > 0 && item.orderedQuantity > 0 && item.orderedWeight > 0) {
                  const weightPerUnit = item.orderedWeight / item.orderedQuantity;
                  previousWeight = previouslyReceived * weightPerUnit;
                }
                
                // Calculate receivedWeight if not available
                let receivedWeight = item.receivedWeight || 0;
                if (receivedWeight === 0 && item.receivedQuantity > 0 && item.orderedQuantity > 0 && item.orderedWeight > 0) {
                  const weightPerUnit = item.orderedWeight / item.orderedQuantity;
                  receivedWeight = item.receivedQuantity * weightPerUnit;
                }
                
                // Check if item is manually completed in PO
                let isManuallyCompleted = false;
                if (poData && poData.items) {
                  const poItem = poData.items.find(pi => pi._id === item.purchaseOrderItem);
                  if (poItem) {
                    isManuallyCompleted = poItem.manuallyCompleted || false;
                  }
                }
                
                // Calculate pending
                const pendingQty = isManuallyCompleted ? 0 : Math.max(0, (item.orderedQuantity || 0) - (previouslyReceived + item.receivedQuantity));
                const pendingWeight = isManuallyCompleted ? 0 : Math.max(0, (item.orderedWeight || 0) - (previousWeight + receivedWeight));
                
                const completionPct = item.orderedQuantity > 0 ? Math.round((previouslyReceived + item.receivedQuantity) / item.orderedQuantity * 100) : 0;
                
                return (
                  <tr key={index}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                      <div className="text-sm text-gray-500">{item.productCode}</div>
                      {item.batchNumber && (
                        <div className="text-xs text-gray-400">Batch: {item.batchNumber}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {item.orderedQuantity} {item.unit}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.orderedWeight > 0 ? item.orderedWeight + ' kg' : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 bg-blue-50">
                      <div className="text-sm font-medium text-blue-700">
                        {previouslyReceived} {item.unit}
                      </div>
                      <div className="text-xs text-blue-600">
                        {previousWeight.toFixed(2)} kg
                      </div>
                    </td>
                    <td className="px-6 py-4 bg-green-50">
                      <div className="text-sm font-medium text-green-700">
                        {item.receivedQuantity} {item.unit}
                      </div>
                      <div className="text-xs text-green-600">
                        {receivedWeight.toFixed(2)} kg
                      </div>
                      {item.acceptedQuantity > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Accepted: {item.acceptedQuantity} {item.unit}
                        </div>
                      )}
                      {item.rejectedQuantity > 0 && (
                        <div className="text-xs text-red-500 mt-1">
                          Rejected: {item.rejectedQuantity} {item.unit}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 bg-orange-50">
                      <div className="text-sm font-medium text-orange-700">
                        {pendingQty} {item.unit}
                      </div>
                      <div className="text-xs text-orange-600">
                        {pendingWeight.toFixed(2)} kg
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={'h-1.5 rounded-full ' + (completionPct === 100 ? 'bg-green-600' : completionPct > 0 ? 'bg-blue-600' : 'bg-gray-400')}
                            style={{ width: completionPct + '%' }}
                          />
                        </div>
                        <div className="text-xs text-center text-gray-600 mt-0.5">
                          {completionPct}%
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={'inline-flex px-2 py-1 text-xs font-semibold rounded-full ' + (
                        isManuallyCompleted || (pendingQty === 0 && item.receivedQuantity > 0) ? 'bg-green-100 text-green-800' :
                        item.receivedQuantity > 0 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      )}>
                        {isManuallyCompleted ? 'Complete ✓' : pendingQty === 0 && item.receivedQuantity > 0 ? 'Complete' : item.receivedQuantity > 0 ? 'Partial' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>


      {/* Warehouse Information */}
      {grn.warehouseLocation && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Warehouse Information</h3>
          
          <div>
            <span className="text-sm font-medium text-gray-500">Warehouse Location</span>
            <p className="text-base font-medium text-purple-600 mt-1 flex items-center">
              <span className="mr-2">📍</span>
              {getWarehouseName(grn.warehouseLocation)}
            </p>
          </div>
        </div>
      )}

      {/* Additional Information */}
      {grn.generalNotes && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
          
          <div>
            <span className="text-sm font-medium text-gray-500">General Notes</span>
            <p className="text-base text-gray-900 mt-1 whitespace-pre-wrap">{grn.generalNotes}</p>
          </div>
        </div>
      )}


      {/* Actions */}
      <div className="flex justify-end pt-6 border-t">
        <button
          onClick={onClose}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default GRNDetail;
