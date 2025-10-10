import { useState, useEffect } from 'react';

const CategoryForm = ({ category, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    categoryName: '',
    description: '',
    categoryType: 'Cotton Yarn',
    specifications: {
      unit: 'Bags',
      standardWeight: 100,
      yarnCount: [],
      blendRatio: '',
      color: [],
      quality: []
    },
    status: 'Active',
    sortOrder: 0
  });

  const [errors, setErrors] = useState({});
  const [yarnCountInput, setYarnCountInput] = useState('');
  const [colorInput, setColorInput] = useState('');
  const [qualityInput, setQualityInput] = useState('');

  // Populate form if editing existing category
  useEffect(() => {
    if (category) {
      setFormData({
        categoryName: category.categoryName || '',
        description: category.description || '',
        categoryType: category.categoryType || 'Cotton Yarn',
        specifications: {
          unit: category.specifications?.unit || 'Bags',
          standardWeight: category.specifications?.standardWeight || 100,
          yarnCount: category.specifications?.yarnCount || [],
          blendRatio: category.specifications?.blendRatio || '',
          color: category.specifications?.color || [],
          quality: category.specifications?.quality || []
        },
        status: category.status || 'Active',
        sortOrder: category.sortOrder || 0
      });
    }
  }, [category]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('specifications.')) {
      const specField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [specField]: specField === 'standardWeight' || specField === 'sortOrder' ? Number(value) : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'sortOrder' ? Number(value) : value
      }));
    }
    
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

    if (!formData.categoryType) {
      newErrors.categoryType = 'Category type is required';
    }

    if (!formData.specifications.unit) {
      newErrors['specifications.unit'] = 'Unit is required';
    }

    if (formData.specifications.standardWeight <= 0) {
      newErrors['specifications.standardWeight'] = 'Standard weight must be greater than 0';
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

  // Handle array inputs
  const addYarnCount = () => {
    if (yarnCountInput.trim() && !formData.specifications.yarnCount.includes(yarnCountInput.trim())) {
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          yarnCount: [...prev.specifications.yarnCount, yarnCountInput.trim()]
        }
      }));
      setYarnCountInput('');
    }
  };

  const removeYarnCount = (index) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        yarnCount: prev.specifications.yarnCount.filter((_, i) => i !== index)
      }
    }));
  };

  const addColor = () => {
    if (colorInput.trim() && !formData.specifications.color.includes(colorInput.trim())) {
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          color: [...prev.specifications.color, colorInput.trim()]
        }
      }));
      setColorInput('');
    }
  };

  const removeColor = (index) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        color: prev.specifications.color.filter((_, i) => i !== index)
      }
    }));
  };

  const addQuality = () => {
    if (qualityInput.trim() && !formData.specifications.quality.includes(qualityInput.trim())) {
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          quality: [...prev.specifications.quality, qualityInput.trim()]
        }
      }));
      setQualityInput('');
    }
  };

  const removeQuality = (index) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        quality: prev.specifications.quality.filter((_, i) => i !== index)
      }
    }));
  };

  const categoryTypes = [
    'Cotton Yarn', 'Polyester', 'Blended Yarn', 'Raw Material', 'Finished Goods'
  ];

  const units = [
    'Bags', 'Rolls', 'Kg', 'Meters', 'Pieces'
  ];

  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category Name *
          </label>
          <input
            type="text"
            name="categoryName"
            value={formData.categoryName}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              errors.categoryName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter category name"
          />
          {errors.categoryName && (
            <p className="text-red-500 text-xs mt-1">{errors.categoryName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category Type *
          </label>
          <select
            name="categoryType"
            value={formData.categoryType}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              errors.categoryType ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            {categoryTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {errors.categoryType && (
            <p className="text-red-500 text-xs mt-1">{errors.categoryType}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Enter category description"
        />
      </div>

      {/* Specifications */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-900">Specifications</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit *
            </label>
            <select
              name="specifications.unit"
              value={formData.specifications.unit}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                errors['specifications.unit'] ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {units.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
            {errors['specifications.unit'] && (
              <p className="text-red-500 text-xs mt-1">{errors['specifications.unit']}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Standard Weight (kg) *
            </label>
            <input
              type="number"
              name="specifications.standardWeight"
              value={formData.specifications.standardWeight}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                errors['specifications.standardWeight'] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="100"
              min="0"
              step="0.1"
            />
            {errors['specifications.standardWeight'] && (
              <p className="text-red-500 text-xs mt-1">{errors['specifications.standardWeight']}</p>
            )}
          </div>
        </div>

        {/* Blend Ratio (for blended yarns) */}
        {formData.categoryType === 'Blended Yarn' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Blend Ratio
            </label>
            <input
              type="text"
              name="specifications.blendRatio"
              value={formData.specifications.blendRatio}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="60/40, 50/50, etc."
            />
          </div>
        )}

        {/* Yarn Counts */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Yarn Counts
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={yarnCountInput}
              onChange={(e) => setYarnCountInput(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g., 20s, 30s, 40s"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addYarnCount())}
            />
            <button
              type="button"
              onClick={addYarnCount}
              className="px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.specifications.yarnCount.map((count, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded"
              >
                {count}
                <button
                  type="button"
                  onClick={() => removeYarnCount(index)}
                  className="ml-1 text-orange-600 hover:text-orange-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Available Colors
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={colorInput}
              onChange={(e) => setColorInput(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g., Natural, White, Dyed"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
            />
            <button
              type="button"
              onClick={addColor}
              className="px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.specifications.color.map((color, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
              >
                {color}
                <button
                  type="button"
                  onClick={() => removeColor(index)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Quality Types */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quality Types
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={qualityInput}
              onChange={(e) => setQualityInput(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g., Premium, Standard, Economy"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addQuality())}
            />
            <button
              type="button"
              onClick={addQuality}
              className="px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.specifications.quality.map((quality, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded"
              >
                {quality}
                <button
                  type="button"
                  onClick={() => removeQuality(index)}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Status and Sort Order */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sort Order
          </label>
          <input
            type="number"
            name="sortOrder"
            value={formData.sortOrder}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="0"
            min="0"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
        </button>
      </div>
    </form>
  );
};

export default CategoryForm;
