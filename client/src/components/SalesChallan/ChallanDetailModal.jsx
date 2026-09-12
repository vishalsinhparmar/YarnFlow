import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  MapPin,
  Package,
  Scale,
  StickyNote,
  Truck,
  User,
  X
} from 'lucide-react';
import { salesChallanAPI, salesChallanUtils } from '../../services/salesChallanAPI';
import { salesOrderAPI } from '../../services/salesOrderAPI';
import { warehouseAPI } from '../../services/warehouseAPI';

const toId = (value) => String(value?._id || value || '');

const formatDate = (date) => {
  if (!date) return 'Not set';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Not set';
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const getStatusClass = (status) => {
  if (status === 'Complete' || status === 'Delivered') return 'bg-green-100 text-green-800 border-green-200';
  if (status === 'Partial') return 'bg-amber-100 text-amber-800 border-amber-200';
  if (status === 'Cancelled') return 'bg-red-100 text-red-800 border-red-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
};

const getChallanCompletionStatus = (items) => {
  if (!items?.length) return 'Pending';
  const complete = items.every((item) =>
    item.manuallyCompleted || Number(item.dispatchQuantity) >= Number(item.orderedQuantity)
  );
  if (complete) return 'Complete';
  return items.some((item) => Number(item.dispatchQuantity) > 0) ? 'Partial' : 'Pending';
};

const DetailField = ({ icon: Icon, label, value, valueClassName = '' }) => (
  <div className="min-w-0 px-4 py-3">
    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-gray-500">
      {React.createElement(Icon, { className: 'h-3.5 w-3.5' })}
      <span>{label}</span>
    </div>
    <p className={`mt-1 break-words text-sm font-semibold text-gray-900 ${valueClassName}`}>
      {value}
    </p>
  </div>
);

const DetailLoading = () => (
  <div className="animate-pulse space-y-6 p-4 sm:p-6" aria-label="Loading challan details">
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 md:grid-cols-3">
      {Array.from({ length: 9 }).map((_, index) => (
        <div key={index} className="h-20 bg-white p-4">
          <div className="h-3 w-20 rounded bg-gray-200" />
          <div className="mt-3 h-4 w-32 max-w-full rounded bg-gray-200" />
        </div>
      ))}
    </div>
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <div className="h-11 bg-gray-100" />
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="grid grid-cols-5 gap-4 border-t border-gray-100 px-4 py-5">
          {Array.from({ length: 5 }).map((__, cellIndex) => (
            <div key={cellIndex} className="h-4 rounded bg-gray-200" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

const ChallanDetailModal = ({ isOpen, onClose, challan }) => {
  const [detail, setDetail] = useState(challan);
  const [soData, setSOData] = useState(null);
  const [resolvedWarehouse, setResolvedWarehouse] = useState('');
  const [loading, setLoading] = useState(Boolean(isOpen && challan?._id));
  const [loadError, setLoadError] = useState('');
  const [relatedError, setRelatedError] = useState('');
  const [pdfAction, setPdfAction] = useState('');
  const [pdfError, setPdfError] = useState('');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);

  useEffect(() => {
    if (!isOpen || !challan?._id) return undefined;

    let cancelled = false;
    setDetail(challan);
    setSOData(null);
    setResolvedWarehouse(challan.warehouseLocation || '');
    setLoading(true);
    setLoadError('');
    setRelatedError('');

    const loadDetails = async () => {
      let freshChallan = challan;
      try {
        const response = await salesChallanAPI.getById(challan._id);
        if (response?.data) freshChallan = response.data;
        if (!cancelled) setDetail(freshChallan);
      } catch (error) {
        console.error('Error loading challan details:', error);
        if (!cancelled) setLoadError('The latest challan details could not be loaded. Showing the available record.');
      }

      const salesOrderId = toId(freshChallan.salesOrder);
      const relatedRequests = [];
      if (salesOrderId) relatedRequests.push(salesOrderAPI.getById(salesOrderId));
      else relatedRequests.push(Promise.resolve(null));
      relatedRequests.push(warehouseAPI.getAll());

      const [salesOrderResult, warehouseResult] = await Promise.allSettled(relatedRequests);
      if (cancelled) return;

      if (salesOrderResult.status === 'fulfilled' && salesOrderResult.value?.data) {
        setSOData(salesOrderResult.value.data);
      } else if (salesOrderId) {
        setRelatedError('Cumulative sales-order progress is temporarily unavailable.');
      }

      if (warehouseResult.status === 'fulfilled') {
        const locations = warehouseResult.value?.data || [];
        const warehouseValue = freshChallan.warehouseLocation;
        const match = locations.find((warehouse) =>
          toId(warehouse) === String(warehouseValue) || warehouse.name === warehouseValue
        );
        setResolvedWarehouse(match?.name || warehouseValue || '');
      } else {
        setResolvedWarehouse(freshChallan.warehouseLocation || '');
      }
    };

    loadDetails().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, challan]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (pdfPreviewUrl) {
          window.URL.revokeObjectURL(pdfPreviewUrl);
          setPdfPreviewUrl(null);
        } else {
          onClose();
        }
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, pdfPreviewUrl]);

  useEffect(() => () => {
    if (pdfPreviewUrl) window.URL.revokeObjectURL(pdfPreviewUrl);
  }, [pdfPreviewUrl]);

  const productGroups = useMemo(() => {
    const groups = [];
    const seen = new Map();
    (detail?.items || []).forEach((item, index) => {
      const productId = item.product?._id || item.product || `product-${index}`;
      const key = String(productId);
      if (!seen.has(key)) {
        const group = {
          key,
          productName: item.product?.productName || item.productName || 'Unnamed product',
          productCode: item.product?.productCode || item.productCode || '',
          unit: item.unit || 'Units',
          items: []
        };
        seen.set(key, group);
        groups.push(group);
      }
      seen.get(key).items.push(item);
    });
    return groups;
  }, [detail]);

  if (!isOpen || !challan) return null;

  const items = detail?.items || [];
  const challanStatus = getChallanCompletionStatus(items);
  const totalWeight = items.reduce((sum, item) => {
    if (Array.isArray(item.subProductWeights) && item.subProductWeights.length > 0) {
      return sum + item.subProductWeights.reduce((weightSum, weight) => weightSum + (Number(weight) || 0), 0);
    }
    return sum + (Number(item.weight) || 0);
  }, 0);
  const salesOrderNumber =
    detail?.soNumber ||
    detail?.soReference ||
    detail?.salesOrder?.soNumber ||
    soData?.soNumber ||
    'Not available';
  const customerName =
    detail?.customer?.companyName ||
    detail?.customerDetails?.companyName ||
    detail?.customerName ||
    'Not available';

  const getItemSnapshot = (item) => {
    const soItem = (soData?.items || []).find((candidate) => {
      if (toId(candidate._id) === toId(item.salesOrderItem)) return true;
      return toId(candidate.product) === toId(item.product) && toId(candidate.subProduct) === toId(item.subProduct);
    });
    const ordered = Number(soItem?.quantity ?? item.orderedQuantity) || 0;
    const thisChallan = Number(item.dispatchQuantity) || 0;
    const cumulative = Number(soItem?.deliveredQuantity ?? soItem?.shippedQuantity ?? thisChallan) || 0;
    const manuallyCompleted = item.manuallyCompleted || soItem?.manuallyCompleted || false;
    const balance = Math.max(0, ordered - cumulative);
    const completion = ordered > 0 ? Math.min(100, Math.round((cumulative / ordered) * 100)) : 0;
    const status = manuallyCompleted ? 'Final' : cumulative >= ordered && ordered > 0 ? 'Complete' : cumulative > 0 ? 'Partial' : 'Pending';
    return { ordered, thisChallan, cumulative, manuallyCompleted, balance, completion, status };
  };

  const handleViewPDF = async () => {
    try {
      setPdfAction('preview');
      setPdfError('');
      const result = await salesChallanAPI.previewPDF(detail._id);
      setPdfPreviewUrl(result.blobUrl);
    } catch (error) {
      console.error('Error viewing PDF:', error);
      setPdfError('Failed to load the PDF preview. Please try again.');
    } finally {
      setPdfAction('');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setPdfAction('download');
      setPdfError('');
      await salesChallanAPI.generatePDF(detail._id);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setPdfError('Failed to download the PDF. Please try again.');
    } finally {
      setPdfAction('');
    }
  };

  const handleClosePdfPreview = () => {
    if (pdfPreviewUrl) window.URL.revokeObjectURL(pdfPreviewUrl);
    setPdfPreviewUrl(null);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 top-16 z-[9999] flex items-center justify-center bg-black/60 p-2 backdrop-blur-sm transition-[left] duration-200 sm:p-4 lg:left-[var(--sidebar-width)]">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="challan-detail-title"
        className="flex max-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl sm:max-h-[calc(100vh-6rem)]"
      >
        <header className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="challan-detail-title" className="truncate text-lg font-bold text-gray-950 sm:text-xl">
                  {detail?.challanNumber || challan.challanNumber || 'Sales Challan'}
                </h2>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(challanStatus)}`}>
                  {challanStatus}
                </span>
              </div>
              <p className="mt-0.5 truncate text-sm text-gray-500">Sales Order {salesOrderNumber}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close challan details"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <DetailLoading />
          ) : (
            <div className="space-y-6 p-4 sm:p-6">
              {loadError && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{loadError}</span>
                </div>
              )}
              {relatedError && (
                <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{relatedError}</span>
                </div>
              )}

              <section aria-labelledby="challan-summary-title">
                <div className="mb-2 flex items-center justify-between">
                  <h3 id="challan-summary-title" className="text-sm font-bold uppercase text-gray-700">Challan Summary</h3>
                </div>
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 md:grid-cols-3">
                  <div className="bg-white"><DetailField icon={Calendar} label="Challan Date" value={formatDate(detail?.challanDate || detail?.createdAt)} /></div>
                  <div className="bg-white"><DetailField icon={FileText} label="SO Reference" value={salesOrderNumber} valueClassName="text-teal-700" /></div>
                  <div className="bg-white"><DetailField icon={User} label="Customer" value={customerName} /></div>
                  <div className="bg-white"><DetailField icon={MapPin} label="Warehouse" value={resolvedWarehouse || detail?.warehouseLocation || 'Not assigned'} /></div>
                  {/* <div className="bg-white"><DetailField icon={Package} label="Products / Lines" value={`${productGroups.length} / ${items.length}`} /></div> */}
                  <div className="bg-white"><DetailField icon={Scale} label="This Challan Weight" value={`${totalWeight.toFixed(2)} kg`} /></div>
                  <div className="bg-white"><DetailField icon={Calendar} label="Expected Delivery" value={formatDate(detail?.expectedDeliveryDate)} /></div>
                  {/* <div className="bg-white"><DetailField icon={CheckCircle2} label="Workflow Status" value={detail?.status || 'Prepared'} /></div> */}
                  {/* <div className="bg-white"><DetailField icon={User} label="Created By" value={detail?.createdBy || 'Not recorded'} /></div> */}
                </div>
              </section>

              {detail?.notes?.trim() && (
                <section aria-labelledby="dispatch-notes-title" className="border-t border-gray-200 pt-5">
                  <h3 id="dispatch-notes-title" className="mb-2 flex items-center gap-2 text-sm font-bold uppercase text-gray-700">
                    <StickyNote className="h-4 w-4 text-blue-600" />
                    Dispatch Notes
                  </h3>
                  <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-gray-700">{detail.notes}</p>
                </section>
              )}

              <section aria-labelledby="challan-items-title" className="border-t border-gray-200 pt-5">
                <div className="mb-3 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-orange-600" />
                  <h3 id="challan-items-title" className="text-sm font-bold uppercase text-gray-700">Dispatched Items</h3>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                    {items.length} {items.length === 1 ? 'line' : 'lines'}
                  </span>
                </div>

                {items.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500">
                    No dispatched items are recorded for this challan.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-[1040px] w-full text-left">
                      <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-600">
                        <tr>
                          <th className="px-4 py-3">Product / Variant</th>
                          <th className="px-4 py-3">SO Quantity</th>
                          <th className="px-4 py-3">This Challan</th>
                          {/* <th className="px-4 py-3">Cumulative</th> */}
                          {/* <th className="px-4 py-3">Balance</th> */}
                          <th className="px-4 py-3">Weight</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {productGroups.map((group) => (
                          <React.Fragment key={group.key}>
                            <tr className="bg-orange-50/70">
                              <td colSpan="7" className="px-4 py-2.5">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-sm font-bold text-gray-900">
                                    {group.productName}
                                    {group.productCode && <span className="ml-2 font-normal text-gray-500">({group.productCode})</span>}
                                  </span>
                                  <span className="text-xs font-semibold text-orange-700">
                                    {group.items.length} {group.items.length === 1 ? 'variant' : 'variants'} · {group.unit}
                                  </span>
                                </div>
                              </td>
                            </tr>
                            {group.items.map((item) => {
                              const snapshot = getItemSnapshot(item);
                              const itemWeight = Array.isArray(item.subProductWeights) && item.subProductWeights.length > 0
                                ? item.subProductWeights.reduce((sum, weight) => sum + (Number(weight) || 0), 0)
                                : Number(item.weight) || 0;

                              return (
                                <tr key={item._id} className="align-top hover:bg-gray-50">
                                  <td className="px-4 py-4">
                                    <p className="text-sm font-semibold text-gray-900">
                                      {item.subProductName ? `${item.productName} X ${item.subProductName}` : item.productName}
                                    </p>
                                    {item.notes && <p className="mt-1 max-w-xs text-xs text-gray-500">{item.notes}</p>}
                                  </td>
                                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{snapshot.ordered} {item.unit}</td>
                                  <td className="px-4 py-4 text-sm font-bold text-teal-700">{snapshot.thisChallan} {item.unit}</td>
                                  {/* <td className="px-4 py-4">
                                    <p className="text-sm font-semibold text-gray-900">{snapshot.cumulative} {item.unit}</p>
                                    <p className="mt-1 text-xs text-gray-500">{snapshot.completion}% of SO</p>
                                  </td> */}
                                  {/* <td className="px-4 py-4">
                                    <p className={`text-sm font-semibold ${snapshot.manuallyCompleted && snapshot.balance > 0 ? 'text-amber-700' : 'text-gray-900'}`}>
                                      {snapshot.balance} {item.unit}
                                    </p>
                                    {snapshot.manuallyCompleted && snapshot.balance > 0 && <p className="mt-1 text-xs text-amber-700">Closed by Mark Final</p>}
                                  </td> */}
                                  <td className="px-4 py-4">
                                    <p className="text-sm font-medium text-gray-900">{itemWeight.toFixed(2)} kg</p>
                                    {Array.isArray(item.subProductWeights) && item.subProductWeights.length > 0 && (
                                      <div className="mt-2 flex max-w-xs flex-wrap gap-1">
                                        {item.subProductWeights.map((weight, index) => (
                                          <span key={`${item._id}-weight-${index}`} className="rounded border border-green-200 bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700">
                                            {Number(weight).toFixed(2)}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-4">
                                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(snapshot.status === 'Final' ? 'Complete' : snapshot.status)}`}>
                                      {(snapshot.status === 'Final' || snapshot.status === 'Complete') && <CheckCircle2 className="mr-1 h-3.5 w-3.5" />}
                                      {snapshot.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {detail?.statusHistory?.length > 0 && (
                <section aria-labelledby="status-history-title" className="border-t border-gray-200 pt-5">
                  <h3 id="status-history-title" className="mb-3 text-sm font-bold uppercase text-gray-700">Status History</h3>
                  <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                    {detail.statusHistory.map((history, index) => (
                      <div key={`${history.timestamp}-${index}`} className="grid gap-2 px-4 py-3 sm:grid-cols-[140px_1fr_auto] sm:items-center sm:gap-4">
                        <span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(history.status)}`}>
                          {salesChallanUtils.formatStatus(history.status)}
                        </span>
                        <span className="text-sm text-gray-600">{history.notes || 'Status updated'}</span>
                        <span className="text-xs text-gray-500">{formatDate(history.timestamp)} · {history.updatedBy || 'System'}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        <footer className="flex flex-shrink-0 flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3 sm:px-6">
          <div className="min-h-5 text-sm text-red-700">{pdfError}</div>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleViewPDF}
              disabled={loading || Boolean(pdfAction)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pdfAction === 'preview' ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Eye className="h-4 w-4" />}
              Preview PDF
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={loading || Boolean(pdfAction)}
              className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pdfAction === 'download' ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Download className="h-4 w-4" />}
              Download
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>
        </footer>
      </section>

      {pdfPreviewUrl && (
        <div className="fixed bottom-0 left-0 right-0 top-16 z-[60] flex items-center justify-center bg-black/70 p-2 transition-[left] duration-200 sm:p-4 lg:left-[var(--sidebar-width)]">
          <section className="flex h-[calc(100vh-5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl sm:h-[calc(100vh-6rem)]">
            <header className="flex items-center justify-between gap-4 border-b border-gray-200 px-4 py-3 sm:px-6">
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="h-5 w-5 flex-shrink-0 text-blue-600" />
                <h3 className="truncate text-sm font-bold text-gray-900 sm:text-base">
                  Challan PDF · {detail?.challanNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleClosePdfPreview}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close PDF preview"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <iframe src={pdfPreviewUrl} className="min-h-0 flex-1 w-full" title="Challan PDF preview" />
          </section>
        </div>
      )}
    </div>
  );
};

export default ChallanDetailModal;
