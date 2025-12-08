import { useState, useEffect } from 'react';
import { Loader2, Box, FolderOpen, FileText, Plus } from 'lucide-react';
import CategoryForm from '../Categories/CategoryForm';

const ProductForm = ({ product, categories, suppliers, onSubmit, onCancel, loading, onCategoryCreate }) => {
  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    category: ''
  });

  const [errors, setErrors] = useState({});
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Populate form if editing existing product
  useEffect(() => {
    if (product) {
      setFormData({
        productName: product.productName || '',
        description: product.description || '',
        category: product.category?._id || product.category || ''
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.productName.trim()) {
      newErrors.productName = 'Product name is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  // Handle category creation
  const handleCategoryCreate = async (categoryData) => {
    setCategoryLoading(true);
    try {
      const newCategory = await onCategoryCreate(categoryData);
      if (newCategory) {
        // Set the newly created category as selected
        setFormData(prev => ({
          ...prev,
          category: newCategory._id
        }));
        setShowCategoryForm(false);
      }
    } catch (error) {
      console.error('Error creating category:', error);
    } finally {
      setCategoryLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Box className="w-4 h-4 text-green-600" />
            Product Name *
          </label>
          <input
            type="text"
            name="productName"
            value={formData.productName}
            onChange={handleChange}
            className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
              errors.productName ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Enter product name"
          />
          {errors.productName && (
            <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.productName}
            </p>
          )}
        </div>

        {/* Category with Add+ Button */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-green-600" />
            Category *
          </label>
          <div className="flex gap-2">
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`flex-1 px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                errors.category ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">Select Category</option>
              {categories && categories.length > 0 ? (
                categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.categoryName}
                  </option>
                ))
              ) : (
                <option value="" disabled>No categories available</option>
              )}
            </select>
            <button
              type="button"
              onClick={() => setShowCategoryForm(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 flex items-center gap-2 font-medium transition-all"
              title="Add new category"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
          {errors.category && (
            <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.category}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-green-600" />
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
            placeholder="Enter product description"
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 min-w-[160px] justify-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{product ? 'Update Product' : 'Create Product'}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New Category</h3>
                <button
                  onClick={() => setShowCategoryForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <CategoryForm
                onSubmit={handleCategoryCreate}
                onCancel={() => setShowCategoryForm(false)}
                loading={categoryLoading}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductForm;
