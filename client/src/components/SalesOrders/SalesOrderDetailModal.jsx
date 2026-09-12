import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Package,
  Scale,
  ShoppingCart,
  StickyNote,
  Tag,
  User,
  X
} from 'lucide-react';
import { salesOrderAPI } from '../../services/salesOrderAPI';
import { salesChallanAPI } from '../../services/salesChallanAPI';

const toId = (value) => String(value?._id || value || '');

const formatWeight = (value) => {
  const weight = Number(value) || 0;
  return Number.isInteger(weight) ? String(weight) : weight.toFixed(2);
};

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
  if (status === 'Delivered') return 'bg-green-100 text-green-800 border-green-200';
  if (status === 'Processing') return 'bg-amber-100 text-amber-800 border-amber-200';
  if (status === 'Cancelled') return 'bg-red-100 text-red-800 border-red-200';
  if (status === 'Pending') return 'bg-blue-100 text-blue-800 border-blue-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
};

const getItemStatus = (item) => {
  const ordered = Number(item.quantity) || 0;
  const dispatched = Number(item.deliveredQuantity ?? item.shippedQuantity) || 0;
  if (item.manuallyCompleted) return 'Final';
  if (ordered > 0 && dispatched >= ordered) return 'Complete';
  if (dispatched > 0) return 'Partial';
  return 'Pending';
};

const getItemStatusClass = (status) => {
  if (status === 'Complete' || status === 'Final') return 'bg-green-100 text-green-800 border-green-200';
  if (status === 'Partial') return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
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
  <div className="animate-pulse space-y-6 p-4 sm:p-6" aria-label="Loading sales order details">
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

const SalesOrderDetailModal = ({ isOpen, onClose, order }) => {
  const [detail, setDetail] = useState(order);
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(Boolean(isOpen && order?._id));
  const [loadError, setLoadError] = useState('');
  const [weightHistoryError, setWeightHistoryError] = useState('');

  useEffect(() => {
    if (!isOpen || !order?._id) return undefined;

    let cancelled = false;
    setDetail(order);
    setChallans([]);
    setLoading(true);
    setLoadError('');
    setWeightHistoryError('');

    Promise.allSettled([
      salesOrderAPI.getById(order._id),
      salesChallanAPI.getBySalesOrder(order._id)
    ])
      .then(([orderResult, challanResult]) => {
        if (cancelled) return;

        if (orderResult.status === 'fulfilled' && orderResult.value?.data) {
          setDetail(orderResult.value.data);
        } else {
          console.error('Error loading sales order details:', orderResult.reason);
          setLoadError('The latest sales order details could not be loaded. Showing the available record.');
        }

        if (challanResult.status === 'fulfilled') {
          setChallans(Array.isArray(challanResult.value?.data) ? challanResult.value.data : []);
        } else {
          console.error('Error loading dispatched unit weights:', challanResult.reason);
          setWeightHistoryError('Exact dispatched unit weights are temporarily unavailable.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, order]);

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

  const dispatchedWeightHistory = useMemo(() => {
    const history = new Map();
    (challans || []).forEach((challan) => {
      (challan.items || []).forEach((challanItem) => {
        if (!Array.isArray(challanItem.subProductWeights) || challanItem.subProductWeights.length === 0) {
          return;
        }

        const matchingItem = (detail?.items || []).find((orderItem) => {
          if (toId(orderItem._id) === toId(challanItem.salesOrderItem)) return true;
          return toId(orderItem.product) === toId(challanItem.product) &&
            toId(orderItem.subProduct) === toId(challanItem.subProduct);
        });
        if (!matchingItem?._id) return;

        const key = toId(matchingItem._id);
        if (!history.has(key)) history.set(key, []);
        history.get(key).push({
          challanNumber: challan.challanNumber || 'Challan',
          weights: challanItem.subProductWeights
        });
      });
    });
    return history;
  }, [challans, detail]);

  if (!isOpen || !order) return null;

  const items = detail?.items || [];
  const totalWeight = items.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
  const customerName = detail?.customer?.companyName || detail?.customerName || 'Not available';

  return (
    <div className="fixed bottom-0 left-0 right-0 top-16 z-[9999] flex items-center justify-center bg-black/60 p-2 backdrop-blur-sm transition-[left] duration-200 sm:p-4 lg:left-[var(--sidebar-width)]">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="sales-order-detail-title"
        className="flex max-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl sm:max-h-[calc(100vh-6rem)]"
      >
        <header className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="sales-order-detail-title" className="truncate text-lg font-bold text-gray-950 sm:text-xl">
                  {detail?.soNumber || order.soNumber || 'Sales Order'}
                </h2>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(detail?.status || order.status)}`}>
                  {detail?.status || order.status || 'Draft'}
                </span>
              </div>
              <p className="mt-0.5 truncate text-sm text-gray-500">{customerName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close sales order details"
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
              {weightHistoryError && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{weightHistoryError}</span>
                </div>
              )}

              <section aria-labelledby="order-summary-title">
                <div className="mb-2 flex items-center justify-between">
                  <h3 id="order-summary-title" className="text-sm font-bold uppercase text-gray-700">Order Summary</h3>
                  {/* <span className="text-xs text-gray-500">{completedLines} of {items.length} lines complete</span> */}
                </div>
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 md:grid-cols-3">
                  <div className="bg-white"><DetailField icon={ShoppingCart} label="SO Number" value={detail?.soNumber || 'Not available'} valueClassName="text-blue-700" /></div>
                  <div className="bg-white"><DetailField icon={Calendar} label="Order Date" value={formatDate(detail?.orderDate)} /></div>
                  <div className="bg-white"><DetailField icon={Clock} label="Expected Delivery" value={formatDate(detail?.expectedDeliveryDate)} /></div>
                  <div className="bg-white"><DetailField icon={User} label="Customer" value={customerName} /></div>
                  <div className="bg-white"><DetailField icon={Tag} label="Category" value={detail?.category?.categoryName || 'Not assigned'} /></div>
                  {/* <div className="bg-white"><DetailField icon={Package} label="Products / Lines" value={`${productGroups.length} / ${items.length}`} /></div> */}
                  <div className="bg-white"><DetailField icon={Scale} label="Ordered Weight" value={`${totalWeight.toFixed(2)} kg`} /></div>
                  {/* <div className="bg-white"><DetailField icon={User} label="Created By" value={detail?.createdBy || 'Not recorded'} /></div> */}
                  {/* <div className="bg-white"><DetailField icon={Clock} label="Last Updated" value={formatDate(detail?.updatedAt)} /></div> */}
                </div>
              </section>

              {items.some((item) => item.notes?.trim()) && (
                <section aria-labelledby="order-notes-title" className="border-t border-gray-200 pt-5">
                  <h3 id="order-notes-title" className="mb-3 flex items-center gap-2 text-sm font-bold uppercase text-gray-700">
                    <StickyNote className="h-4 w-4 text-blue-600" />
                    Item Notes
                  </h3>
                  <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                    {items.filter((item) => item.notes?.trim()).map((item) => (
                      <div key={item._id} className="grid gap-1 px-4 py-3 sm:grid-cols-[220px_1fr] sm:gap-4">
                        <span className="text-sm font-semibold text-gray-800">
                          {item.subProductName ? `${item.productName} X ${item.subProductName}` : item.productName}
                        </span>
                        <span className="text-sm text-gray-600">{item.notes}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section aria-labelledby="order-items-title" className="border-t border-gray-200 pt-5">
                <div className="mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <h3 id="order-items-title" className="text-sm font-bold uppercase text-gray-700">Order Items</h3>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                    {items.length} {items.length === 1 ? 'line' : 'lines'}
                  </span>
                </div>

                {items.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500">
                    No items are recorded for this sales order.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-[940px] w-full text-left">
                      <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-600">
                        <tr>
                          <th className="px-4 py-3">Product / Variant</th>
                          <th className="px-4 py-3">Ordered</th>
                          <th className="px-4 py-3">Dispatched</th>
                          <th className="px-4 py-3">Balance</th>
                          <th className="px-4 py-3">Weight</th>
                          <th className="px-4 py-3">Progress</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {productGroups.map((group) => (
                          <React.Fragment key={group.key}>
                            <tr className="bg-blue-50/70">
                              <td colSpan="7" className="px-4 py-2.5">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-sm font-bold text-gray-900">
                                    {group.productName}
                                    {group.productCode && <span className="ml-2 font-normal text-gray-500">({group.productCode})</span>}
                                  </span>
                                  <span className="text-xs font-semibold text-blue-700">
                                    {group.items.length} {group.items.length === 1 ? 'variant' : 'variants'} · {group.unit}
                                  </span>
                                </div>
                              </td>
                            </tr>
                            {group.items.map((item) => {
                              const ordered = Number(item.quantity) || 0;
                              const dispatched = Number(item.deliveredQuantity ?? item.shippedQuantity) || 0;
                              const balance = Math.max(0, ordered - dispatched);
                              const completion = ordered > 0 ? Math.min(100, Math.round((dispatched / ordered) * 100)) : 0;
                              const status = getItemStatus(item);
                              const orderedWeight = Number(item.weight) || 0;
                              const dispatchedWeight = Number(item.dispatchedWeight) || 0;
                              const weightHistory = dispatchedWeightHistory.get(toId(item._id)) || [];

                              return (
                                <tr key={item._id} className="align-top hover:bg-gray-50">
                                  <td className="px-4 py-4">
                                    <p className="text-sm font-semibold text-gray-900">
                                      {item.subProductName ? `${item.productName} X ${item.subProductName}` : item.productName}
                                    </p>
                                    {Array.isArray(item.subProductWeights) && item.subProductWeights.length > 0 && (
                                      <p className="mt-1 text-xs text-gray-500">{item.subProductWeights.length} exact unit weights</p>
                                    )}
                                  </td>
                                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{ordered} {item.unit}</td>
                                  <td className="px-4 py-4 text-sm font-semibold text-green-700">{dispatched} {item.unit}</td>
                                  <td className="px-4 py-4">
                                    <span className={`text-sm font-semibold ${item.manuallyCompleted && balance > 0 ? 'text-amber-700' : 'text-gray-900'}`}>
                                      {balance} {item.unit}
                                    </span>
                                    {item.manuallyCompleted && balance > 0 && <p className="mt-1 text-xs text-amber-700">Closed by Mark Final</p>}
                                  </td>
                                  <td className="px-4 py-4">
                                    <p className="text-sm font-medium text-gray-900">{orderedWeight.toFixed(2)} kg</p>
                                    <p className="mt-1 text-xs text-gray-500">{dispatchedWeight.toFixed(2)} kg dispatched</p>
                                    {weightHistory.length > 0 && (
                                      <div className="mt-2 space-y-2">
                                        {weightHistory.map((entry, historyIndex) => (
                                          <div key={`${entry.challanNumber}-${historyIndex}`}>
                                            <p className="text-xs font-semibold text-gray-500">{entry.challanNumber}</p>
                                            <div className="mt-1 flex max-w-xs flex-wrap gap-1">
                                              {entry.weights.map((weight, weightIndex) => (
                                                <span
                                                  key={`${entry.challanNumber}-${weightIndex}`}
                                                  className="rounded border border-green-200 bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-800"
                                                >
                                                  {formatWeight(weight)} kg
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-4">
                                    <div className="flex min-w-[120px] items-center gap-2">
                                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                                        <div className="h-full rounded-full bg-blue-600" style={{ width: `${completion}%` }} />
                                      </div>
                                      <span className="w-9 text-right text-xs font-semibold text-gray-700">{completion}%</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4">
                                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getItemStatusClass(status)}`}>
                                      {status === 'Final' && <CheckCircle2 className="mr-1 h-3.5 w-3.5" />}
                                      {status}
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
            </div>
          )}
        </div>

        <footer className="flex flex-shrink-0 items-center justify-end border-t border-gray-200 bg-gray-50 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
            Close
          </button>
        </footer>
      </section>
    </div>
  );
};

export default SalesOrderDetailModal;
