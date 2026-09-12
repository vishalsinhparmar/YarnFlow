import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  MapPin,
  Package,
  Scale,
  StickyNote,
  Warehouse,
  X
} from 'lucide-react';
import { grnAPI } from '../../services/grnAPI';
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

const formatNumber = (value) => {
  const number = Number(value) || 0;
  return Number.isInteger(number) ? String(number) : number.toFixed(2);
};

const getStatusClass = (status) => {
  if (status === 'Complete' || status === 'Completed') {
    return 'border-green-200 bg-green-100 text-green-800';
  }
  if (status === 'Partial' || status === 'Received') {
    return 'border-amber-200 bg-amber-100 text-amber-800';
  }
  if (status === 'Rejected') return 'border-red-200 bg-red-100 text-red-800';
  return 'border-gray-200 bg-gray-100 text-gray-700';
};

const getItemStatus = (item) => {
  const ordered = Number(item.orderedQuantity) || 0;
  const received = Number(item.receivedQuantity) || 0;
  if (item.manuallyCompleted) return 'Final';
  if (item.receiptStatus === 'Complete' || (ordered > 0 && received >= ordered)) return 'Complete';
  if (received > 0) return 'Partial';
  return 'Pending';
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
  <div className="animate-pulse space-y-6 p-4 sm:p-6" aria-label="Loading GRN details">
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
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="grid grid-cols-6 gap-4 border-t border-gray-100 px-4 py-5">
          {Array.from({ length: 6 }).map((__, cellIndex) => (
            <div key={cellIndex} className="h-4 rounded bg-gray-200" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

const GRNDetail = ({ grn, onClose, isOpen = true }) => {
  const [detail, setDetail] = useState(grn);
  const [resolvedWarehouse, setResolvedWarehouse] = useState('');
  const [loading, setLoading] = useState(Boolean(isOpen && grn?._id));
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!isOpen || !grn?._id) return undefined;

    let cancelled = false;
    setDetail(grn);
    setResolvedWarehouse(
      typeof grn.warehouseLocation === 'object'
        ? grn.warehouseLocation?.name || ''
        : grn.warehouseLocation || ''
    );
    setLoading(true);
    setLoadError('');

    const loadDetail = async () => {
      let freshGRN = grn;
      try {
        const response = await grnAPI.getById(grn._id);
        if (response?.data) freshGRN = response.data;
        if (!cancelled) setDetail(freshGRN);
      } catch (error) {
        console.error('Error loading GRN details:', error);
        if (!cancelled) {
          setLoadError('The latest GRN details could not be loaded. Showing the available record.');
        }
      }

      const warehouseValue = freshGRN.warehouseLocation;
      if (!warehouseValue || cancelled) return;

      try {
        const response = await warehouseAPI.getAll();
        const locations = response?.data || [];
        const match = locations.find((warehouse) =>
          toId(warehouse) === toId(warehouseValue) ||
          warehouse.name === warehouseValue ||
          warehouse.name === warehouseValue?.name
        );
        if (!cancelled) {
          setResolvedWarehouse(
            match?.name ||
            warehouseValue?.name ||
            String(warehouseValue)
          );
        }
      } catch {
        if (!cancelled) {
          setResolvedWarehouse(warehouseValue?.name || String(warehouseValue));
        }
      }
    };

    loadDetail().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [grn, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const productGroups = useMemo(() => {
    const groups = [];
    const seen = new Map();
    (detail?.items || []).forEach((item, index) => {
      const productId = item.product?._id || item.product;
      const key = productId
        ? String(productId)
        : `${item.productName || 'product'}-${item.unit || 'unit'}-${index}`;
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

  if (!isOpen || !grn) return null;

  const items = detail?.items || [];
  const receiptStatus = detail?.receiptStatus || detail?.status || 'Pending';
  const totalReceivedQuantity = items.reduce(
    (sum, item) => sum + (Number(item.receivedQuantity) || 0),
    0
  );
  const totalReceivedWeight = items.reduce(
    (sum, item) => sum + (Number(item.receivedWeight) || 0),
    0
  );
  const supplierName = detail?.supplierDetails?.companyName ||
    detail?.supplier?.companyName ||
    'Not available';

  return (
    <div className="fixed bottom-0 left-0 right-0 top-16 z-[9999] flex items-center justify-center bg-black/60 p-2 backdrop-blur-sm transition-[left] duration-200 sm:p-4 lg:left-[var(--sidebar-width)]">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="grn-detail-title"
        className="flex max-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl sm:max-h-[calc(100vh-6rem)]"
      >
        <header className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="grn-detail-title" className="truncate text-lg font-bold text-gray-950 sm:text-xl">
                  {detail?.grnNumber || grn.grnNumber || 'Goods Receipt Note'}
                </h2>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(receiptStatus)}`}>
                  {receiptStatus}
                </span>
              </div>
              <p className="mt-0.5 truncate text-sm text-gray-500">
                {supplierName} · PO {detail?.poNumber || 'Not available'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close GRN details"
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

              <section aria-labelledby="grn-summary-title">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 id="grn-summary-title" className="text-sm font-bold uppercase text-gray-700">
                    Receipt Summary
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-100 md:grid-cols-3">
                  <div className="bg-white"><DetailField icon={ClipboardList} label="GRN Number" value={detail?.grnNumber || 'Not available'} valueClassName="text-green-700" /></div>
                  <div className="bg-white"><DetailField icon={FileText} label="PO Reference" value={detail?.poNumber || 'Not available'} /></div>
                  <div className="bg-white"><DetailField icon={Calendar} label="Receipt Date" value={formatDate(detail?.receiptDate)} /></div>
                  <div className="bg-white"><DetailField icon={Building2} label="Supplier" value={supplierName} /></div>
                  <div className="bg-white"><DetailField icon={Warehouse} label="Warehouse" value={resolvedWarehouse || 'Not assigned'} /></div>
                  {/* <div className="bg-white"><DetailField icon={Package} label="Products / Lines" value={`${productGroups.length} / ${items.length}`} /></div> */}
                  <div className="bg-white"><DetailField icon={Package} label="Received Quantity" value={formatNumber(totalReceivedQuantity)} /></div>
                  <div className="bg-white"><DetailField icon={Scale} label="Received Weight" value={`${totalReceivedWeight.toFixed(2)} kg`} /></div>
                  {/* <div className="bg-white"><DetailField icon={Clock} label="Created" value={formatDate(detail?.createdAt)} /></div> */}
                </div>
              </section>

              {(detail?.storageInstructions || detail?.generalNotes) && (
                <section aria-labelledby="grn-notes-title" className="border-t border-gray-200 pt-5">
                  <h3 id="grn-notes-title" className="mb-3 flex items-center gap-2 text-sm font-bold uppercase text-gray-700">
                    <StickyNote className="h-4 w-4 text-green-700" />
                    Receipt Notes
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {detail?.storageInstructions && (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-gray-500">
                          <MapPin className="h-3.5 w-3.5" />
                          Storage Instructions
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{detail.storageInstructions}</p>
                      </div>
                    )}
                    {detail?.generalNotes && (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-gray-500">
                          <FileText className="h-3.5 w-3.5" />
                          General Notes
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{detail.generalNotes}</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              <section aria-labelledby="grn-items-title" className="border-t border-gray-200 pt-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 id="grn-items-title" className="flex items-center gap-2 text-sm font-bold uppercase text-gray-700">
                    <Package className="h-4 w-4 text-green-700" />
                    Items Received
                  </h3>
                  <span className="text-xs text-gray-500">
                    {productGroups.length} product{productGroups.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200">
                  {productGroups.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm text-gray-500">
                      No receipt lines are available.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {productGroups.map((group) => (
                        <div key={group.key}>
                          <div className="flex items-center justify-between gap-4 bg-green-50 px-4 py-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-gray-900">{group.productName}</p>
                              {group.productCode && <p className="text-xs text-gray-500">{group.productCode}</p>}
                            </div>
                            <span className="flex-shrink-0 text-xs font-medium text-green-800">
                              {group.items.length} line{group.items.length === 1 ? '' : 's'} · {group.unit}
                            </span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-[900px] w-full text-sm">
                              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                                <tr>
                                  <th className="px-4 py-2.5">Product / Variant</th>
                                  <th className="px-4 py-2.5">Ordered</th>
                                  {/* <th className="px-4 py-2.5">Previously Received</th> */}
                                  <th className="bg-green-50 px-4 py-2.5 text-green-800">This GRN</th>
                                  {/* <th className="px-4 py-2.5">Balance</th> */}
                                  <th className="px-4 py-2.5">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {group.items.map((item, index) => {
                                  const status = getItemStatus(item);
                                  return (
                                    <tr key={item._id || `${group.key}-${index}`} className="align-top hover:bg-gray-50">
                                      <td className="px-4 py-3">
                                        <p className="font-semibold text-gray-900">
                                          {item.subProductName
                                            ? `${item.productName || group.productName} × ${item.subProductName}`
                                            : item.productName || group.productName}
                                        </p>
                                        {item.completionReason && (
                                          <p className="mt-1 max-w-xs text-xs text-gray-500">{item.completionReason}</p>
                                        )}
                                      </td>
                                      <td className="px-4 py-3">
                                        <p className="font-medium text-gray-900">{formatNumber(item.orderedQuantity)} {item.unit}</p>
                                        {(Number(item.orderedWeight) || 0) > 0 && (
                                          <p className="text-xs text-gray-500">{formatNumber(item.orderedWeight)} kg</p>
                                        )}
                                      </td>
                                      {/* <td className="px-4 py-3">
                                        <p className="font-medium text-gray-700">{formatNumber(item.previouslyReceived)} {item.unit}</p>
                                        {(Number(item.previousWeight) || 0) > 0 && (
                                          <p className="text-xs text-gray-500">{formatNumber(item.previousWeight)} kg</p>
                                        )}
                                      </td> */}
                                      <td className="bg-green-50/70 px-4 py-3">
                                        <p className="flex items-center gap-1 font-semibold text-green-800">
                                          <CheckCircle2 className="h-3.5 w-3.5" />
                                          {formatNumber(item.receivedQuantity)} {item.unit}
                                        </p>
                                        {(Number(item.receivedWeight) || 0) > 0 && (
                                          <p className="text-xs text-green-700">{formatNumber(item.receivedWeight)} kg</p>
                                        )}
                                        {Array.isArray(item.receivedSubProductWeights) && item.receivedSubProductWeights.length > 0 && (
                                          <div className="mt-1.5 flex max-w-xs flex-wrap gap-1">
                                            {item.receivedSubProductWeights.map((weight, weightIndex) => (
                                              <span key={weightIndex} className="rounded border border-green-200 bg-white px-1.5 py-0.5 text-xs text-green-800">
                                                {formatNumber(weight)} kg
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </td>
                                      {/* <td className="px-4 py-3">
                                        <p className="font-medium text-gray-900">{formatNumber(pendingQuantity)} {item.unit}</p>
                                        {item.manuallyCompleted && (
                                          <p className="mt-0.5 text-xs text-green-700">Closed by Mark Final</p>
                                        )}
                                      </td> */}
                                      <td className="px-4 py-3">
                                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(status)}`}>
                                          {status}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default GRNDetail;
