import { useState, useEffect } from 'react';
import { categoryAPI, handleAPIError } from '../../../services/masterDataAPI';
import Pagination from '../../common/Pagination';

const CategoryList = ({ onEdit, onRefresh, refreshTrigger }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  // Fetch categories
  const fetchCategories = async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = {
        page,
        limit: itemsPerPage
      };
      
      if (searchTerm) queryParams.search = searchTerm;
      
      const response = await categoryAPI.getAll(queryParams);
      
      if (response.success) {
        setCategories(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(handleAPIError(err, 'Failed to fetch categories'));
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchCategories(newPage);
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
    fetchCategories(1);
  }, [searchTerm]);

  // Refresh when trigger changes
  useEffect(() => {
    fetchCategories(currentPage);
  }, [refreshTrigger]);

  // Handle delete category
  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (window.confirm(`Are you sure you want to delete category "${categoryName}"?`)) {
      try {
        const response = await categoryAPI.delete(categoryId);
        if (response.success) {
          fetchCategories(); // Refresh list
          onRefresh?.(); // Notify parent
        }
      } catch (err) {
        setError(handleAPIError(err, 'Failed to delete category'));
      }
    }
  };


  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex justify-between items-center">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
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
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading categories...</p>
        </div>
      )}

      {/* Categories Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.length > 0 ? (
            categories.map((category, index) => (
              <div key={category._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                {/* Category Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      #{(pagination.current - 1) * itemsPerPage + index + 1}
                    </span>
                    <h3 className="font-semibold text-gray-900 truncate">
                      {category.categoryName}
                    </h3>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded flex-shrink-0 ${
                    category.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {category.status}
                  </span>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {category.description || 'No description available'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 pt-3 border-t">
                  <button
                    onClick={() => onEdit(category)}
                    className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category._id, category.categoryName)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-8">
              <div className="text-gray-500 mb-4">
                <span className="text-4xl">📂</span>
                <p className="mt-2">No categories found</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && categories.length > 0 && (
        <Pagination
          currentPage={pagination.current}
          totalPages={pagination.pages}
          totalItems={pagination.total}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  );
};

export default CategoryList;
