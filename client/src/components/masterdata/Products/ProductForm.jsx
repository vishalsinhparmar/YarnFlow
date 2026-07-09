import { useState, useEffect, useRef } from 'react';
import { Loader2, Box, FolderOpen, FileText, Plus, X, Layers, Pencil, Check } from 'lucide-react';
import CategoryForm from '../Categories/CategoryForm';
import { subProductAPI } from '../../../services/masterDataAPI';

const ProductForm = ({ product, categories, onSubmit, onCancel, loading, onCategoryCreate }) => {
  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    category: ''
  });
  const [errors, setErrors] = useState({});
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Sub-product state (API-backed when editing, local when creating)
  const [subProducts, setSubProducts] = useState([]); // [{_id?, name}]
  const [subInput, setSubInput] = useState('');
  const [subLoading, setSubLoading] = useState(false);
  const [editingSpId, setEditingSpId] = useState(null);
  const [editingSpName, setEditingSpName] = useState('');
  const subInputRef = useRef(null);

  const selectedCategory = categories?.find(c => c._id === formData.category) || null;
  const categoryHasSubProducts = selectedCategory?.hasSubProducts || false;
  const isEditing = !!product;

  useEffect(() => {
    if (product) {
      setFormData({
        productName: product.productName || '',
        description: product.description || '',
        category: product.category?._id || product.category || ''
      });
      // Populate existing sub-products from populated virtual
      const existing = (product.subProducts || []).map(sp =>
        typeof sp === 'object' ? { _id: sp._id, name: sp.name } : { name: sp }
      );
      setSubProducts(existing);
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // Parse comma/space-separated input into individual names
  const parseNames = (raw) =>
    raw.split(/[,\s]+/).map(s => s.trim()).filter(Boolean);

  const addSubProducts = (raw) => {
    const names = parseNames(raw);
    if (!names.length) return;
    const existing = new Set(subProducts.map(sp => sp.name));
    const toAdd = names.filter(n => !existing.has(n)).map(n => ({ name: n }));
    setSubProducts(prev => [...prev, ...toAdd]);
    setSubInput('');
  };

  const handleSubInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSubProducts(subInput);
    }
    if (e.key === 'Backspace' && subInput === '' && subProducts.length > 0) {
      const last = subProducts[subProducts.length - 1];
      if (!last._id) {
        setSubProducts(prev => prev.slice(0, -1));
      }
    }
  };

  const removeSubProduct = async (sp) => {
    if (sp._id && isEditing) {
      setSubLoading(true);
      try {
        await subProductAPI.delete(sp._id);
      } catch (e) {
        console.error('Failed to delete sub-product', e);
      } finally {
        setSubLoading(false);
      }
    }
    setSubProducts(prev => prev.filter(s => s.name !== sp.name));
  };

  const startEdit = (sp) => {
    setEditingSpId(sp._id || sp.name);
    setEditingSpName(sp.name);
  };

  const saveEdit = async (sp) => {
    const newName = editingSpName.trim();
    if (!newName) return;
    if (sp._id && isEditing) {
      setSubLoading(true);
      try {
        const res = await subProductAPI.update(sp._id, { name: newName });
        if (res.success) {
          setSubProducts(prev => prev.map(s => s._id === sp._id ? { ...s, name: newName } : s));
        }
      } catch (e) {
        console.error('Failed to update sub-product', e);
      } finally {
        setSubLoading(false);
      }
    } else {
      setSubProducts(prev => prev.map(s => (s.name === sp.name ? { ...s, name: newName } : s)));
    }
    setEditingSpId(null);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.productName.trim()) newErrors.productName = 'Product name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (subInput.trim()) addSubProducts(subInput);
    if (!validateForm()) return;

    // Pass subProduct names (new ones without _id) along — parent handles bulk save after product saved
    const newSubProductNames = subProducts.filter(sp => !sp._id).map(sp => sp.name);
    onSubmit({ ...formData, _pendingSubProducts: newSubProductNames });
  };

  const handleCategoryCreate = async (categoryData) => {
    setCategoryLoading(true);
    try {
      const newCategory = await onCategoryCreate(categoryData);
      if (newCategory) {
        setFormData(prev => ({ ...prev, category: newCategory._id }));
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
            placeholder="e.g. 600 Gaze"
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

        {/* Category */}
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
              {categories && categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.categoryName}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowCategoryForm(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500 flex items-center gap-2 font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Add
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
            rows="3"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
            placeholder="Optional description"
          />
        </div>

        {/* Sub Products — only when category.hasSubProducts is true */}
        {categoryHasSubProducts && (
          <div className="p-4 border border-green-200 bg-green-50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Layers className="w-4 h-4 text-green-600" />
                Sub Products
                <span className="text-xs font-normal text-gray-400">(sizes / variants)</span>
              </label>
              <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-medium">
                {subProducts.length} added
              </span>
            </div>

            {/* Chips */}
            {subProducts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {subProducts.map((sp, idx) => {
                  const key = sp._id || sp.name + idx;
                  const isEditingThis = editingSpId === (sp._id || sp.name);
                  return (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-green-300 text-green-800 text-sm font-semibold rounded-lg shadow-sm"
                    >
                      {isEditingThis ? (
                        <>
                          <input
                            autoFocus
                            value={editingSpName}
                            onChange={e => setEditingSpName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && saveEdit(sp)}
                            className="w-14 text-sm border-b border-green-400 bg-transparent focus:outline-none"
                          />
                          <button type="button" onClick={() => saveEdit(sp)} className="text-green-600 hover:text-green-800">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          {sp.name}
                          <button type="button" onClick={() => startEdit(sp)} className="text-gray-400 hover:text-green-600 transition-colors">
                            <Pencil className="w-3 h-3" />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => removeSubProduct(sp)}
                        disabled={subLoading}
                        className="text-green-400 hover:text-red-500 focus:outline-none transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Bulk input */}
            <div className="flex gap-2">
              <input
                ref={subInputRef}
                type="text"
                value={subInput}
                onChange={(e) => setSubInput(e.target.value)}
                onKeyDown={handleSubInputKeyDown}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                placeholder="Enter sizes e.g. 3,5,6,9,22 (comma separated)"
              />
              <button
                type="button"
                onClick={() => addSubProducts(subInput)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <Plus className="w-4 h-4" />
                Add All
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Enter multiple sizes separated by commas · Press <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">Enter</kbd> to add · Click <Pencil className="w-3 h-3 inline" /> to rename · × to remove
            </p>
          </div>
        )}

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
            disabled={loading || subLoading}
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
                <button onClick={() => setShowCategoryForm(false)} className="text-gray-400 hover:text-gray-600">
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
