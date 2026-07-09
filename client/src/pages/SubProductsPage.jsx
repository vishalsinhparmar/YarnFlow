import { useState, useEffect, useCallback } from 'react';
import {
  Layers, Plus, Search, Edit2, Trash2, X, Check,
  ChevronDown, Loader2, AlertTriangle, FolderOpen, Boxes, RefreshCw, Tag
} from 'lucide-react';
import { categoryAPI, productAPI, subProductAPI } from '../services/masterDataAPI';
import ExcelImportButton from '../components/common/ExcelImportButton';
import useToast from '../hooks/useToast';

const SUBPRODUCT_SAMPLE_HEADERS = ['productName', 'category', 'subProductName'];
const SUBPRODUCT_SAMPLE_DATA = [
  { productName: '600 Gaze', category: 'LD Category', subProductName: '3' },
  { productName: '600 Gaze', category: 'LD Category', subProductName: '5' },
  { productName: '600 Gaze', category: 'LD Category', subProductName: '8' },
  { productName: 'Gaze 500', category: 'LD Category', subProductName: '22' },
];

// ── Add Sub Product Modal ─────────────────────────────────────────────────────
const AddSubProductModal = ({ categories, onClose, onAdded, preCategory = '', preProduct = '', preProductName = '' }) => {
  const { toastSuccess, toastError } = useToast();
  const [modalCategory, setModalCategory] = useState(preCategory);
  const [modalProducts, setModalProducts] = useState([]);
  const [modalProduct, setModalProduct] = useState(preProduct);
  const [nameInput, setNameInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);

  // Load products when category selected
  useEffect(() => {
    if (!modalCategory) { setModalProducts([]); setModalProduct(''); return; }
    setProductsLoading(true);
    productAPI.getAll({ category: modalCategory, limit: 200 })
      .then(res => {
        if (res.success) {
          setModalProducts(res.data);
          // Keep pre-selected product if it belongs to this category
          if (preProduct && res.data.find(p => p._id === preProduct)) {
            setModalProduct(preProduct);
          }
        }
      })
      .finally(() => setProductsLoading(false));
  }, [modalCategory]);

  const handleAdd = async () => {
    const name = nameInput.trim();
    if (!modalProduct || !name) return;
    setSaving(true);
    try {
      const res = await subProductAPI.bulkAdd(modalProduct, [name]);
      if (res.success) {
        toastSuccess(`✅ Sub-product "${name}" added successfully!`);
        onAdded(modalProduct);
        setNameInput('');
      }
    } catch (e) {
      console.error(e);
      toastError('❌ Failed to add sub-product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAndClose = async () => {
    const name = nameInput.trim();
    if (!modalProduct || !name) return;
    setSaving(true);
    try {
      const res = await subProductAPI.bulkAdd(modalProduct, [name]);
      if (res.success) {
        toastSuccess(`✅ Sub-product "${name}" added successfully!`);
        onAdded(modalProduct);
        onClose();
      }
    } catch (e) {
      console.error(e);
      toastError('❌ Failed to add sub-product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const selectedProductObj = modalProducts.find(p => p._id === modalProduct);
  const canAdd = modalProduct && nameInput.trim() && !saving;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <Layers className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Add Sub Product</h2>
              <p className="text-xs text-gray-400">Select product and enter a size or variant</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Step 1 — Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4 text-teal-600" />
              Step 1 — Select Category
            </label>
            <div className="relative">
              <select
                value={modalCategory}
                onChange={e => setModalCategory(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none bg-white pr-8"
              >
                <option value="">— Choose a category —</option>
                {categories.map(c => (
                  <option key={c._id} value={c._id}>{c.categoryName}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Step 2 — Product */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Boxes className="w-4 h-4 text-teal-600" />
              Step 2 — Select Product
            </label>
            <div className="relative">
              {productsLoading && (
                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500 animate-spin" />
              )}
              <select
                value={modalProduct}
                onChange={e => setModalProduct(e.target.value)}
                disabled={!modalCategory || productsLoading}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none bg-white pr-8 disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">{!modalCategory ? '— Select category first —' : '— Choose a product —'}</option>
                {modalProducts.map(p => (
                  <option key={p._id} value={p._id}>{p.productName}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {modalCategory && !productsLoading && modalProducts.length === 0 && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> No products found in this category.
              </p>
            )}
          </div>

          {/* Step 3 — Sub Product Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-teal-600" />
              Step 3 — Sub Product Name / Size
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && canAdd && handleAddAndClose()}
              disabled={!modalProduct}
              placeholder={modalProduct ? `e.g. 3, 6, 8, 14, 22 inch...` : '— Select product first —'}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
            {selectedProductObj && (
              <p className="text-xs text-gray-400 mt-1">
                Adding to: <span className="font-semibold text-teal-700">{selectedProductObj.productName}</span>
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!canAdd}
            className="px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add &amp; Add Another
          </button>
          <button
            onClick={handleAddAndClose}
            disabled={!canAdd}
            className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Add &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const SubProductsPage = () => {
  const { toastSuccess, toastError } = useToast();

  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [subProducts, setSubProducts] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalPreset, setModalPreset] = useState({ category: '', product: '' });

  const openAddModal = (withPreset = false) => {
    if (withPreset && selectedProduct && selectedProductObj) {
      const catId = selectedProductObj.category?._id || selectedProductObj.category || '';
      setModalPreset({ category: catId, product: selectedProduct });
    } else {
      setModalPreset({ category: '', product: '' });
    }
    setShowAddModal(true);
  };

  // Inline Edit state
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  // Delete confirm
  const [deletingId, setDeletingId] = useState(null);

  // ── Load Categories + ALL Products on mount ───────────────────────
  useEffect(() => {
    Promise.all([
      categoryAPI.getAll({ limit: 100 }),
      productAPI.getAll({ limit: 500 })
    ]).then(([catRes, prodRes]) => {
      if (catRes.success) setCategories(catRes.data);
      if (prodRes.success) setAllProducts(prodRes.data);
    });
  }, []);

  // ── Derived: products visible in dropdown based on category filter ─
  const filteredProducts = selectedCategory
    ? allProducts.filter(p => (p.category?._id || p.category) === selectedCategory)
    : allProducts;

  // When category changes, reset product selection if current product no longer in list
  useEffect(() => {
    if (selectedProduct && selectedCategory) {
      const still = allProducts.find(p =>
        p._id === selectedProduct && (p.category?._id || p.category) === selectedCategory
      );
      if (!still) setSelectedProduct('');
    }
  }, [selectedCategory, selectedProduct, allProducts]);

  // ── Load Sub-Products for selected product ────────────────────────
  const loadSubProducts = useCallback(async (productId) => {
    if (!productId) { setSubProducts([]); return; }
    setLoading(true);
    try {
      const res = await subProductAPI.getAll(productId);
      if (res.success) setSubProducts(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubProducts(selectedProduct);
  }, [selectedProduct, loadSubProducts]);

  // ── Filtered subProducts for search ──────────────────────────────
  const visibleSubProducts = subProducts.filter(sp =>
    !search || sp.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Helpers ───────────────────────────────────────────────────────
  const selectedProductObj = allProducts.find(p => p._id === selectedProduct);
  const selectedCategoryObj = categories.find(c => c._id === selectedCategory);

  // ── Called when modal adds a sub-product ─────────────────────────
  const handleModalAdded = (productId) => {
    // If the user added to the currently selected product, refresh the list
    if (productId === selectedProduct) {
      loadSubProducts(selectedProduct);
    }
    // Also refresh allProducts so sub-product counts stay fresh
    productAPI.getAll({ limit: 500 }).then(res => {
      if (res.success) setAllProducts(res.data);
    });
  };

  // ── Edit ──────────────────────────────────────────────────────────
  const startEdit = (sp) => { setEditingId(sp._id); setEditingName(sp.name); };

  const saveEdit = async () => {
    const name = editingName.trim();
    if (!name || !editingId) return;
    setSaving(true);
    try {
      const res = await subProductAPI.update(editingId, { name });
      if (res.success) {
        setSubProducts(prev => prev.map(sp => sp._id === editingId ? { ...sp, name } : sp));
        setEditingId(null);
        toastSuccess(`✅ Sub-product updated to "${name}"`);
      }
    } catch (e) {
      console.error(e);
      toastError('❌ Failed to update sub-product.');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => setEditingId(null);

  // ── Delete ────────────────────────────────────────────────────────
  const confirmDelete = async (id) => {
    setSaving(true);
    try {
      const res = await subProductAPI.delete(id);
      if (res.success) {
        setSubProducts(prev => prev.filter(sp => sp._id !== id));
        setDeletingId(null);
        toastSuccess('🗑️ Sub-product deleted.');
      }
    } catch (e) {
      console.error(e);
      toastError('❌ Failed to delete sub-product.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Add Modal */}
      {showAddModal && (
        <AddSubProductModal
          categories={categories}
          onClose={() => setShowAddModal(false)}
          onAdded={handleModalAdded}
          preCategory={modalPreset.category}
          preProduct={modalPreset.product}
        />
      )}

      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                <Layers className="w-6 h-6 text-teal-600" />
                Sub Product Management
              </h1>
              <p className="text-gray-500 text-sm">
                Manage size variants and sub-products. Filter by category and product to view or edit.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ExcelImportButton
                type="products"
                accentColor="teal"
                sampleHeaders={SUBPRODUCT_SAMPLE_HEADERS}
                sampleData={SUBPRODUCT_SAMPLE_DATA}
                onImportSuccess={() => loadSubProducts(selectedProduct)}
              />
              <button
                onClick={() => openAddModal(false)}
                className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <Plus className="w-4 h-4" />
                Add Sub Product
              </button>
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Filter &amp; View</p>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Category Filter */}
            <div className="flex-1 relative">
              <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none bg-white"
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c._id} value={c._id}>{c.categoryName}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Product Filter */}
            <div className="flex-1 relative">
              <Boxes className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedProduct}
                onChange={e => setSelectedProduct(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none bg-white"
              >
                <option value="">— Select a product to view its sub-products —</option>
                {filteredProducts.map(p => (
                  <option key={p._id} value={p._id}>{p.productName}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Search within sub-products */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search sub-products by name..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Refresh */}
            <button
              onClick={() => loadSubProducts(selectedProduct)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
              title="Refresh list"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Content Header */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              {selectedProductObj ? (
                <div>
                  <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-teal-600" />
                    {selectedProductObj.productName}
                    <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full font-medium">
                      {subProducts.length} sub-product{subProducts.length !== 1 ? 's' : ''}
                    </span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <FolderOpen className="w-3 h-3" />
                    {selectedCategoryObj?.categoryName || selectedProductObj?.category?.categoryName || 'No category'}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  Select a product above to view and manage its sub-products
                </p>
              )}
            </div>
            {/* Quick-add button in header when product is selected — opens modal pre-filled */}
            {selectedProduct && (
              <button
                onClick={() => openAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Sub Product
              </button>
            )}
          </div>

          {/* Sub-product Table */}
          {!selectedProduct ? (
            <div className="py-20 text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <Layers className="w-8 h-8 text-gray-200" />
              </div>
              <p className="text-gray-500 text-sm font-semibold">No product selected</p>
              <p className="text-gray-300 text-xs mt-1 mb-5">Choose a category and product from the filters above to view sub-products</p>
              <button
                onClick={() => openAddModal(false)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add a Sub Product now
              </button>
            </div>
          ) : loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-teal-500 mx-auto mb-3 animate-spin" />
              <p className="text-gray-400 text-sm">Loading sub-products...</p>
            </div>
          ) : visibleSubProducts.length === 0 ? (
            <div className="py-16 text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <Layers className="w-8 h-8 text-gray-200" />
              </div>
              <p className="text-gray-500 text-sm font-semibold">
                {search ? 'No matches found' : `No sub-products for "${selectedProductObj?.productName}"`}
              </p>
              <p className="text-gray-300 text-xs mt-1 mb-5">
                {search ? 'Try a different search term' : 'Click the button below to add the first sub-product'}
              </p>
              {!search && (
                <button
                  onClick={() => openAddModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Sub Product
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-12">#</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sub-Product / Size</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Product</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Category</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {visibleSubProducts.map((sp, idx) => (
                    <tr key={sp._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-sm text-gray-400">{idx + 1}</td>

                      {/* Name — inline editable */}
                      <td className="px-5 py-3.5">
                        {editingId === sp._id ? (
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              value={editingName}
                              onChange={e => setEditingName(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveEdit();
                                if (e.key === 'Escape') cancelEdit();
                              }}
                              className="px-3 py-1.5 border border-teal-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-32"
                            />
                            <button onClick={saveEdit} disabled={saving} className="text-teal-600 hover:text-teal-800 disabled:opacity-50">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-800 text-sm font-semibold rounded-lg border border-teal-200">
                            <Tag className="w-3 h-3 text-teal-400" />
                            {sp.name}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="text-sm text-gray-700 font-medium">{selectedProductObj?.productName}</span>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="text-sm text-gray-500">
                          {selectedCategoryObj?.categoryName || selectedProductObj?.category?.categoryName || '—'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        {deletingId === sp._id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> Delete?
                            </span>
                            <button
                              onClick={() => confirmDelete(sp._id)}
                              disabled={saving}
                              className="px-3 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 transition-colors"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEdit(sp)}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => setDeletingId(sp._id)}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer summary */}
          {selectedProduct && !loading && subProducts.length > 0 && (
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between rounded-b-lg">
              <span>
                Showing {visibleSubProducts.length} of {subProducts.length} sub-product{subProducts.length !== 1 ? 's' : ''}
                {search && <> · filtered by "<span className="font-medium text-gray-600">{search}</span>"</>}
              </span>
              <span className="flex items-center gap-1">
                <Boxes className="w-3 h-3" />
                {selectedProductObj?.productName}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SubProductsPage;
