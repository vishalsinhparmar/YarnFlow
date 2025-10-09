const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">YarnFlow Dashboard</h1>
        <p className="text-gray-600">Complete Textile Supply Chain Management Overview</p>
      </div>

      {/* Workflow Process Flow */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Supply Chain Workflow</h2>
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
          
          {/* Supplier */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
              <span className="text-purple-600 text-xl">🏭</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Supplier</p>
            <p className="text-xs text-gray-500">Raw Materials</p>
          </div>
          
          <div className="text-gray-400">→</div>
          
          {/* Purchase Order */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
              <span className="text-blue-600 text-xl">🛒</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Purchase Order</p>
            <p className="text-xs text-gray-500">156 Active</p>
          </div>
          
          <div className="text-gray-400">→</div>
          
          {/* GRN */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-2">
              <span className="text-green-600 text-xl">📋</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Goods Receipt</p>
            <p className="text-xs text-gray-500">89 Processed</p>
          </div>
          
          <div className="text-gray-400">→</div>
          
          {/* Inventory */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-lg flex items-center justify-center mb-2">
              <span className="text-yellow-600 text-xl">📦</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Inventory Lots</p>
            <p className="text-xs text-gray-500">1,245 Bags</p>
          </div>
          
          <div className="text-gray-400">→</div>
          
          {/* Sales Order */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center mb-2">
              <span className="text-indigo-600 text-xl">📄</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Sales Order</p>
            <p className="text-xs text-gray-500">342 Orders</p>
          </div>
          
          <div className="text-gray-400">→</div>
          
          {/* Sales Challan */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-teal-100 rounded-lg flex items-center justify-center mb-2">
              <span className="text-teal-600 text-xl">🚚</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Sales Challan</p>
            <p className="text-xs text-gray-500">198 Dispatched</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Inventory</p>
              <p className="text-2xl font-bold text-gray-900">1,245</p>
              <p className="text-xs text-gray-500">Bags/Rolls</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-yellow-600 text-xl">📦</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cotton Yarn Stock</p>
              <p className="text-2xl font-bold text-gray-900">850</p>
              <p className="text-xs text-gray-500">Bags Available</p>
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
              <p className="text-xs text-gray-500">Rolls in Stock</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">🎯</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹12.4L</p>
              <p className="text-xs text-gray-500">This Month</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-xl">💰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">New Purchase Order Created</p>
              <p className="text-xs text-gray-500">PO-2024-001 - 2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Goods Receipt Note Approved</p>
              <p className="text-xs text-gray-500">GRN-2024-045 - 4 hours ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Sales Order Pending</p>
              <p className="text-xs text-gray-500">SO-2024-123 - 6 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
