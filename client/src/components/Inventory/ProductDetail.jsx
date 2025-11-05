import React from 'react';
import { getWarehouseName } from '../../constants/warehouseLocations';

const ProductDetail = ({ product, onClose }) => {
  if (!product) return null;

  // Debug: Log product lots data
  console.log('📦 ProductDetail - Lots data:', {
    productName: product.productName,
    lotsCount: (product.lots || product.grns || []).length,
    lots: (product.lots || product.grns || []).map(lot => ({
      lotNumber: lot.lotNumber,
      warehouse: lot.warehouse,
      warehouseName: getWarehouseName(lot.warehouse)
    }))
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.productName}</h1>
            <p className="text-gray-600 mt-1">
              Current Stock: {product.currentStock || product.totalStock} {product.unit}
              {product.totalWeight && ` • ${product.totalWeight.toFixed(2)} Kg`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Back to Inventory
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Stock</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {product.currentStock || product.totalStock} {product.unit}
              </p>
              <p className="text-xs text-gray-500 mt-1">After stock out</p>
            </div>
            <div className="text-4xl">📦</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stock In (GRN)</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                +{product.receivedStock || product.totalStock}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total received</p>
            </div>
            <div className="text-4xl">📥</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stock Out (Challan)</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                -{product.issuedStock || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total issued</p>
            </div>
            <div className="text-4xl">📤</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Lots</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {product.lotCount || product.grnCount || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Inventory lots</p>
            </div>
            <div className="text-4xl">📋</div>
          </div>
        </div>
      </div>

      {/* Suppliers */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Suppliers</h2>
        <div className="flex flex-wrap gap-2">
          {product.suppliers && product.suppliers.map((supplier, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
            >
              {supplier}
            </span>
          ))}
        </div>
      </div>

      {/* Inventory Lots with Movements */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Inventory Lots ({product.lotCount || product.grnCount || 0} Lots)
        </h2>
        <div className="space-y-4">
          {(product.lots || product.grns || []).map((lot, idx) => {
            const isLotFormat = lot.lotNumber !== undefined;
            return (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-lg font-semibold text-blue-600">
                        {isLotFormat ? lot.lotNumber : lot.grnNumber}
                      </span>
                      <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
                        {isLotFormat ? `GRN: ${lot.grnNumber}` : `PO: ${lot.poNumber}`}
                      </span>
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                        (isLotFormat ? lot.status : 'Active') === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isLotFormat ? lot.status : 'Active'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Supplier:</span>
                        <span className="font-medium text-gray-900">
                          {isLotFormat ? lot.supplierName : lot.supplierName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Warehouse:</span>
                        <span className="font-medium text-purple-600">
                          📍 {getWarehouseName(isLotFormat ? lot.warehouse : lot.warehouseLocation)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Received:</span>
                        <span className="font-medium text-green-600">
                          {isLotFormat ? lot.receivedQuantity : lot.receivedQuantity} {product.unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Current:</span>
                        <span className="font-medium text-blue-600">
                          {isLotFormat ? lot.currentQuantity : lot.receivedQuantity} {product.unit}
                        </span>
                      </div>
                    </div>

                    {isLotFormat && lot.issuedQuantity > 0 && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-500">Issued:</span>
                        <span className="font-medium text-red-600 ml-2">
                          -{lot.issuedQuantity} {product.unit}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-right ml-6">
                    <div className="text-sm text-gray-500">
                      {new Date(isLotFormat ? lot.receivedDate : lot.receiptDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>

                {/* Movement History */}
                {isLotFormat && lot.movements && lot.movements.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Movement History</h4>
                    <div className="space-y-2">
                      {lot.movements.map((movement, mIdx) => (
                        <div
                          key={mIdx}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            movement.type === 'Received' 
                              ? 'bg-green-50 border border-green-200' 
                              : 'bg-red-50 border border-red-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`text-2xl ${
                              movement.type === 'Received' ? '📥' : '📤'
                            }`}></span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold ${
                                  movement.type === 'Received' ? 'text-green-700' : 'text-red-700'
                                }`}>
                                  {movement.type === 'Received' ? 'Stock In' : 'Stock Out'}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {movement.reference}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {movement.notes}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${
                              movement.type === 'Received' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {movement.type === 'Received' ? '+' : '-'}{movement.quantity} {product.unit}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(movement.date).toLocaleDateString('en-IN')}
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
