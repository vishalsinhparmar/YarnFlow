import { useState, useEffect } from 'react';
import { Edit2, Trash2, Loader2, Search, Box, Filter } from 'lucide-react';
import { productAPI, categoryAPI, supplierAPI, handleAPIError } from '../../../services/masterDataAPI';
import Pagination from '../../common/Pagination';
import SimpleDeleteModal from '../../common/SimpleDeleteModal';
import useToast from '../../../hooks/useToast';

const ProductList = ({ onEdit, onRefresh, refreshTrigger }) => {
  const { productToasts } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, product: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch products
  const fetchProducts = async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = {
        page,
        limit: itemsPerPage
      };
      
      if (searchTerm) queryParams.search = searchTerm;
      if (categoryFilter) queryParams.category = categoryFilter;
      
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

  // Fetch categories for filter
  useEffect(() => {
    categoryAPI.getAll({ limit: 100 }).then(res => res.success && setCategories(res.data));
  }, []);

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchProducts(newPage);
  };

  // Reset to page 1 when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
    fetchProducts(1);
  }, [searchTerm, categoryFilter]);

  // Refresh when trigger changes
  useEffect(() => {
    fetchProducts(currentPage);
  }, [refreshTrigger]);

  // Handle delete product
  const handleDeleteClick = (product) => {
    setDeleteModal({ isOpen: true, product });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.product) return;
    
    try {
      setDeleteLoading(true);
      const response = await productAPI.delete(deleteModal.product._id);
      if (response.success) {
        productToasts.deleteSuccess(deleteModal.product.productName);
        setDeleteModal({ isOpen: false, product: null });
        fetchProducts();
        onRefresh?.();
      }
    } catch (err) {
      productToasts.deleteError();
      setError(handleAPIError(err, 'Failed to delete product'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, product: null });
  };


  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search products by name, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          />
        </div>
        
        {/* Category Filter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all appearance-none bg-white min-w-[200px]"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category._id} value={category._id}>{category.categoryName}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <Loader2 className="w-10 h-10 text-green-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-700 font-medium text-lg">Loading products...</p>
          <p className="text-gray-500 text-sm mt-1">Please wait while we fetch the data</p>
        </div>
      )}

      {/* Products Table */}
      {!loading && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sr. No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
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
                products.map((product, index) => {
                  return (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {(pagination.current - 1) * itemsPerPage + index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {product.productName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.category?.categoryName || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {product.description || 'No description'}
                        </div>
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
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => onEdit(product)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                            title="Edit product"
                          >
                            <Edit2 className="w-4 h-4 mr-1.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(product)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4 mr-1.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && products.length > 0 && (
        <Pagination
          currentPage={pagination.current}
          totalPages={pagination.pages}
          totalItems={pagination.total}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
        />
      )}

      {/* Delete Confirmation Modal */}
      <SimpleDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemName={deleteModal.product?.productName}
        loading={deleteLoading}
      />
    </div>
  );
};

export default ProductList;
