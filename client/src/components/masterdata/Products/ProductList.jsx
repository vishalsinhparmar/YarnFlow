import { useState, useEffect } from 'react';
import { Edit2, Trash2, Loader2, Search, Filter, Layers, ChevronDown, Tag } from 'lucide-react';
import { productAPI, categoryAPI, handleAPIError } from '../../../services/masterDataAPI';
import Pagination from '../../common/Pagination';
import SimpleDeleteModal from '../../common/SimpleDeleteModal';
import useToast from '../../../hooks/useToast';

const ProductList = ({ onEdit, onRefresh, refreshTrigger, initialCategoryFilter = '' }) => {
  const { productToasts } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(initialCategoryFilter);
  const [subProductsFilter, setSubProductsFilter] = useState(false);
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

  // Sync if initialCategoryFilter changes (e.g. navigating from category page)
  useEffect(() => {
    setCategoryFilter(initialCategoryFilter);
  }, [initialCategoryFilter]);

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchProducts(newPage);
  };

  // Reset to page 1 when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
    fetchProducts(1);
  }, [searchTerm, categoryFilter, subProductsFilter]);

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


  // Client-side filter: if subProductsFilter ON, only show products with subProducts
  const visibleProducts = subProductsFilter
    ? products.filter(p => p.subProducts && p.subProducts.length > 0)
    : products;

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Search */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search products by name, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-gray-400" />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all appearance-none bg-white min-w-[180px] text-sm"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.categoryName}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Sub Products Filter Toggle */}
        <button
          onClick={() => setSubProductsFilter(v => !v)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
            subProductsFilter
              ? 'bg-green-600 border-green-600 text-white shadow-sm'
              : 'bg-white border-gray-300 text-gray-600 hover:border-green-400 hover:text-green-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          With Sub Products
          {subProductsFilter && (
            <span className="ml-1 bg-white bg-opacity-25 text-white text-xs px-1.5 py-0.5 rounded-full">
              ON
            </span>
          )}
        </button>
      </div>

      {/* Active category filter banner (when navigated from CategoryList) */}
      {categoryFilter && initialCategoryFilter && categoryFilter === initialCategoryFilter && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm">
          <span className="text-green-700 font-medium">
            Showing products for: <strong>{categories.find(c => c._id === categoryFilter)?.categoryName || 'Selected Category'}</strong>
          </span>
          <button
            onClick={() => setCategoryFilter('')}
            className="ml-auto text-green-600 hover:text-red-500 text-xs font-medium flex items-center gap-1 transition-colors"
          >
            ✕ Clear filter
          </button>
        </div>
      )}

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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-12">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {visibleProducts.length > 0 ? (
                visibleProducts.map((product, index) => (
                  <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                    {/* Sr No */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-400">
                        {(pagination.current - 1) * itemsPerPage + index + 1}
                      </span>
                    </td>

                    {/* Product name + sub products badge inline */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-sm font-semibold text-gray-900 leading-tight">
                          {product.productName}
                        </span>
                        {product.subProducts && product.subProducts.length > 0 && (
                          <div className="flex items-center flex-wrap gap-1">
                            {product.subProducts.slice(0, 5).map((sp, i) => {
                              const spName = typeof sp === 'object' ? sp.name : sp;
                              const spKey = typeof sp === 'object' ? sp._id : sp + i;
                              return (
                                <span
                                  key={spKey}
                                  className="inline-flex items-center justify-center px-1.5 py-0.5 bg-green-50 text-green-700 text-[11px] font-semibold rounded border border-green-200 min-w-[22px]"
                                >
                                  {spName}
                                </span>
                              );
                            })}
                            {product.subProducts.length > 5 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[11px] font-medium rounded border border-gray-200">
                                +{product.subProducts.length - 5}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Category + status dot */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          product.status === 'Active' ? 'bg-green-500' :
                          product.status === 'Inactive' ? 'bg-gray-400' : 'bg-red-400'
                        }`} />
                        <span className="text-sm text-gray-700">{product.category?.categoryName || 'N/A'}</span>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-400 max-w-[220px] truncate block">
                        {product.description || '—'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEdit(product)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(product)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center">
                    <div className="text-gray-400">
                      {subProductsFilter ? 'No products with sub products found' : 'No products found'}
                    </div>
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
