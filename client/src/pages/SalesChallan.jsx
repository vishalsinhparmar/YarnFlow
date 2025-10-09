const SalesChallan = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sales Challan</h1>
            <p className="text-gray-600">Manage delivery challans and shipment documents</p>
          </div>
          <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            + New Challan
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Challans</p>
              <p className="text-2xl font-bold text-gray-900">198</p>
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <span className="text-teal-600 text-xl">🚚</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Transit</p>
              <p className="text-2xl font-bold text-orange-600">34</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-xl">🚛</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-green-600">156</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-blue-600">47</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">📅</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Status Overview */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Status Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-600 text-lg">📋</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Prepared</p>
            <p className="text-xl font-bold text-blue-600">8</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-yellow-600 text-lg">📦</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Packed</p>
            <p className="text-xl font-bold text-yellow-600">12</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-orange-600 text-lg">🚚</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Dispatched</p>
            <p className="text-xl font-bold text-orange-600">22</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-green-600 text-lg">🏠</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Delivered</p>
            <p className="text-xl font-bold text-green-600">156</p>
          </div>
        </div>
      </div>

      {/* Recent Deliveries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Deliveries</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center">
                <span className="text-green-500 text-lg mr-3">✅</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">CH-2024-089</p>
                  <p className="text-xs text-gray-500">Fashion Hub Ltd. - Delivered</p>
                </div>
              </div>
              <span className="text-xs text-gray-400">2h ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center">
                <span className="text-green-500 text-lg mr-3">✅</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">CH-2024-088</p>
                  <p className="text-xs text-gray-500">Textile World Co. - Delivered</p>
                </div>
              </div>
              <span className="text-xs text-gray-400">5h ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center">
                <span className="text-orange-500 text-lg mr-3">🚚</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">CH-2024-087</p>
                  <p className="text-xs text-gray-500">Premium Fabrics - In Transit</p>
                </div>
              </div>
              <span className="text-xs text-gray-400">1d ago</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Dispatches</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center">
                <span className="text-yellow-500 text-lg mr-3">📦</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">CH-2024-090</p>
                  <p className="text-xs text-gray-500">Ready for dispatch</p>
                </div>
              </div>
              <button className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">Dispatch</button>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <span className="text-blue-500 text-lg mr-3">📋</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">CH-2024-091</p>
                  <p className="text-xs text-gray-500">Being prepared</p>
                </div>
              </div>
              <button className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Prepare</button>
            </div>
          </div>
        </div>
      </div>

      {/* Challan Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Sales Challans</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Challan No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SO Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispatch Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">CH-2024-090</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">SO-2024-123</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Fashion Hub Ltd.</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Jan 22, 2024</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">MH-12-AB-1234</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">In Transit</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">Track</button>
                  <button className="text-teal-600 hover:text-teal-900">Print</button>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">CH-2024-089</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">SO-2024-122</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Textile World Co.</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Jan 20, 2024</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">GJ-05-CD-5678</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Delivered</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                  <button className="text-gray-400">Completed</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesChallan;
