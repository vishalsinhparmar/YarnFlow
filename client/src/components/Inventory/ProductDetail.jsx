import React from 'react';

const ProductDetail = ({ product, onClose }) => {
  if (!product) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.productName}</h1>
            <p className="text-gray-600 mt-1">
              Total Stock: {product.totalStock} {product.unit} • {product.totalWeight.toFixed(2)} Kg
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Stock</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {product.totalStock} {product.unit}
              </p>
            </div>
            <div className="text-4xl">📦</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Weight</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {product.totalWeight.toFixed(2)} Kg
              </p>
            </div>
            <div className="text-4xl">⚖️</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total GRNs</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {product.grnCount}
              </p>
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

      {/* Receipt History */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Receipt History ({product.grnCount} GRNs)
        </h2>
        <div className="space-y-3">
          {product.grns && product.grns.map((grn, idx) => (
            <div
              key={idx}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-lg font-semibold text-blue-600">
                      {grn.grnNumber}
                    </span>
                    <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
                      PO: {grn.poNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Supplier:</span>
                      <span className="font-medium text-gray-900">{grn.supplierName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Date:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(grn.receiptDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right ml-6">
                  <div className="text-xl font-bold text-green-600">
                    +{grn.receivedQuantity} {product.unit}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {grn.receivedWeight.toFixed(2)} Kg
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
