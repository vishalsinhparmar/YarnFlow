import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Package,
  Scale,
  StickyNote,
  Tag,
  User,
  X
} from 'lucide-react';
import { purchaseOrderAPI, poUtils } from '../../services/purchaseOrderAPI';

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
  if (status === 'Fully_Received' || status === 'Complete' || status === 'Final') {
    return 'border-green-200 bg-green-100 text-green-800';
  }
  if (status === 'Partially_Received' || status === 'Partial') {
    return 'border-amber-200 bg-amber-100 text-amber-800';
  }
  if (status === 'Cancelled') return 'border-red-200 bg-red-100 text-red-800';
  return 'border-gray-200 bg-gray-100 text-gray-700';
};

const getItemStatus = (item) => {
  const ordered = Number(item.quantity) || 0;
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
  <div className="animate-pulse space-y-6 p-4 sm:p-6" aria-label="Loading purchase order details">
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

const PurchaseOrderDetail = ({ purchaseOrder, onClose, isOpen = true }) => {
  const [detail, setDetail] = useState(purchaseOrder);
  const [loading, setLoading] = useState(Boolean(isOpen && purchaseOrder?._id));
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!isOpen || !purchaseOrder?._id) return undefined;

    let cancelled = false;
    setDetail(purchaseOrder);
    setLoading(true);
    setLoadError('');

    purchaseOrderAPI.getById(purchaseOrder._id)
      .then((response) => {
        if (!cancelled && response?.data) setDetail(response.data);
      })
      .catch((error) => {
        console.error('Error loading purchase order details:', error);
        if (!cancelled) {
          setLoadError('The latest purchase order details could not be loaded. Showing the available record.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, purchaseOrder]);

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

  if (!isOpen || !purchaseOrder) return null;

  const items = detail?.items || [];
  const status = detail?.status || 'Draft';
  const completionPercentage = Math.min(
    100,
    Math.max(0, Number(detail?.completionPercentage) || poUtils.calculateCompletion(items))
  );
  const completedLines = items.filter((item) =>
    ['Complete', 'Final'].includes(getItemStatus(item))
  ).length;
  const totalOrderedWeight = items.reduce(
    (sum, item) => sum + (Number(item.weight) || 0),
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
        aria-labelledby="purchase-order-detail-title"
        className="flex max-h-[calc(100vh-1rem)] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl sm:max-h-[92vh]"
      >
        <header className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="purchase-order-detail-title" className="truncate text-lg font-bold text-gray-950 sm:text-xl">
                  {detail?.poNumber || purchaseOrder.poNumber || 'Purchase Order'}
                </h2>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(status)}`}>
                  {poUtils.formatStatus(status)}
                </span>
              </div>
              <p className="mt-0.5 truncate text-sm text-gray-500">{supplierName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close purchase order details"
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

              <section aria-labelledby="purchase-order-summary-title">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 id="purchase-order-summary-title" className="text-sm font-bold uppercase text-gray-700">
                    Order Summary
                  </h3>
                  {/* <span className="text-right text-xs text-gray-500">
                    {completedLines} of {items.length} lines complete
                  </span> */}
                </div>
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-gray-00   bg-gray-200 md:grid-cols-3">
                  <div className="bg-white"><DetailField icon={ClipboardList} label="PO Number" value={detail?.poNumber || 'Not available'} valueClassName="text-orange-700" /></div>
                  <div className="bg-white"><DetailField icon={Calendar} label="Order Date" value={formatDate(detail?.orderDate)} /></div>
                  <div className="bg-white"><DetailField icon={Clock} label="Expected Delivery" value={formatDate(detail?.expectedDeliveryDate)} /></div>
                  <div className="bg-white"><DetailField icon={Building2} label="Supplier" value={supplierName} /></div>
                  <div className="bg-white"><DetailField icon={Tag} label="Category" value={detail?.category?.categoryName || 'Not assigned'} /></div>
                  {/* <div className="bg-white"><DetailField icon={Package} label="Products / Lines" value={`${productGroups.length} / ${items.length}`} /></div> */}
                  <div className="bg-white"><DetailField icon={Scale} label="Ordered Weight" value={`${totalOrderedWeight.toFixed(2)} kg`} /></div>
                  <div className="bg-white"><DetailField icon={Scale} label="Received Weight" value={`${totalReceivedWeight.toFixed(2)} kg`} /></div>
                  {/* <div className="bg-white"><DetailField icon={User} label="Created By" value={detail?.createdBy || 'Not recorded'} /></div> */}
                </div>
              </section>

              <section aria-labelledby="receipt-progress-title" className="border-t border-gray-200 pt-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 id="receipt-progress-title" className="flex items-center gap-2 text-sm font-bold uppercase text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-700" />
                    Receipt Progress
                  </h3>
                  <span className="text-sm font-bold text-gray-900">{completionPercentage}%</span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-gray-200"
                  role="progressbar"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-valuenow={completionPercentage}
                  aria-label="Purchase order receipt progress"
                >
                  <div
                    className={`h-full rounded-full ${completionPercentage === 100 ? 'bg-green-600' : 'bg-amber-500'}`}
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                {status === 'Fully_Received' && completionPercentage < 100 && (
                  <p className="mt-2 text-xs text-gray-600">
                    Remaining quantity was closed using Mark Final.
                  </p>
                )}
              </section>

              {items.some((item) => item.notes || item.completionReason) && (
                <section aria-labelledby="purchase-order-notes-title" className="border-t border-gray-200 pt-5">
                  <h3 id="purchase-order-notes-title" className="mb-3 flex items-center gap-2 text-sm font-bold uppercase text-gray-700">
                    <StickyNote className="h-4 w-4 text-orange-700" />
                    Line Notes
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {items.filter((item) => item.notes || item.completionReason).map((item, index) => (
                      <div key={item._id || index} className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase text-gray-500">
                          {item.subProductName
                            ? `${item.productName} × ${item.subProductName}`
                            : item.productName}
                        </p>
                        {item.notes && <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{item.notes}</p>}
                        {item.completionReason && (
                          <p className="mt-1 text-sm text-green-800">Final: {item.completionReason}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section aria-labelledby="purchase-order-items-title" className="border-t border-gray-200 pt-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 id="purchase-order-items-title" className="flex items-center gap-2 text-sm font-bold uppercase text-gray-700">
                    <Package className="h-4 w-4 text-orange-700" />
                    Ordered Items
                  </h3>
                  <span className="text-xs text-gray-500">
                    {productGroups.length} product{productGroups.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200">
                  {productGroups.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm text-gray-500">
                      No purchase-order lines are available.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {productGroups.map((group) => (
                        <div key={group.key}>
                          <div className="flex items-center justify-between gap-4 bg-orange-50 px-4 py-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-gray-900">{group.productName}</p>
                              {group.productCode && <p className="text-xs text-gray-500">{group.productCode}</p>}
                            </div>
                            <span className="flex-shrink-0 text-xs font-medium text-orange-800">
                              {group.items.length} line{group.items.length === 1 ? '' : 's'} · {group.unit}
                            </span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-[820px] w-full text-sm">
                              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                                <tr>
                                  <th className="px-4 py-2.5">Product / Variant</th>
                                  <th className="px-4 py-2.5">Ordered</th>
                                  <th className="bg-green-50 px-4 py-2.5 text-green-800">Received</th>
                                  <th className="px-4 py-2.5">Balance</th>
                                  <th className="px-4 py-2.5">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {group.items.map((item, index) => {
                                  const itemStatus = getItemStatus(item);
                                  const balanceQuantity = item.manuallyCompleted
                                    ? 0
                                    : Math.max(
                                      0,
                                      Number(item.pendingQuantity) ||
                                      (Number(item.quantity) || 0) - (Number(item.receivedQuantity) || 0)
                                    );
                                  const balanceWeight = item.manuallyCompleted
                                    ? 0
                                    : Math.max(
                                      0,
                                      Number(item.pendingWeight) ||
                                      (Number(item.weight) || 0) - (Number(item.receivedWeight) || 0)
                                    );
                                  return (
                                    <tr key={item._id || `${group.key}-${index}`} className="align-top hover:bg-gray-50">
                                      <td className="px-4 py-3">
                                        <p className="font-semibold text-gray-900">
                                          {item.subProductName
                                            ? `${item.productName || group.productName} × ${item.subProductName}`
                                            : item.productName || group.productName}
                                        </p>
                                        {!item.subProductName && (
                                          <p className="mt-0.5 text-xs text-gray-500">Base product</p>
                                        )}
                                        {Array.isArray(item.subProductWeights) && item.subProductWeights.length > 0 && (
                                          <div className="mt-1.5 flex max-w-xs flex-wrap gap-1">
                                            {item.subProductWeights.map((weight, weightIndex) => (
                                              <span key={weightIndex} className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-xs text-gray-600">
                                                {formatNumber(weight)} kg
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </td>
                                      <td className="px-4 py-3">
                                        <p className="font-medium text-gray-900">{formatNumber(item.quantity)} {item.unit}</p>
                                        {(Number(item.weight) || 0) > 0 && (
                                          <p className="text-xs text-gray-500">{formatNumber(item.weight)} kg</p>
                                        )}
                                      </td>
                                      <td className="bg-green-50/70 px-4 py-3">
                                        {(Number(item.receivedQuantity) || 0) > 0 ? (
                                          <>
                                            <p className="flex items-center gap-1 font-semibold text-green-800">
                                              <CheckCircle2 className="h-3.5 w-3.5" />
                                              {formatNumber(item.receivedQuantity)} {item.unit}
                                            </p>
                                            {(Number(item.receivedWeight) || 0) > 0 && (
                                              <p className="text-xs text-green-700">{formatNumber(item.receivedWeight)} kg</p>
                                            )}
                                          </>
                                        ) : (
                                          <span className="text-gray-400">Not received</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3">
                                        <p className="font-medium text-gray-900">{formatNumber(balanceQuantity)} {item.unit}</p>
                                        {balanceWeight > 0 && <p className="text-xs text-gray-500">{formatNumber(balanceWeight)} kg</p>}
                                        {item.manuallyCompleted && (
                                          <p className="mt-0.5 text-xs text-green-700">Closed by Mark Final</p>
                                        )}
                                      </td>
                                      <td className="px-4 py-3">
                                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(itemStatus)}`}>
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
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <div className="border-t border-gray-200 pt-4 text-xs text-gray-500">
                Last updated {formatDate(detail?.updatedAt)}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PurchaseOrderDetail;
