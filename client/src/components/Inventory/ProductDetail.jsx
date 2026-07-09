import React, { useState } from 'react';
import { Package, ArrowDownToLine, ArrowUpFromLine, ClipboardList, Building2, MapPin, ArrowLeft, FileText, ChevronRight } from 'lucide-react';
import { getWarehouseName } from '../../constants/warehouseLocations';

/* ─────────────────────────────────────────────────────────────
   Helper: format date
───────────────────────────────────────────────────────────── */
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

/* ─────────────────────────────────────────────────────────────
   Summary cards – reused in both levels
───────────────────────────────────────────────────────────── */
const SummaryCards = ({ currentStock, receivedStock, issuedStock, lotCount, currentWeight, receivedWeight, issuedWeight, unit }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
      <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Current Stock</p>
      <p className="text-2xl font-bold text-green-600 mt-1">{currentStock} <span className="text-sm font-normal">{unit}</span></p>
      <p className="text-xs text-gray-500 mt-1">After stock out</p>
    </div>
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Stock In (GRN)</p>
      <p className="text-2xl font-bold text-blue-600 mt-1">+{receivedStock} <span className="text-sm font-normal">{unit}</span></p>
      {receivedWeight > 0 && <p className="text-xs text-blue-500 mt-1">+{receivedWeight.toFixed(2)} kg</p>}
    </div>
    <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-5 border border-red-100">
      <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Stock Out</p>
      <p className="text-2xl font-bold text-red-600 mt-1">-{issuedStock} <span className="text-sm font-normal">{unit}</span></p>
      {issuedWeight > 0 && <p className="text-xs text-red-500 mt-1">-{issuedWeight.toFixed(2)} kg</p>}
    </div>
    <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-5 border border-purple-100">
      <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Total Weight (Net)</p>
      <p className="text-2xl font-bold text-purple-600 mt-1">{currentWeight > 0 ? currentWeight.toFixed(2) : '0.00'} <span className="text-sm font-normal">kg</span></p>
      <p className="text-xs text-gray-500 mt-1">{lotCount} lot{lotCount !== 1 ? 's' : ''}</p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   LotList – renders all lots with movement history for a given
   list of lots (used for both no-sub-product and sub-product drill-down)
───────────────────────────────────────────────────────────── */
const LotList = ({ lots, unit }) => {
  if (!lots || lots.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No lots found</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {lots.map((lot, idx) => (
        <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="text-lg font-bold text-gray-900">{lot.lotNumber}</span>
                </div>
                <span className="px-3 py-1 text-xs rounded-lg bg-blue-100 text-blue-700 font-semibold">GRN: {lot.grnNumber}</span>
                <span className={`px-3 py-1 text-xs rounded-lg font-semibold ${lot.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {lot.status}
                </span>
                {lot.subProductName && (
                  <span className="px-3 py-1 text-xs rounded-lg bg-purple-100 text-purple-700 font-semibold">
                    {lot.subProductName}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                  <Building2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <div>
                    <span className="text-gray-500 text-xs block">Supplier</span>
                    <span className="font-semibold text-gray-900">{lot.supplierName || '-'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-purple-50 rounded-lg p-3">
                  <MapPin className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <div>
                    <span className="text-gray-500 text-xs block">Warehouse</span>
                    <span className="font-semibold text-purple-600">{getWarehouseName(lot.warehouse) || '-'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-green-50 rounded-lg p-3">
                  <ArrowDownToLine className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <div>
                    <span className="text-gray-500 text-xs block">Received</span>
                    <span className="font-bold text-green-600">{lot.receivedQuantity} {unit}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-3">
                  <Package className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div>
                    <span className="text-gray-500 text-xs block">Current</span>
                    <span className="font-bold text-blue-600">{lot.currentQuantity} {unit}</span>
                  </div>
                </div>
              </div>
              {lot.issuedQuantity > 0 && (
                <div className="mt-3 flex items-center gap-2 bg-red-50 rounded-lg p-3 w-fit">
                  <ArrowUpFromLine className="w-4 h-4 text-red-500" />
                  <div>
                    <span className="text-gray-500 text-xs">Issued</span>
                    <p className="font-bold text-red-600">-{lot.issuedQuantity} {unit}</p>
                  </div>
                </div>
              )}
              {lot.subProductWeights && lot.subProductWeights.length > 0 && (
                <div className="mt-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Per-unit Weights</span>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {lot.subProductWeights.map((w, wi) => (
                      <span key={wi} className={`px-2 py-1 text-xs font-semibold rounded border ${wi < (lot.currentQuantity || 0) ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200 line-through'}`}>
                        #{wi + 1}: {Number(w).toFixed(2)} kg
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Green = in stock ({lot.currentQuantity} {unit})</p>
                </div>
              )}
            </div>
            <div className="text-right ml-4 bg-gray-50 rounded-lg p-3 flex-shrink-0">
              <span className="text-xs text-gray-500">Received Date</span>
              <p className="text-sm font-semibold text-gray-900">{fmtDate(lot.receivedDate)}</p>
            </div>
          </div>
          {lot.movements && lot.movements.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center mb-3">
                <ClipboardList className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-sm font-bold text-gray-700">Movement History</span>
              </div>
              <div className="space-y-2">
                {lot.movements.map((mv, mi) => (
                  <div key={mi} className={`flex items-center justify-between p-3 rounded-xl ${mv.type === 'Received' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${mv.type === 'Received' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {mv.type === 'Received' ? <ArrowDownToLine className="w-4 h-4 text-green-600" /> : <ArrowUpFromLine className="w-4 h-4 text-red-600" />}
                      </div>
                      <div>
                        <span className={`font-bold text-sm ${mv.type === 'Received' ? 'text-green-700' : 'text-red-700'}`}>
                          {mv.type === 'Received' ? 'Stock In (GRN)' : 'Stock Out (Challan)'}
                        </span>
                        {mv.reference && (
                          <span className="ml-2 text-xs text-gray-600 bg-white px-2 py-0.5 rounded">
                            {mv.reference.includes(']') ? mv.reference.split(']')[0] : mv.reference}
                          </span>
                        )}
                        {mv.notes && <p className="text-xs text-gray-500 mt-0.5">{mv.notes}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${mv.type === 'Received' ? 'text-green-600' : 'text-red-600'}`}>
                        {mv.type === 'Received' ? '+' : '-'}{mv.quantity} {unit}
                      </div>
                      {mv.weight > 0 && (
                        <div className={`text-xs font-semibold ${mv.type === 'Received' ? 'text-green-500' : 'text-red-500'}`}>
                          {mv.type === 'Received' ? '+' : '-'}{mv.weight.toFixed(2)} kg
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">{fmtDate(mv.date)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────── */
const ProductDetail = ({ product, onClose }) => {
  // selectedSubProduct: one entry from _detailData.subProductBreakdown
  const [selectedSubProduct, setSelectedSubProduct] = useState(null);

  if (!product) return null;

  const detailData = product._detailData; // present when product has sub-products
  const hasSubProducts = product.hasSubProducts && detailData;

  // ── Sub-product drill-down view ──────────────────────────────
  if (hasSubProducts && selectedSubProduct) {
    const sp = selectedSubProduct;
    const unit = product.unit;
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="text-white">
              <div className="flex items-center gap-2 text-indigo-200 text-sm mb-1">
                <button onClick={onClose} className="hover:text-white transition-colors">{product.productName}</button>
                <ChevronRight className="w-4 h-4" />
                <span className="font-semibold text-white">{sp.subProductName || 'No Sub-product'}</span>
              </div>
              <h1 className="text-2xl font-bold">{product.productName} X {sp.subProductName}</h1>
              <p className="text-indigo-100 mt-1">Current Stock: <span className="font-semibold text-white">{sp.currentStock} {unit}</span> • Net Weight: <span className="font-semibold text-white">{(sp.currentWeight || 0).toFixed(2)} kg</span></p>
            </div>
            <button onClick={() => setSelectedSubProduct(null)} className="bg-white text-indigo-600 hover:bg-indigo-50 px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg">
              <ArrowLeft className="w-4 h-4" /> Back to {product.productName}
            </button>
          </div>
        </div>
        <SummaryCards
          currentStock={sp.currentStock} receivedStock={sp.receivedStock} issuedStock={sp.issuedStock}
          currentWeight={sp.currentWeight} receivedWeight={sp.receivedWeight} issuedWeight={sp.issuedWeight}
          lotCount={sp.lots?.length || 0} unit={unit}
        />
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
          <div className="flex items-center mb-5">
            <ClipboardList className="h-5 w-5 text-orange-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Inventory Lots ({sp.lots?.length || 0})</h2>
          </div>
          <LotList lots={sp.lots} unit={unit} />
        </div>
      </div>
    );
  }

  // ── Product-level view with sub-product breakdown table ──────
  if (hasSubProducts) {
    const totals = detailData.totals;
    const unit = product.unit;
    const subProducts = detailData.subProductBreakdown || [];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold">{product.productName}</h1>
                <span className="px-2 py-1 bg-purple-300 bg-opacity-40 text-white text-xs font-semibold rounded-lg border border-purple-300">
                  {subProducts.length} sub-product{subProducts.length !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-indigo-100 ml-[52px]">
                Net Stock: <span className="font-semibold text-white">{totals.currentStock} {unit}</span>
                {' '}• Net Weight: <span className="font-semibold text-white">{(totals.currentWeight || 0).toFixed(2)} kg</span>
              </p>
            </div>
            <button onClick={onClose} className="bg-white text-indigo-600 hover:bg-indigo-50 px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg">
              <ArrowLeft className="w-4 h-4" /> Back to Inventory
            </button>
          </div>
        </div>

        {/* Product-level totals */}
        <SummaryCards
          currentStock={totals.currentStock} receivedStock={totals.receivedStock} issuedStock={totals.issuedStock}
          currentWeight={totals.currentWeight} receivedWeight={totals.receivedWeight} issuedWeight={totals.issuedWeight}
          lotCount={detailData.lotsCount || 0} unit={unit}
        />

        {/* Sub-product breakdown table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Sub-products</h2>
            <span className="text-sm text-gray-400">Click a row to view lots & movements</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sub-product</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-green-600 uppercase tracking-wider">Current Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">Stock In</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-red-600 uppercase tracking-wider">Stock Out</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Weight</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lots</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {subProducts.map((sp, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-indigo-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedSubProduct(sp)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {sp.subProductName
                              ? `${product.productName} X ${sp.subProductName}`
                              : product.productName}
                          </div>
                          {sp.subProductName && (
                            <div className="text-xs text-gray-400 mt-0.5">Sub: {sp.subProductName}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-base font-bold text-green-600">{sp.currentStock} {unit}</div>
                      <div className="text-xs text-gray-400">After stock out</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-blue-600">+{sp.receivedStock} {unit}</div>
                      {sp.receivedWeight > 0 && <div className="text-xs text-blue-400">+{sp.receivedWeight.toFixed(2)} kg</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-red-600">-{sp.issuedStock} {unit}</div>
                      {sp.issuedWeight > 0 && <div className="text-xs text-red-400">-{sp.issuedWeight.toFixed(2)} kg</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{(sp.currentWeight || 0).toFixed(2)} kg</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-600">{sp.lots?.length || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                        View <ChevronRight className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ── No-sub-product view (existing behaviour unchanged) ───────
  const unit = product.unit;
  const lots = product.lots || product.grns || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold">{product.productName}</h1>
            </div>
            <p className="text-indigo-100 ml-[52px]">
              Current Stock: <span className="font-semibold text-white">{product.currentStock || product.totalStock} {unit}</span>
              {product.totalWeight > 0 && <span> • <span className="font-semibold text-white">{product.totalWeight.toFixed(2)} kg</span></span>}
            </p>
          </div>
          <button onClick={onClose} className="bg-white text-indigo-600 hover:bg-indigo-50 px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg">
            <ArrowLeft className="w-4 h-4" /> Back to Inventory
          </button>
        </div>
      </div>

      <SummaryCards
        currentStock={product.currentStock || product.totalStock}
        receivedStock={product.receivedStock || product.totalStock}
        issuedStock={product.issuedStock || 0}
        currentWeight={product.currentWeight || product.totalWeight || 0}
        receivedWeight={product.receivedWeight || 0}
        issuedWeight={product.issuedWeight || 0}
        lotCount={product.lotCount || product.grnCount || 0}
        unit={unit}
      />

      {/* Suppliers */}
      {product.suppliers && product.suppliers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center mb-3">
            <Building2 className="h-5 w-5 text-purple-600 mr-2" />
            <h2 className="text-base font-semibold text-gray-900">Suppliers</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {product.suppliers.map((s, i) => (
              <span key={i} className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-semibold">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Lots */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
        <div className="flex items-center mb-5">
          <ClipboardList className="h-5 w-5 text-orange-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Inventory Lots ({lots.length})</h2>
        </div>
        <LotList lots={lots} unit={unit} />
      </div>
    </div>
  );
};

export default ProductDetail;
