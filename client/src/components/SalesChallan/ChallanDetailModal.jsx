import React, { useState, useEffect } from 'react';
import { FileText, X, Info, Package, Download, Printer, FileEdit, Truck, StickyNote, CheckCircle, Eye } from 'lucide-react';
import { salesChallanUtils, salesChallanAPI } from '../../services/salesChallanAPI';
import { salesOrderAPI } from '../../services/salesOrderAPI';
import { warehouseAPI } from '../../services/warehouseAPI';

const ChallanDetailModal = ({ isOpen, onClose, challan }) => {
  const [soData, setSOData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [resolvedWarehouse, setResolvedWarehouse] = useState('');
  
  // Fetch SO data and resolve warehouse name
  useEffect(() => {
    const fetchSOData = async () => {
      if (challan?.salesOrder) {
        try {
          setLoading(true);
          const soId = typeof challan.salesOrder === 'object' && challan.salesOrder !== null
            ? challan.salesOrder._id || challan.salesOrder
            : challan.salesOrder;
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

    const resolveWarehouse = async () => {
      if (!challan?.warehouseLocation) { setResolvedWarehouse(''); return; }
      try {
        const res = await warehouseAPI.getAll();
        const locations = res.data || [];
        const match = locations.find(w => w._id === challan.warehouseLocation || w.name === challan.warehouseLocation);
        setResolvedWarehouse(match ? match.name : challan.warehouseLocation);
      } catch {
        setResolvedWarehouse(challan.warehouseLocation);
      }
    };
    
    if (isOpen) {
      fetchSOData();
      resolveWarehouse();
    }
  }, [challan?.salesOrder, challan?.warehouseLocation, isOpen]);
  
  // Handle PDF Preview — opens in-app modal
  const handleViewPDF = async () => {
    try {
      setPdfLoading(true);
      setPdfError('');
      const result = await salesChallanAPI.previewPDF(challan._id);
      setPdfPreviewUrl(result.blobUrl);
    } catch (error) {
      console.error('Error viewing PDF:', error);
      setPdfError('Failed to load PDF preview. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleClosePdfPreview = () => {
    if (pdfPreviewUrl) window.URL.revokeObjectURL(pdfPreviewUrl);
    setPdfPreviewUrl(null);
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

  const getProductGroups = () => {
    const groups = [];
    const seen = new Map();
    (challan.items || []).forEach((item, index) => {
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
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Challan Information */}
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center mb-6 gap-3">
              <Info className="h-5 w-5 text-gray-600" />
              <h3 className="text-base font-semibold text-gray-900">Challan Information</h3>
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
                <p className="text-base font-bold text-purple-600 mt-1">{resolvedWarehouse || challan.warehouseLocation || 'N/A'}</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expected Delivery</span>
                <p className="text-base font-bold text-gray-900 mt-1">{formatDate(challan.expectedDeliveryDate)}</p>
              </div>
            </div>
            
            {/* Dispatch Notes Section - Only show when notes exist */}
            {challan.notes && challan.notes.trim() && (
              <div className="mt-6 bg-white rounded-lg p-4 shadow-sm border border-blue-200">
                <div className="flex items-center mb-2">
                  <FileEdit className="h-4 w-4 text-blue-500 mr-2" />
                  <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Dispatch Notes</span>
                </div>
                <p className="text-sm text-gray-700 bg-blue-50 rounded-lg p-3 border border-blue-100">
                  {challan.notes}
                </p>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 shadow-sm border border-orange-100">
            <div className="flex items-center mb-6 gap-3">
              <Truck className="h-5 w-5 text-orange-600" />
              <h3 className="text-base font-semibold text-gray-900">Dispatched Items</h3>
              <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full">
                {getProductGroups().length} product{getProductGroups().length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Product / Variant</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">SO Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">This Challan</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Bag Weights</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getProductGroups().map((group, groupIndex) => (
                    <React.Fragment key={groupIndex}>
                      <tr className="bg-blue-50">
                        <td className="px-6 py-2" colSpan="4">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-bold text-gray-900">{group.productName || 'N/A'}</span>
                              {group.productCode && (
                                <span className="text-xs text-gray-500 ml-2">({group.productCode})</span>
                              )}
                            </div>
                            <span className="text-xs text-blue-700 font-medium">Unit: {group.unit || 'Bags'}</span>
                          </div>
                        </td>
                      </tr>
                      {group.items.map((item, rowIndex) => {
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
                        (si.product === item.product || 
                        si.product?._id === item.product ||
                        si._id?.toString() === item.salesOrderItem?.toString()) &&
                        (si.subProduct === item.subProduct || si.subProduct?._id === item.subProduct)
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
                      <tr key={rowIndex} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          {item.subProductName ? (
                            <div className="text-sm font-semibold text-green-700">
                              {item.productName} × {item.subProductName}
                            </div>
                          ) : (
                            <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                          )}
                          {item.notes && (
                            <div className="text-xs text-blue-600 italic mt-1 flex items-center gap-1">
                              <StickyNote className="w-3 h-3 flex-shrink-0" /> {item.notes}
                            </div>
                          )}
                          {manuallyCompleted && (
                            <div className="text-xs text-green-600 mt-1 font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{soTotalQty} {item.unit}</div>
                          {totalDispatched > 0 && totalDispatched !== dispatchedInThisChallan && (
                            <div className="text-xs text-green-600 mt-0.5">Cumulative: {totalDispatched}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-teal-700">{dispatchedInThisChallan} {item.unit}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{(item.weight || 0).toFixed(2)} kg total</div>
                        </td>
                        <td className="px-6 py-4">
                          {Array.isArray(item.subProductWeights) && item.subProductWeights.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {item.subProductWeights.map((w, wi) => (
                                <span key={wi} className="px-2 py-0.5 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 rounded">
                                  {Number(w).toFixed(2)} kg
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-700">{(item.weight || 0).toFixed(2)} kg</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
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
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pdfLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    View PDF
                  </>
                )}
              </button>
              
              <button
                onClick={handleDownloadPDF}
                disabled={pdfLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pdfLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
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

      {/* PDF Preview Modal */}
      {pdfPreviewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col" style={{ height: '90vh' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-semibold text-gray-900">Challan PDF — {challan.challanNumber}</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadPDF}
                  disabled={pdfLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={handleClosePdfPreview}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Close
                </button>
              </div>
            </div>
            <iframe
              src={pdfPreviewUrl}
              className="flex-1 w-full rounded-b-2xl"
              title="Challan PDF Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallanDetailModal;
