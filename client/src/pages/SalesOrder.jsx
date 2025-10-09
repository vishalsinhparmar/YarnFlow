const SalesOrder = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sales Orders (SO)</h1>
            <p className="text-gray-600">Manage customer orders and sales transactions</p>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            + New Sales Order
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">342</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <span className="text-indigo-600 text-xl">📄</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">45</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-yellow-600 text-xl">⏳</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">267</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-green-600">₹12.4L</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xl">💰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Pipeline */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Pipeline</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-600 text-xl">📝</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Draft</p>
            <p className="text-2xl font-bold text-blue-600">8</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-yellow-600 text-xl">⏳</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">15</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-purple-600 text-xl">🏭</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Processing</p>
            <p className="text-2xl font-bold text-purple-600">22</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-orange-600 text-xl">🚚</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Shipping</p>
            <p className="text-2xl font-bold text-orange-600">18</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-green-600 text-xl">✅</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Delivered</p>
            <p className="text-2xl font-bold text-green-600">279</p>
          </div>
        </div>
      </div>

      {/* Sales Orders Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Sales Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SO Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">SO-2024-123</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Fashion Hub Ltd.</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Jan 15, 2024</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Jan 25, 2024</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹85,430</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Processing</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                  <button className="text-purple-600 hover:text-purple-900">Update</button>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">SO-2024-122</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Textile World Co.</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Jan 14, 2024</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Jan 22, 2024</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹67,250</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">Shipping</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">Track</button>
                  <button className="text-orange-600 hover:text-orange-900">Ship</button>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">SO-2024-121</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Premium Fabrics Inc.</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Jan 12, 2024</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Jan 20, 2024</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹1,24,800</td>
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

export default SalesOrder;
