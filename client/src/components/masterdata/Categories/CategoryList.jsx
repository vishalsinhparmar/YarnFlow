import { useState, useEffect } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { categoryAPI, handleAPIError } from '../../../services/masterDataAPI';
import Pagination from '../../common/Pagination';
import SimpleDeleteModal from '../../common/SimpleDeleteModal';
import useToast from '../../../hooks/useToast';

const CategoryList = ({ onEdit, onRefresh, refreshTrigger }) => {
  const { categoryToasts } = useToast();
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
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, category: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

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
  const handleDeleteClick = (category) => {
    setDeleteModal({ isOpen: true, category });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.category) return;
    
    try {
      setDeleteLoading(true);
      const response = await categoryAPI.delete(deleteModal.category._id);
      if (response.success) {
        categoryToasts.deleteSuccess(deleteModal.category.categoryName);
        setDeleteModal({ isOpen: false, category: null });
        fetchCategories();
        onRefresh?.();
      }
    } catch (err) {
      categoryToasts.deleteError();
      setError(handleAPIError(err, 'Failed to delete category'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, category: null });
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
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-orange-700 bg-orange-50 rounded-lg hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                    title="Edit category"
                  >
                    <Edit2 className="w-4 h-4 mr-1.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(category)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                    title="Delete category"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
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

      {/* Delete Confirmation Modal */}
      <SimpleDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemName={deleteModal.category?.categoryName}
        loading={deleteLoading}
      />
    </div>
  );
};

export default CategoryList;
