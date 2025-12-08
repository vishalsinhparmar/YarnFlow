import { useState, useEffect } from 'react';
import { Loader2, FolderOpen, FileText } from 'lucide-react';

const CategoryForm = ({ category, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    categoryName: '',
    description: ''
  });

  const [errors, setErrors] = useState({});

  // Populate form if editing existing category
  useEffect(() => {
    if (category) {
      setFormData({
        categoryName: category.categoryName || '',
        description: category.description || ''
      });
    }
  }, [category]);

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

    if (!formData.categoryName.trim()) {
      newErrors.categoryName = 'Category name is required';
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Category Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-orange-600" />
          Category Name *
        </label>
        <input
          type="text"
          name="categoryName"
          value={formData.categoryName}
          onChange={handleChange}
          className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
            errors.categoryName ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          placeholder="Enter category name"
          required
        />
        {errors.categoryName && (
          <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.categoryName}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4 text-orange-600" />
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="4"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
          placeholder="Enter category description (optional)"
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-8 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 min-w-[160px] justify-center"
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
              <span>{category ? 'Update Category' : 'Create Category'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default CategoryForm;
