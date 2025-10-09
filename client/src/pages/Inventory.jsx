const Inventory = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Inventory Lots Management</h1>
            <p className="text-gray-600">Track yarn bags, polyester rolls, and textile inventory lots</p>
          </div>
          <div className="flex space-x-3">
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              + Add Lot
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              📦 Lot Transfer
            </button>
            <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              📊 Reports
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cotton Yarn Bags</p>
              <p className="text-2xl font-bold text-gray-900">850</p>
              <p className="text-xs text-gray-500">100kg each</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xl">🧶</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Polyester Rolls</p>
              <p className="text-2xl font-bold text-gray-900">395</p>
              <p className="text-xs text-gray-500">75kg each</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">🎯</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Lots</p>
              <p className="text-2xl font-bold text-green-600">89</p>
              <p className="text-xs text-gray-500">Different batches</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-yellow-600 text-xl">🏷️</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-purple-600">₹8.9L</p>
              <p className="text-xs text-gray-500">Current stock</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-xl">💎</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lot Summary Example */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Lot Example (Based on Your Image)</h2>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Inventory - 100 bags</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>1st bag:</span>
                  <span className="font-medium">50.0 kg</span>
                </div>
                <div className="flex justify-between">
                  <span>2nd bag:</span>
                  <span className="font-medium">50.2 kg</span>
                </div>
                <div className="flex justify-between">
                  <span>3rd bag:</span>
                  <span className="font-medium">50.2 kg</span>
                </div>
                <div className="flex justify-between">
                  <span>4th bag:</span>
                  <span className="font-medium">50.5 kg</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Product Details</h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-600">Material:</span> Cotton yarn 2 roll/bag 100kg</div>
                <div><span className="text-gray-600">Secondary:</span> Polyester 3 roll 75KG</div>
                <div><span className="text-gray-600">Supplier:</span> 100 bag</div>
                <div><span className="text-gray-600">PO Reference:</span> PO-2024-001</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <span className="text-lg mr-3">📥</span>
                <span className="font-medium">Stock In</span>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <span className="text-lg mr-3">📤</span>
                <span className="font-medium">Stock Out</span>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <span className="text-lg mr-3">🔄</span>
                <span className="font-medium">Stock Transfer</span>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Alerts</h3>
          <div className="space-y-3">
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm font-medium text-red-800">Cotton Yarn - 20s</p>
              <p className="text-xs text-red-600">Only 45 kg remaining</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm font-medium text-red-800">Polyester Thread</p>
              <p className="text-xs text-red-600">Only 12 spools left</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm font-medium text-yellow-800">Wool Blend</p>
              <p className="text-xs text-yellow-600">Running low - 78 kg</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Movements</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center">
                <span className="text-green-500 mr-2">📥</span>
                <div>
                  <p className="text-sm font-medium">Cotton Yarn</p>
                  <p className="text-xs text-gray-500">+200 kg</p>
                </div>
              </div>
              <span className="text-xs text-gray-400">2h ago</span>
            </div>
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">📤</span>
                <div>
                  <p className="text-sm font-medium">Silk Thread</p>
                  <p className="text-xs text-gray-500">-50 spools</p>
                </div>
              </div>
              <span className="text-xs text-gray-400">4h ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Lots Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Inventory Lots Tracking</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lot Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight/Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">LOT-2024-001</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Cotton Yarn 2s</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                    🧶 Bags
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">100 bags</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">50.2 kg avg</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">ABC Textiles</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Available</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">View Bags</button>
                  <button className="text-purple-600 hover:text-purple-900">Transfer</button>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">LOT-2024-002</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Polyester 3s</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    🎯 Rolls
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">75 rolls</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">75 kg each</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">XYZ Mills</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Available</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">View Rolls</button>
                  <button className="text-purple-600 hover:text-purple-900">Transfer</button>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">LOT-2024-003</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Cotton Yarn 20s</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                    🧶 Bags
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">25 bags</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">49.8 kg avg</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Premium Cotton Ltd</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Partial</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">View Bags</button>
                  <button className="text-orange-600 hover:text-orange-900">Complete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
