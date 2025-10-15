import { useState, useEffect } from 'react';
import Modal from '../../../components/model/Modal';
import ProductForm from './ProductForm';
import { productAPI, categoryAPI, supplierAPI, formatters, handleAPIError } from '../../../services/masterDataAPI';

const ProductManagement = ({ isOpen, onClose }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  // Fetch products
  const fetchProducts = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = {
        page: 1,
        limit: 10,
        ...params
      };
      
      if (searchTerm) queryParams.search = searchTerm;
      if (categoryFilter) queryParams.category = categoryFilter;
      if (statusFilter) queryParams.status = statusFilter;
      
      const response = await productAPI.getAll(queryParams);
      
      if (response.success) {
        setProducts(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(handleAPIError(err, 'Failed to fetch products'));
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories and suppliers for form dropdowns
  const fetchFormData = async () => {
    try {
      const [categoriesRes, suppliersRes] = await Promise.all([
        categoryAPI.getAll(),
        supplierAPI.getAll({ limit: 100 })
      ]);
      
      if (categoriesRes.success) {
        setCategories(categoriesRes.data);
      }
      
      if (suppliersRes.success) {
        setSuppliers(suppliersRes.data);
      }
    } catch (err) {
      console.error('Failed to fetch form data:', err);
    }
  };

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      fetchFormData();
    }
  }, [isOpen, searchTerm, categoryFilter, statusFilter]);

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle category filter
  const handleCategoryFilter = (e) => {
    setCategoryFilter(e.target.value);
  };

  // Handle status filter
  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
  };

  // Handle create product
  const handleCreateProduct = async (productData) => {
    try {
      setFormLoading(true);
      const response = await productAPI.create(productData);
      
      if (response.success) {
        setShowForm(false);
        setEditingProduct(null);
        fetchProducts(); // Refresh list
        alert('Product created successfully!');
      }
    } catch (err) {
      alert(handleAPIError(err, 'Failed to create product'));
    } finally {
      setFormLoading(false);
    }
  };

  // Handle update product (placeholder - would need backend implementation)
  const handleUpdateProduct = async (productData) => {
    try {
      setFormLoading(true);
      // TODO: Implement update API call
      alert('Update functionality will be implemented soon');
      setShowForm(false);
      setEditingProduct(null);
    } catch (err) {
      alert(handleAPIError(err, 'Failed to update product'));
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete product (placeholder - would need backend implementation)
  const handleDeleteProduct = async (productId, productName) => {
    if (window.confirm(`Are you sure you want to delete ${productName}?`)) {
      try {
        setLoading(true);
        // TODO: Implement delete API call
        alert('Delete functionality will be implemented soon');
      } catch (err) {
        alert(handleAPIError(err, 'Failed to delete product'));
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle edit product
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    fetchProducts({ page });
  };

  if (!isOpen) return null;

  const getStockStatus = (product) => {
    const currentStock = product.inventory?.currentStock || 0;
    const minimumStock = product.inventory?.minimumStock || 0;
    const reorderLevel = product.inventory?.reorderLevel || 0;

    if (currentStock === 0) return { status: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (currentStock <= minimumStock) return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    if (currentStock <= reorderLevel) return { status: 'Reorder', color: 'bg-orange-100 text-orange-800' };
    return { status: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Product Management" 
      size="xl"
    >
      {showForm ? (
        <ProductForm
          product={editingProduct}
          categories={categories}
          suppliers={suppliers}
          onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
          onCancel={handleFormCancel}
          loading={formLoading}
        />
      ) : (
        <div className="space-y-4">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              {/* Category Filter */}
              <div>
                <select
                  value={categoryFilter}
                  onChange={handleCategoryFilter}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={handleStatusFilter}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Discontinued">Discontinued</option>
                </select>
              </div>
            </div>
            
            {/* Add Product Button */}
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              + Add Product
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading products...</p>
            </div>
          )}

          {/* Products Table */}
          {!loading && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Specifications
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.length > 0 ? (
                    products.map((product) => {
                      const stockStatus = getStockStatus(product);
                      
                      return (
                        <tr key={product._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {product.productName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {product.productCode}
                              </div>
                              <div className="text-xs text-gray-400">
                                {product.specifications?.yarnCount && `${product.specifications.yarnCount} • `}
                                {product.specifications?.color}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {product.category?.categoryName || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {product.category?.categoryType}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {product.supplier?.companyName || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {product.supplier?.supplierType}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {product.specifications?.weight}kg
                            </div>
                            <div className="text-xs text-gray-500">
                              {product.specifications?.quality}
                            </div>
                            {product.specifications?.composition && (
                              <div className="text-xs text-gray-400">
                                {product.specifications.composition}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {product.inventory?.currentStock || 0} {product.inventory?.unit || 'Units'}
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                              {stockStatus.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              product.status === 'Active' ? 'bg-green-100 text-green-800' :
                              product.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {product.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product._id, product.productName)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                        No products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {products.length} of {pagination.total} products
              </div>
              <div className="flex space-x-2">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded ${
                      page === pagination.current
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {!loading && products.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Total Products:</span>
                  <span className="font-medium ml-2">{pagination.total}</span>
                </div>
                <div>
                  <span className="text-gray-500">Active:</span>
                  <span className="font-medium text-green-600 ml-2">
                    {products.filter(p => p.status === 'Active').length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Low Stock:</span>
                  <span className="font-medium text-yellow-600 ml-2">
                    {products.filter(p => {
                      const stock = p.inventory?.currentStock || 0;
                      const minStock = p.inventory?.minimumStock || 0;
                      return stock <= minStock && stock > 0;
                    }).length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Out of Stock:</span>
                  <span className="font-medium text-red-600 ml-2">
                    {products.filter(p => (p.inventory?.currentStock || 0) === 0).length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default ProductManagement;
