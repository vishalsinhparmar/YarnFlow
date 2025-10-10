import { useState, useEffect } from 'react';
import Modal from './Modal';
import CategoryForm from './CategoryForm';
import { categoryAPI, handleAPIError } from '../services/masterDataAPI';

const CategoryManagement = ({ isOpen, onClose }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

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

  // Load categories when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // Handle create category
  const handleCreateCategory = async (categoryData) => {
    try {
      setFormLoading(true);
      const response = await categoryAPI.create(categoryData);
      
      if (response.success) {
        setShowForm(false);
        setEditingCategory(null);
        fetchCategories(); // Refresh list
        alert('Category created successfully!');
      }
    } catch (err) {
      alert(handleAPIError(err, 'Failed to create category'));
    } finally {
      setFormLoading(false);
    }
  };

  // Handle update category (placeholder - would need backend implementation)
  const handleUpdateCategory = async (categoryData) => {
    try {
      setFormLoading(true);
      // TODO: Implement update API call
      alert('Update functionality will be implemented soon');
      setShowForm(false);
      setEditingCategory(null);
    } catch (err) {
      alert(handleAPIError(err, 'Failed to update category'));
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete category (placeholder - would need backend implementation)
  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (window.confirm(`Are you sure you want to delete ${categoryName}?`)) {
      try {
        setLoading(true);
        // TODO: Implement delete API call
        alert('Delete functionality will be implemented soon');
      } catch (err) {
        alert(handleAPIError(err, 'Failed to delete category'));
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle edit category
  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
  };

  if (!isOpen) return null;

  const getCategoryTypeColor = (type) => {
    const colors = {
      'Cotton Yarn': 'bg-green-100 text-green-800',
      'Polyester': 'bg-blue-100 text-blue-800',
      'Blended Yarn': 'bg-purple-100 text-purple-800',
      'Raw Material': 'bg-orange-100 text-orange-800',
      'Finished Goods': 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Category Management" 
      size="xl"
    >
      {showForm ? (
        <CategoryForm
          category={editingCategory}
          onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
          onCancel={handleFormCancel}
          loading={formLoading}
        />
      ) : (
        <div className="space-y-4">
          {/* Header Actions */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Manage product categories and their specifications
            </div>
            
            {/* Add Category Button */}
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              + Add Category
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
                      <span className={`text-xs px-2 py-1 rounded ${getCategoryTypeColor(category.categoryType)}`}>
                        {category.categoryType}
                      </span>
                    </div>

                    {/* Category Code */}
                    <div className="text-xs text-gray-500 mb-2">
                      Code: {category.categoryCode}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {category.description || 'No description available'}
                    </p>

                    {/* Specifications */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Unit:</span>
                        <span className="font-medium">{category.specifications?.unit}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Standard Weight:</span>
                        <span className="font-medium">{category.specifications?.standardWeight} kg</span>
                      </div>
                      {category.specifications?.blendRatio && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Blend Ratio:</span>
                          <span className="font-medium">{category.specifications.blendRatio}</span>
                        </div>
                      )}
                    </div>

                    {/* Yarn Counts */}
                    {category.specifications?.yarnCount && category.specifications.yarnCount.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Yarn Counts:</p>
                        <div className="flex flex-wrap gap-1">
                          {category.specifications.yarnCount.slice(0, 3).map((count, index) => (
                            <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {count}
                            </span>
                          ))}
                          {category.specifications.yarnCount.length > 3 && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              +{category.specifications.yarnCount.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Colors */}
                    {category.specifications?.color && category.specifications.color.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Colors:</p>
                        <div className="flex flex-wrap gap-1">
                          {category.specifications.color.slice(0, 3).map((color, index) => (
                            <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {color}
                            </span>
                          ))}
                          {category.specifications.color.length > 3 && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              +{category.specifications.color.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Quality Types */}
                    {category.specifications?.quality && category.specifications.quality.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-1">Quality:</p>
                        <div className="flex flex-wrap gap-1">
                          {category.specifications.quality.slice(0, 3).map((quality, index) => (
                            <span key={index} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              {quality}
                            </span>
                          ))}
                          {category.specifications.quality.length > 3 && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              +{category.specifications.quality.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Status */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-xs px-2 py-1 rounded ${
                        category.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {category.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        Sort: {category.sortOrder}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="text-orange-600 hover:text-orange-900 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category._id, category.categoryName)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
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
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                  >
                    Create First Category
                  </button>
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
      )}
    </Modal>
  );
};

export default CategoryManagement;
