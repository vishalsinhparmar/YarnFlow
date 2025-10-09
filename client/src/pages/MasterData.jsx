const MasterData = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Master Data Management</h1>
        <p className="text-gray-600">Manage customers, suppliers, products, and categories</p>
      </div>

      {/* Master Data Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">👥</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">45</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Customers</h3>
          <p className="text-sm text-gray-600 mb-3">Manage customer information and addresses</p>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Manage Customers
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-xl">🏭</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">28</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Suppliers</h3>
          <p className="text-sm text-gray-600 mb-3">Manage supplier details and contracts</p>
          <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Manage Suppliers
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xl">🧶</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">156</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Products</h3>
          <p className="text-sm text-gray-600 mb-3">Yarn types, specifications, and variants</p>
          <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Manage Products
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-xl">📂</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">12</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Categories</h3>
          <p className="text-sm text-gray-600 mb-3">Product categories and classifications</p>
          <button className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Manage Categories
          </button>
        </div>
      </div>

      {/* Recent Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Customers</h2>
            <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">View All</button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-semibold">FH</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Fashion Hub Ltd.</p>
                  <p className="text-xs text-gray-500">Mumbai, Maharashtra</p>
                </div>
              </div>
              <span className="text-xs text-gray-400">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-semibold">TW</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Textile World Co.</p>
                  <p className="text-xs text-gray-500">Delhi, India</p>
                </div>
              </div>
              <span className="text-xs text-gray-400">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-semibold">PF</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Premium Fabrics Inc.</p>
                  <p className="text-xs text-gray-500">Bangalore, Karnataka</p>
                </div>
              </div>
              <span className="text-xs text-gray-400">Active</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Suppliers</h2>
            <button className="text-purple-600 hover:text-purple-900 text-sm font-medium">View All</button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 font-semibold">AT</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">ABC Textiles Ltd.</p>
                  <p className="text-xs text-gray-500">Cotton Yarn Supplier</p>
                </div>
              </div>
              <span className="text-xs text-green-600 font-medium">Verified</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-semibold">XM</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">XYZ Cotton Mills</p>
                  <p className="text-xs text-gray-500">Raw Cotton & Yarn</p>
                </div>
              </div>
              <span className="text-xs text-green-600 font-medium">Verified</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-red-600 font-semibold">PM</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Polyester Mills Inc.</p>
                  <p className="text-xs text-gray-500">Polyester Rolls</p>
                </div>
              </div>
              <span className="text-xs text-yellow-600 font-medium">Pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Categories */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Product Categories</h2>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            + Add Category
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Cotton Yarn</h3>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">85 Products</span>
            </div>
            <p className="text-sm text-gray-600">Various cotton yarn types and counts</p>
            <div className="mt-3 flex flex-wrap gap-1">
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">20s</span>
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">30s</span>
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">40s</span>
            </div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Polyester</h3>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">45 Products</span>
            </div>
            <p className="text-sm text-gray-600">Polyester threads and rolls</p>
            <div className="mt-3 flex flex-wrap gap-1">
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Rolls</span>
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Threads</span>
            </div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Blended Yarn</h3>
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">26 Products</span>
            </div>
            <p className="text-sm text-gray-600">Cotton-polyester blends</p>
            <div className="mt-3 flex flex-wrap gap-1">
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">50/50</span>
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">60/40</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterData;
