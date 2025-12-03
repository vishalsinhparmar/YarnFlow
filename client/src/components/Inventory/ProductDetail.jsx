import React from 'react';
import { Package, ArrowDownToLine, ArrowUpFromLine, ClipboardList, Building2, MapPin, ArrowLeft, FileText } from 'lucide-react';
import { getWarehouseName } from '../../constants/warehouseLocations';

const ProductDetail = ({ product, onClose }) => {
  if (!product) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold">{product.productName}</h1>
            </div>
            <p className="text-indigo-100 ml-[52px]">
              Current Stock: <span className="font-semibold text-white">{product.currentStock || product.totalStock} {product.unit}</span>
              {product.totalWeight && <span> • <span className="font-semibold text-white">{product.totalWeight.toFixed(2)} Kg</span></span>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-white text-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Inventory
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm p-6 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-600 uppercase tracking-wide">Current Stock</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {product.currentStock || product.totalStock} {product.unit}
              </p>
              <p className="text-xs text-gray-500 mt-1">After stock out</p>
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center shadow-inner">
              <Package className="w-7 h-7 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Stock In (GRN)</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                +{product.receivedStock || product.totalStock}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total received</p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center shadow-inner">
              <ArrowDownToLine className="w-7 h-7 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl shadow-sm p-6 border border-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-red-600 uppercase tracking-wide">Stock Out (Challan)</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                -{product.issuedStock || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total issued</p>
            </div>
            <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center shadow-inner">
              <ArrowUpFromLine className="w-7 h-7 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl shadow-sm p-6 border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide">Total Lots</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {product.lotCount || product.grnCount || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Inventory lots</p>
            </div>
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center shadow-inner">
              <ClipboardList className="w-7 h-7 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Suppliers */}
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center mb-4">
          <Building2 className="h-6 w-6 text-purple-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Suppliers</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {product.suppliers && product.suppliers.map((supplier, idx) => (
            <span
              key={idx}
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-semibold"
            >
              {supplier}
            </span>
          ))}
        </div>
      </div>

      {/* Inventory Lots with Movements */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl shadow-sm p-6 border border-orange-100">
        <div className="flex items-center mb-6">
          <ClipboardList className="h-6 w-6 text-orange-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">
            Inventory Lots ({product.lotCount || product.grnCount || 0} Lots)
          </h2>
        </div>
        <div className="space-y-4">
          {(product.lots || product.grns || []).map((lot, idx) => {
            const isLotFormat = lot.lotNumber !== undefined;
            return (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span className="text-lg font-bold text-gray-900">
                          {isLotFormat ? lot.lotNumber : lot.grnNumber}
                        </span>
                      </div>
                      <span className="px-3 py-1.5 text-xs rounded-lg bg-blue-100 text-blue-700 font-semibold">
                        {isLotFormat ? `GRN: ${lot.grnNumber}` : `PO: ${lot.poNumber}`}
                      </span>
                      <span className={`px-3 py-1.5 text-xs rounded-lg font-semibold ${
                        (isLotFormat ? lot.status : 'Active') === 'Active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {isLotFormat ? lot.status : 'Active'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                        <Building2 className="w-4 h-4 text-gray-500" />
                        <div>
                          <span className="text-gray-500 text-xs">Supplier</span>
                          <p className="font-semibold text-gray-900">{lot.supplierName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-purple-50 rounded-lg p-3">
                        <MapPin className="w-4 h-4 text-purple-500" />
                        <div>
                          <span className="text-gray-500 text-xs">Warehouse</span>
                          <p className="font-semibold text-purple-600">{getWarehouseName(isLotFormat ? lot.warehouse : lot.warehouseLocation)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-green-50 rounded-lg p-3">
                        <ArrowDownToLine className="w-4 h-4 text-green-500" />
                        <div>
                          <span className="text-gray-500 text-xs">Received</span>
                          <p className="font-bold text-green-600">{isLotFormat ? lot.receivedQuantity : lot.receivedQuantity} {product.unit}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-3">
                        <Package className="w-4 h-4 text-blue-500" />
                        <div>
                          <span className="text-gray-500 text-xs">Current</span>
                          <p className="font-bold text-blue-600">{isLotFormat ? lot.currentQuantity : lot.receivedQuantity} {product.unit}</p>
                        </div>
                      </div>
                    </div>

                    {isLotFormat && lot.issuedQuantity > 0 && (
                      <div className="mt-3 flex items-center gap-2 bg-red-50 rounded-lg p-3 w-fit">
                        <ArrowUpFromLine className="w-4 h-4 text-red-500" />
                        <div>
                          <span className="text-gray-500 text-xs">Issued</span>
                          <p className="font-bold text-red-600">-{lot.issuedQuantity} {product.unit}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-right ml-6 bg-gray-50 rounded-lg p-3">
                    <span className="text-xs text-gray-500">Received Date</span>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(isLotFormat ? lot.receivedDate : lot.receiptDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Movement History */}
                {isLotFormat && lot.movements && lot.movements.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center mb-3">
                      <ClipboardList className="w-5 h-5 text-gray-600 mr-2" />
                      <h4 className="text-sm font-bold text-gray-700">Movement History</h4>
                    </div>
                    <div className="space-y-2">
                      {lot.movements.map((movement, mIdx) => (
                        <div
                          key={mIdx}
                          className={`flex items-center justify-between p-4 rounded-xl ${
                            movement.type === 'Received' 
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' 
                              : 'bg-gradient-to-r from-red-50 to-rose-50 border border-red-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              movement.type === 'Received' ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {movement.type === 'Received' ? (
                                <ArrowDownToLine className="w-5 h-5 text-green-600" />
                              ) : (
                                <ArrowUpFromLine className="w-5 h-5 text-red-600" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${
                                  movement.type === 'Received' ? 'text-green-700' : 'text-red-700'
                                }`}>
                                  {movement.type === 'Received' ? 'Stock In (GRN)' : 'Stock Out (Challan)'}
                                </span>
                                <span className="text-sm font-medium text-gray-600 bg-white px-2 py-0.5 rounded">
                                  {movement.reference}
                                </span>
                              </div>
                              {movement.notes && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {movement.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xl font-bold ${
                              movement.type === 'Received' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {movement.type === 'Received' ? '+' : '-'}{movement.quantity} {product.unit}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(movement.date).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
