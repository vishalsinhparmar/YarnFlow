import React, { useState, useEffect } from 'react';
import { FileText, X, Info, Package, Download, Printer } from 'lucide-react';
import { salesChallanUtils, salesChallanAPI } from '../../services/salesChallanAPI';
import { salesOrderAPI } from '../../services/salesOrderAPI';

const ChallanDetailModal = ({ isOpen, onClose, challan }) => {
  const [soData, setSOData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState('');
  
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
  
  // Handle PDF Preview
  const handleViewPDF = async () => {
    try {
      setPdfLoading(true);
      setPdfError('');
      await salesChallanAPI.previewPDF(challan._id);
    } catch (error) {
      console.error('Error viewing PDF:', error);
      setPdfError('Failed to open PDF preview. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  // Handle PDF Download
  const handleDownloadPDF = async () => {
    try {
      setPdfLoading(true);
      setPdfError('');
      await salesChallanAPI.generatePDF(challan._id);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setPdfError('Failed to download PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };
  
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
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-teal-600 to-emerald-600 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{challan.challanNumber}</h2>
                  <p className="text-teal-100 text-sm">Created on {formatDate(challan.createdAt)}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex px-4 py-1.5 text-sm font-semibold rounded-lg shadow-sm ${
                challanStatus === 'Delivered' ? 'bg-green-500 text-white' :
                challanStatus === 'Partial' ? 'bg-yellow-500 text-white' :
                'bg-gray-100 text-gray-800'
              }`}>
                {challanStatus}
              </span>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Challan Information */}
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center mb-6">
              <svg className="h-6 w-6 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900">Challan Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Challan Number</span>
                <p className="text-base font-bold text-gray-900 mt-1">{challan.challanNumber}</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">SO Reference</span>
                <p className="text-base font-bold text-teal-600 mt-1">{challan.soReference || 'N/A'}</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Dispatch Date</span>
                <p className="text-base font-bold text-gray-900 mt-1">{formatDate(challan.challanDate)}</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Customer</span>
                <p className="text-base font-bold text-gray-900 mt-1">{challan.customerDetails?.companyName || challan.customerName || 'N/A'}</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Warehouse Location</span>
                <p className="text-base font-bold text-purple-600 mt-1">{challan.warehouseLocation || 'N/A'}</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expected Delivery</span>
                <p className="text-base font-bold text-gray-900 mt-1">{formatDate(challan.expectedDeliveryDate)}</p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 shadow-sm border border-orange-100">
            <div className="flex items-center mb-6">
              <svg className="h-6 w-6 text-orange-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900">Dispatched Items</h3>
              <span className="ml-3 bg-orange-100 text-orange-800 text-sm font-medium px-3 py-1 rounded-full">
                {challan.items?.length || 0} item(s)
              </span>
            </div>
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
                          {item.notes && (
                            <div className="text-xs text-blue-600 italic bg-blue-50 px-2 py-1 rounded mt-1 inline-block">
                              📝 {item.notes}
                            </div>
                          )}
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
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-blue-100">
              <div className="flex items-center mb-3">
                <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Dispatch Notes</h3>
              </div>
              <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border border-blue-100">{challan.notes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-5 border-t border-gray-200 bg-gray-50 flex-shrink-0 rounded-b-2xl">
          {/* PDF Error Message */}
          {pdfError && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 rounded-lg p-3">
              <p className="text-sm text-red-800">{pdfError}</p>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            {/* PDF Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleViewPDF}
                disabled={pdfLoading}
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pdfLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View PDF
                  </>
                )}
              </button>
              
              <button
                onClick={handleDownloadPDF}
                disabled={pdfLoading}
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pdfLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </>
                )}
              </button>
            </div>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallanDetailModal;
