import React, { useState, useEffect } from 'react';
import { inventoryAPI } from '../services/inventoryAPI';
import { categoryAPI } from '../services/masterDataAPI';

const Inventory = () => {
  const [categorizedProducts, setCategorizedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [categoryProductLimits, setCategoryProductLimits] = useState({});
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch inventory data when filters change
  useEffect(() => {
    if (!categoriesLoading) {
      fetchInventoryData();
    }
  }, [currentPage, debouncedSearchTerm, categoryFilter, categoriesLoading]);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await categoryAPI.getAll();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Build query parameters for fully received products
      const params = {
        page: currentPage,
        limit: 20,
        search: debouncedSearchTerm,
        sortBy: 'latestReceiptDate',
        sortOrder: 'desc'
      };

      // Add category filter if selected
      if (categoryFilter) {
        params.category = categoryFilter;
      }

      // Fetch fully received products from inventory endpoint
      const response = await inventoryAPI.getAll(params);

      if (response.success) {
        const categorizedData = response.data || [];
        setCategorizedProducts(categorizedData);
        setPagination(response.pagination || null);
        
        // Auto-expand all categories on first load or when filtering
        const expanded = {};
        const limits = {};
        categorizedData.forEach(cat => {
          const catKey = cat.categoryId || 'uncategorized';
          expanded[catKey] = true;
          limits[catKey] = 10; // Show first 10 products per category
        });
        setExpandedCategories(expanded);
        setCategoryProductLimits(limits);
      } else {
        setError(response.message || 'Failed to load inventory data');
        setCategorizedProducts([]);
      }
      
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      setError(error.message || 'Failed to load inventory data. Please try again.');
      setCategorizedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const loadMoreProducts = (categoryId) => {
    setCategoryProductLimits(prev => ({
      ...prev,
      [categoryId]: (prev[categoryId] || 10) + 10
    }));
  };

  const highlightText = (text, search) => {
    if (!search || !text) return text;
    const parts = text.toString().split(new RegExp(`(${search})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === search.toLowerCase() ? 
        <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark> : 
        part
    );
  };


  if (loading && categorizedProducts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalProducts = pagination?.totalProducts || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Inventory Management</h1>
          <p className="text-gray-600">Track and manage inventory lots from approved Goods Receipt Notes</p>
        </div>
      </div>


      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {totalProducts}
              </p>
            </div>
            <div className="text-4xl">📦</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Categories</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {pagination?.total || categorizedProducts.length}
              </p>
            </div>
            <div className="text-4xl">🏷️</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Fully Received</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {totalProducts}
              </p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products, PO numbers, suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
              {loading && debouncedSearchTerm !== searchTerm && (
                <div className="absolute right-3 top-2.5">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            {searchTerm && (
              <p className="text-xs text-gray-500 mt-1">
                {debouncedSearchTerm === searchTerm ? 
                  `Searching for "${searchTerm}"...` : 
                  'Typing...'}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              disabled={categoriesLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px] bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {categoriesLoading ? 'Loading categories...' : 'All Categories'}
              </option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.categoryName}
                </option>
              ))}
            </select>
            {categoryFilter && !categoriesLoading && (
              <button
                onClick={() => {
                  setCategoryFilter('');
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Clear filter"
              >
                ✕
              </button>
            )}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Loading...
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Products Grouped by Category */}
      <div className="space-y-4">
        {loading && categorizedProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading inventory...</p>
          </div>
        ) : categorizedProducts.length > 0 ? (
          categorizedProducts.map((category) => {
            const categoryKey = category.categoryId || 'uncategorized';
            const isExpanded = expandedCategories[categoryKey];
            const productLimit = categoryProductLimits[categoryKey] || 10;
            const displayedProducts = category.products.slice(0, productLimit);
            const hasMore = category.products.length > productLimit;
            
            return (
              <div key={categoryKey} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Category Header - Sticky */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
                  <button
                    onClick={() => toggleCategory(categoryKey)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{isExpanded ? '▼' : '▶'}</span>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {highlightText(category.categoryName, debouncedSearchTerm)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {category.products.length} product(s)
                          {isExpanded && productLimit < category.products.length && 
                            ` • Showing ${productLimit} of ${category.products.length}`
                          }
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {category.categoryName}
                    </span>
                  </button>
                </div>

                {/* Category Products */}
                {isExpanded && (
                  <div>
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Received</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Weight</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GRNs</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {displayedProducts.map((product, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {highlightText(product.productName, debouncedSearchTerm)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {highlightText(product.productCode, debouncedSearchTerm)}
                                </div>
                                <div className="text-xs text-green-600 mt-1">
                                  ✓ Fully Received ({product.orderedQuantity} {product.unit})
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {highlightText(product.poNumber, debouncedSearchTerm)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {product.totalReceivedQuantity} {product.unit}
                                </div>
                                <div className="text-xs text-gray-500">
                                  of {product.orderedQuantity} {product.unit}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {product.totalReceivedWeight ? `${product.totalReceivedWeight.toFixed(2)} Kg` : '-'}
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">{product.grnCount} GRN(s)</div>
                                <div className="text-xs text-gray-500">
                                  {product.grns.map(grn => highlightText(grn.grnNumber, debouncedSearchTerm)).reduce((prev, curr, i) => 
                                    i === 0 ? [curr] : [...prev, ', ', curr], []
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {highlightText(product.supplierName || 'N/A', debouncedSearchTerm)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Load More Button */}
                    {hasMore && (
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center">
                        <button
                          onClick={() => loadMoreProducts(categoryKey)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Load More ({category.products.length - productLimit} remaining)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-500">
              <p className="text-lg font-medium mb-2">No fully received products found</p>
              <p className="text-sm">Products that are 100% received from POs will appear here</p>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {[...Array(pagination.pages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`px-3 py-1 border rounded-md text-sm font-medium ${
                    currentPage === index + 1
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
                disabled={currentPage === pagination.pages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Inventory;
