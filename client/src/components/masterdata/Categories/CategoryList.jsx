import { useState, useEffect } from 'react';
import { categoryAPI, handleAPIError } from '../../../services/masterDataAPI';

const CategoryList = ({ onEdit, onRefresh, refreshTrigger }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoryAPI.getAll();
      
      if (response.success) {
        setCategories(response.data);
      }
    } catch (err) {
      setError(handleAPIError(err, 'Failed to fetch categories'));
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts or refresh is triggered
  useEffect(() => {
    fetchCategories();
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
            categories.map((category) => (
              <div key={category._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                {/* Category Header */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {category.categoryName}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded ${
                    category.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {category.status}
                  </span>
                </div>

                {/* Category Code */}
                <div className="text-xs text-gray-500 mb-3">
                  Code: {category.categoryCode}
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

      {/* Summary */}
      {!loading && categories.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Total Categories: <span className="font-medium">{categories.length}</span>
            {' • '}
            Active: <span className="font-medium text-green-600">
              {categories.filter(cat => cat.status === 'Active').length}
            </span>
            {' • '}
            Inactive: <span className="font-medium text-gray-600">
              {categories.filter(cat => cat.status === 'Inactive').length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryList;
