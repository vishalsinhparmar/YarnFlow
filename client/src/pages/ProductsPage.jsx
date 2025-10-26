import { useState, useEffect } from 'react';
import { productAPI, categoryAPI, supplierAPI, handleAPIError } from '../services/masterDataAPI';
import ProductForm from '../components/masterdata/Products/ProductForm';
import ProductList from '../components/masterdata/Products/ProductList';
import Modal from '../components/model/Modal';
import useToast from '../hooks/useToast';

const ProductsPage = () => {
  const { productToasts } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Fetch categories and suppliers on component mount
  useEffect(() => {
    const fetchCategoriesAndSuppliers = async () => {
      try {
        const [categoriesRes, suppliersRes] = await Promise.all([
          categoryAPI.getAll(),
          supplierAPI.getAll()
        ]);
        
        if (categoriesRes.success) {
          setCategories(categoriesRes.data);
        }
        if (suppliersRes.success) {
          setSuppliers(suppliersRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch categories/suppliers:', err);
      }
    };

    fetchCategoriesAndSuppliers();
  }, []);

  // Handle create product
  const handleCreateProduct = async (productData) => {
    try {
      setFormLoading(true);
      const response = await productAPI.create(productData);
      
      if (response.success) {
        setShowForm(false);
        setRefreshTrigger(prev => prev + 1); // Trigger list refresh
        productToasts.createSuccess(productData.productName);
      }
    } catch (err) {
      console.error('Failed to create product:', err);
      productToasts.createError();
    } finally {
      setFormLoading(false);
    }
  };

  // Handle update product
  const handleUpdateProduct = async (productData) => {
    try {
      setFormLoading(true);
      const response = await productAPI.update(editingProduct._id, productData);
      
      if (response.success) {
        setShowForm(false);
        setEditingProduct(null);
        setRefreshTrigger(prev => prev + 1); // Trigger list refresh
        productToasts.updateSuccess(productData.productName);
      }
    } catch (err) {
      console.error('Failed to update product:', err);
      productToasts.updateError();
    } finally {
      setFormLoading(false);
    }
  };

  // Handle edit product
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Handle create category
  const handleCreateCategory = async (categoryData) => {
    try {
      const response = await categoryAPI.create(categoryData);
      
      if (response.success) {
        // Refresh categories list
        const categoriesRes = await categoryAPI.getAll();
        if (categoriesRes.success) {
          setCategories(categoriesRes.data);
        }
        
        // Return the new category for auto-selection
        return response.data;
      }
    } catch (err) {
      console.error('Failed to create category:', err);
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Management</h1>
            <p className="text-gray-600">Manage product catalog, specifications, and inventory tracking</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-600 text-2xl">🧶</span>
          </div>
        </div>
      </div>

      {/* Content - Always Show List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* List Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-600">
            Manage product catalog and inventory
          </div>
          
          {/* Add Product Button */}
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            + Add Product
          </button>
        </div>

        {/* Product List - Always Visible */}
        <ProductList 
          onEdit={handleEditProduct}
          onRefresh={handleRefresh}
          refreshTrigger={refreshTrigger}
        />
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={handleFormCancel}
          title={editingProduct ? 'Edit Product' : 'Add New Product'}
          size="6xl"
        >
          <ProductForm
            product={editingProduct}
            categories={categories}
            suppliers={suppliers}
            onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
            onCancel={handleFormCancel}
            loading={formLoading}
            onCategoryCreate={handleCreateCategory}
          />
        </Modal>
      )}
    </div>
  );
};

export default ProductsPage;
