import { useState } from 'react';
import { FolderOpen } from 'lucide-react';
import { categoryAPI, handleAPIError } from '../services/masterDataAPI';
import CategoryForm from '../components/masterdata/Categories/CategoryForm';
import CategoryList from '../components/masterdata/Categories/CategoryList';
import Modal from '../components/model/Modal';
import useToast from '../hooks/useToast';

const CategoriesPage = () => {
  const { categoryToasts } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Handle create category
  const handleCreateCategory = async (categoryData) => {
    try {
      setFormLoading(true);
      const response = await categoryAPI.create(categoryData);
      
      if (response.success) {
        setShowForm(false);
        setRefreshTrigger(prev => prev + 1); // Trigger list refresh
        categoryToasts.createSuccess(categoryData.categoryName);
      }
    } catch (err) {
      console.error('Failed to create category:', err);
      categoryToasts.createError();
    } finally {
      setFormLoading(false);
    }
  };

  // Handle update category
  const handleUpdateCategory = async (categoryData) => {
    try {
      setFormLoading(true);
      const response = await categoryAPI.update(editingCategory._id, categoryData);
      
      if (response.success) {
        setShowForm(false);
        setEditingCategory(null);
        setRefreshTrigger(prev => prev + 1); // Trigger list refresh
        categoryToasts.updateSuccess(categoryData.categoryName);
      }
    } catch (err) {
      console.error('Failed to update category:', err);
      categoryToasts.updateError();
    } finally {
      setFormLoading(false);
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

  // Handle refresh
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Category Management</h1>
            <p className="text-gray-600">Manage product categories, classifications, and specifications</p>
          </div>
          <div className="flex items-center space-x-2">
            <FolderOpen className="text-orange-600 w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Content - Always Show List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* List Header */}
        <div className="flex justify-between items-center mb-6">
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

        {/* Category List - Always Visible */}
        <CategoryList 
          onEdit={handleEditCategory}
          onRefresh={handleRefresh}
          refreshTrigger={refreshTrigger}
        />
      </div>

      {/* Category Form Modal */}
      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={handleFormCancel}
          title={editingCategory ? 'Edit Category' : 'Add New Category'}
          size="5xl"
        >
          <CategoryForm
            category={editingCategory}
            onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
            onCancel={handleFormCancel}
            loading={formLoading}
          />
        </Modal>
      )}
    </div>
  );
};

export default CategoriesPage;
