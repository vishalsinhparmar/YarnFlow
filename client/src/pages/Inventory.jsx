import React, { useState, useEffect } from 'react';
import { Package, Tags, CheckCircle, Search, ChevronDown, ChevronRight, X, Loader2, Filter } from 'lucide-react';
import { inventoryAPI } from '../services/inventoryAPI';
import { categoryAPI } from '../services/masterDataAPI';
import ProductDetail from '../components/Inventory/ProductDetail';
import SearchableSelect from '../components/common/SearchableSelect';

const Inventory = () => {
  const [categorizedProducts, setCategorizedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [categoryProductLimits, setCategoryProductLimits] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
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
  }, [currentPage, itemsPerPage, debouncedSearchTerm, categoryFilter, categoriesLoading]);

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
        limit: itemsPerPage,
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

  const toggleCategory = (categoryKey) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
  };

  const handleBackToList = () => {
    setSelectedProduct(null);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-md">
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
            <div className="absolute inset-0 w-20 h-20 mx-auto rounded-full border-4 border-indigo-200 animate-pulse"></div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Loading Inventory</h3>
          <p className="text-gray-500">Fetching your products and categories...</p>
          <div className="mt-6 flex justify-center gap-1">
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  const totalProducts = pagination?.totalProducts || 0;

  // Show product detail view if a product is selected
  if (selectedProduct) {
    return <ProductDetail product={selectedProduct} onClose={handleBackToList} />;
  }

  // Show inventory list view
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold">Inventory Management</h1>
            </div>
            <p className="text-indigo-100 ml-[52px]">Track and manage inventory lots from approved Goods Receipt Notes</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl shadow-sm p-6 border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-orange-600 uppercase tracking-wide">Total Products</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {totalProducts}
              </p>
            </div>
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center shadow-inner">
              <Package className="w-7 h-7 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Active Categories</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {pagination?.total || categorizedProducts.length}
              </p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center shadow-inner">
              <Tags className="w-7 h-7 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm p-6 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-600 uppercase tracking-wide">Fully Received</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {totalProducts}
              </p>
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center shadow-inner">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search products, PO numbers, suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            {loading && debouncedSearchTerm !== searchTerm && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
              </div>
            )}
          </div>
          
          {/* Category Filter with SearchableSelect - Fixed width to prevent layout shift */}
          <div className="flex items-center gap-3">
            <div className="w-[280px]">
              <SearchableSelect
                options={[{ _id: '', categoryName: 'All Categories' }, ...categories]}
                value={categoryFilter}
                onChange={(value) => {
                  setCategoryFilter(value);
                  setCurrentPage(1);
                }}
                placeholder="All Categories"
                searchPlaceholder="Search categories..."
                getOptionLabel={(category) => category.categoryName}
                getOptionValue={(category) => category._id}
                loading={categoriesLoading}
              />
            </div>
            
            {/* Clear Filter Button - Fixed position, always reserve space */}
            <div className="w-10 h-10 flex items-center justify-center">
              {categoryFilter ? (
                <button
                  onClick={() => {
                    setCategoryFilter('');
                    setCurrentPage(1);
                  }}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-300 hover:border-red-300 rounded-lg transition-all"
                  title="Clear filter"
                >
                  <X className="w-5 h-5" />
                </button>
              ) : null}
            </div>
            
            {/* Loading Indicator */}
            {loading && !categoriesLoading && (
              <div className="flex items-center gap-2 text-sm text-indigo-600">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Products Grouped by Category */}
      <div className="space-y-4">
        {loading && categorizedProducts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-16 text-center border border-gray-100">
            <div className="relative mb-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
              </div>
              <div className="absolute inset-0 w-20 h-20 mx-auto rounded-full border-4 border-indigo-200 animate-pulse"></div>
            </div>
            <p className="text-lg font-medium text-gray-700">Loading inventory...</p>
            <p className="text-sm text-gray-500 mt-2">Please wait while we fetch your data</p>
            <div className="mt-4 flex justify-center gap-1">
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        ) : categorizedProducts.length > 0 ? (
          categorizedProducts.map((category) => {
            const categoryKey = category.categoryId || 'uncategorized';
            const isExpanded = expandedCategories[categoryKey];
            const productLimit = categoryProductLimits[categoryKey] || 10;
            const displayedProducts = category.products.slice(0, productLimit);
            const hasMore = category.products.length > productLimit;
            
            return (
              <div key={categoryKey} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                {/* Category Header - Sticky */}
                <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                  <button
                    onClick={() => toggleCategory(categoryKey)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isExpanded ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                        <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-bold text-gray-900">
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
                    <span className="inline-flex items-center px-4 py-1.5 rounded-lg text-sm font-semibold bg-indigo-100 text-indigo-700">
                      {category.categoryName}
                    </span>
                  </button>
                </div>

                {/* Category Products */}
                {isExpanded && (
                  <div>
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Current Stock</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider bg-blue-50">Stock In</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-red-700 uppercase tracking-wider bg-red-50">Stock Out</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Weight</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {displayedProducts.map((product, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                  </div>
                                  <span className="text-sm font-semibold text-gray-900">
                                    {highlightText(product.productName, debouncedSearchTerm)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-lg font-bold text-green-600">
                                  {product.currentStock || product.totalStock} {product.unit}
                                </div>
                                <div className="text-xs text-gray-500">
                                  After stock out
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap bg-blue-50/50">
                                <div className="text-sm font-bold text-blue-600">
                                  +{product.receivedStock || product.totalStock}
                                </div>
                                <div className="text-xs text-gray-500">
                                  From GRN
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap bg-red-50/50">
                                <div className="text-sm font-bold text-red-600">
                                  -{product.issuedStock || 0}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Via Challan
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-bold text-gray-900">
                                  {product.currentWeight ? `${product.currentWeight.toFixed(2)} Kg` : (product.totalWeight ? `${product.totalWeight.toFixed(2)} Kg` : '-')}
                                </div>
                                <div className="flex items-center space-x-2 mt-1">
                                  {product.receivedWeight > 0 && (
                                    <span className="text-xs text-green-600 font-semibold">
                                      +{product.receivedWeight.toFixed(2)}
                                    </span>
                                  )}
                                  {product.issuedWeight > 0 && (
                                    <span className="text-xs text-red-600 font-semibold">
                                      -{product.issuedWeight.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  onClick={() => handleViewProduct(product)}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Load More Button */}
                    {hasMore && (
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
                        <button
                          onClick={() => loadMoreProducts(categoryKey)}
                          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
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
          <div className="bg-white rounded-xl shadow-sm p-16 text-center border border-gray-100">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-50 rounded-full mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-700 mb-2">No fully received products found</p>
            <p className="text-sm text-gray-500">Products that are 100% received from POs will appear here</p>
          </div>
        )}
      </div>

      {/* Category Pagination */}
      {pagination && (
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold text-indigo-600">{categorizedProducts.length}</span> of{' '}
                <span className="font-semibold text-gray-900">{pagination.total}</span> categories
                {pagination.totalProducts > 0 && (
                  <span className="text-gray-400 ml-2">
                    ({pagination.totalProducts} total products)
                  </span>
                )}
              </div>
              
              {/* Per Page Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>All</option>
                </select>
              </div>
            </div>
            
            {pagination.pages > 1 && (
              <div className="flex items-center gap-2">
                {/* First Page */}
                {currentPage > 2 && (
                  <button
                    onClick={() => setCurrentPage(1)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    title="First page"
                  >
                    1
                  </button>
                )}
                
                {currentPage > 3 && (
                  <span className="text-gray-400">...</span>
                )}
                
                {/* Previous */}
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  <span className="hidden sm:inline">Prev</span>
                </button>
                
                {/* Current Page */}
                <span className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-semibold shadow-sm min-w-[80px] text-center">
                  {currentPage} / {pagination.pages}
                </span>
                
                {/* Next */}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
                  disabled={currentPage === pagination.pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                
                {currentPage < pagination.pages - 2 && (
                  <span className="text-gray-400">...</span>
                )}
                
                {/* Last Page */}
                {currentPage < pagination.pages - 1 && (
                  <button
                    onClick={() => setCurrentPage(pagination.pages)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    title="Last page"
                  >
                    {pagination.pages}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Inventory;
