import React, { useState, useEffect } from 'react';
import { ClipboardList, Info, Package, MapPin, X } from 'lucide-react';
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
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold">{grn.grnNumber}</h2>
            </div>
            <p className="text-green-100 ml-[52px]">Created on {formatDate(grn.createdAt)}</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-xl shadow-md ${
              grn.receiptStatus === 'Complete' ? 'bg-white text-green-700' : 
              grn.receiptStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-gray-100 text-gray-800'
            }`}>
              {grn.receiptStatus || 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* GRN Information */}
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center mb-6">
          <svg className="h-6 w-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900">GRN Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <span className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              GRN Number
            </span>
            <p className="text-lg font-bold text-gray-900 mt-2">{grn.grnNumber}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <span className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PO Reference
            </span>
            <p className="text-lg font-bold text-gray-900 mt-2">{grn.poNumber}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <span className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Receipt Date
            </span>
            <p className="text-lg font-bold text-gray-900 mt-2">{formatDate(grn.receiptDate)}</p>
          </div>
        </div>
      </div>

      {/* Supplier Information */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-purple-100">
        <div className="flex items-center mb-4">
          <svg className="h-6 w-6 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900">Supplier Information</h3>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <span className="text-sm font-medium text-gray-500">Company Name</span>
          <p className="text-lg font-bold text-gray-900 mt-1">{grn.supplierDetails?.companyName}</p>
        </div>
      </div>

      {/* Items */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl shadow-sm border border-orange-100 overflow-hidden">
        <div className="px-6 py-4 flex items-center">
          <svg className="h-6 w-6 text-orange-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900">Items Received</h3>
        </div>
        
        <div className="overflow-x-auto bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Ordered
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider bg-blue-50">
                  Previously Received
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-green-700 uppercase tracking-wider bg-green-50">
                  This GRN
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-orange-700 uppercase tracking-wider bg-orange-50">
                  Pending
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
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
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 shadow-sm border border-indigo-100">
          <div className="flex items-center mb-4">
            <svg className="h-6 w-6 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900">Warehouse Information</h3>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <span className="text-sm font-medium text-gray-500">Warehouse Location</span>
            <p className="text-lg font-bold text-indigo-600 mt-1 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              {getWarehouseName(grn.warehouseLocation)}
            </p>
          </div>
        </div>
      )}

      {/* Additional Information */}
      {grn.generalNotes && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-blue-100">
          <div className="flex items-center mb-4">
            <svg className="h-6 w-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900">Additional Information</h3>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <span className="text-sm font-medium text-gray-500">General Notes</span>
            <p className="text-base text-gray-900 mt-2 whitespace-pre-wrap">{grn.generalNotes}</p>
          </div>
        </div>
      )}


      {/* Actions */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Close
        </button>
      </div>
    </div>
  );
};

export default GRNDetail;
