import { useMasterData } from '../hooks/useMasterData';
import { Link } from 'react-router-dom';

const MasterDataDashboard = () => {
  const {
    stats,
    customers,
    suppliers,
    categories,
    loading,
    error
  } = useMasterData();

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Master Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <span className="text-red-500 text-xl mr-3">⚠️</span>
          <div>
            <h3 className="text-red-800 font-semibold">Error Loading Data</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Master Data Management</h1>
        <p className="text-gray-600">Manage customers, suppliers, products, and categories</p>
      </div>

      {/* Master Data Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/master-data/customers" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer block">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">👥</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {stats?.customers?.total || 0}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Customers</h3>
          <p className="text-sm text-gray-600 mb-3">
            {stats?.customers?.active || 0} active customers
          </p>
          <div className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center">
            Manage Customers
          </div>
        </Link>

        <Link to="/master-data/suppliers" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer block">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-xl">🏭</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {stats?.suppliers?.total || 0}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Suppliers</h3>
          <p className="text-sm text-gray-600 mb-3">
            {stats?.suppliers?.verified || 0} verified suppliers
          </p>
          <div className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center">
            Manage Suppliers
          </div>
        </Link>

        <Link to="/master-data/products" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer block">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xl">🧶</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {stats?.products?.total || 0}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Products</h3>
          <p className="text-sm text-gray-600 mb-3">
            {stats?.products?.lowStock || 0} low stock alerts
          </p>
          <div className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center">
            Manage Products
          </div>
        </Link>

        <Link to="/master-data/categories" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer block">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-xl">📂</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {stats?.categories?.total || 0}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Categories</h3>
          <p className="text-sm text-gray-600 mb-3">Product categories and classifications</p>
          <div className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center">
            Manage Categories
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Customers</h2>
            <Link 
              to="/master-data/customers"
              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {customers && customers.length > 0 ? (
              customers.slice(0, 3).map((customer) => {
                const initials = customer.companyName
                  .split(' ')
                  .map(word => word[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase();
                
                return (
                  <div key={customer._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-semibold text-xs">{initials}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{customer.companyName}</p>
                        <p className="text-xs text-gray-500">
                          {customer.address?.city}, {customer.address?.state}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${
                      customer.status === 'Active' ? 'text-green-600' : 
                      customer.status === 'Inactive' ? 'text-gray-400' : 'text-red-600'
                    }`}>
                      {customer.status}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No customers found</p>
                <Link to="/master-data/customers" className="text-blue-600 hover:text-blue-900 text-sm mt-2 block">
                  Add First Customer
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Suppliers</h2>
            <Link 
              to="/master-data/suppliers"
              className="text-purple-600 hover:text-purple-900 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {suppliers && suppliers.length > 0 ? (
              suppliers.slice(0, 3).map((supplier) => {
                const initials = supplier.companyName
                  .split(' ')
                  .map(word => word[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase();
                
                const statusColor = {
                  'Verified': 'text-green-600',
                  'Pending': 'text-yellow-600',
                  'Rejected': 'text-red-600'
                };
                
                return (
                  <div key={supplier._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-purple-600 font-semibold text-xs">{initials}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{supplier.companyName}</p>
                        <p className="text-xs text-gray-500">{supplier.supplierType}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${statusColor[supplier.verificationStatus] || 'text-gray-400'}`}>
                      {supplier.verificationStatus}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No suppliers found</p>
                <Link 
                  to="/master-data/suppliers"
                  className="text-purple-600 hover:text-purple-900 text-sm mt-2 block"
                >
                  Add First Supplier
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Categories Preview */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Product Categories</h2>
          <Link 
            to="/master-data/categories"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Manage Categories
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories && categories.length > 0 ? (
            categories.slice(0, 3).map((category) => {
              const categoryColors = {
                'Cotton Yarn': 'bg-green-100 text-green-800',
                'Polyester': 'bg-blue-100 text-blue-800',
                'Blended Yarn': 'bg-purple-100 text-purple-800',
                'Raw Material': 'bg-orange-100 text-orange-800',
                'Finished Goods': 'bg-indigo-100 text-indigo-800'
              };
              
              const colorClass = categoryColors[category.categoryType] || 'bg-gray-100 text-gray-800';
              
              return (
                <div key={category._id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{category.categoryName}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${colorClass}`}>
                      {category.categoryType}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {category.description || 'No description available'}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Unit:</span>
                      <span className="font-medium">{category.specifications?.unit}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 text-center py-8">
              <p className="text-gray-500 mb-4">No categories found</p>
              <Link 
                to="/master-data/categories"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block"
              >
                Create First Category
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MasterDataDashboard;
