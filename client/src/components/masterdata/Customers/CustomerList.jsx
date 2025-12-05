import { useState, useEffect } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { customerAPI, handleAPIError } from '../../../services/masterDataAPI';
import Pagination from '../../common/Pagination';
import SimpleDeleteModal from '../../common/SimpleDeleteModal';
import useToast from '../../../hooks/useToast';

const CustomerList = ({ onEdit, onRefresh, refreshTrigger }) => {
  const { customerToasts } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50); // Default 50 items per page
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, customer: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch customers
  const fetchCustomers = async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = {
        page,
        limit: itemsPerPage
      };
      
      if (searchTerm) queryParams.search = searchTerm;
      
      const response = await customerAPI.getAll(queryParams);
      
      if (response.success) {
        setCustomers(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(handleAPIError(err, 'Failed to fetch customers'));
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchCustomers(newPage);
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
    fetchCustomers(1);
  }, [searchTerm]);

  // Refresh when trigger changes
  useEffect(() => {
    fetchCustomers(currentPage);
  }, [refreshTrigger]);

  // Handle delete customer
  const handleDeleteClick = (customer) => {
    setDeleteModal({ isOpen: true, customer });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.customer) return;
    
    try {
      setDeleteLoading(true);
      const response = await customerAPI.delete(deleteModal.customer._id);
      if (response.success) {
        customerToasts.deleteSuccess(deleteModal.customer.companyName);
        setDeleteModal({ isOpen: false, customer: null });
        fetchCustomers(); // Refresh list
        onRefresh?.(); // Notify parent
      }
    } catch (err) {
      customerToasts.deleteError();
      setError(handleAPIError(err, 'Failed to delete customer'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, customer: null });
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex justify-between items-center">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading customers...</p>
        </div>
      )}

      {/* Customers Table */}
      {!loading && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sr. No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GST Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PAN Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  City
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.length > 0 ? (
                customers.map((customer, index) => (
                  <tr key={customer._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {(pagination.current - 1) * itemsPerPage + index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {customer.companyName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {customer.gstNumber || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {customer.panNumber || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {customer.address?.city || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => onEdit(customer)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                          title="Edit customer"
                        >
                          <Edit2 className="w-4 h-4 mr-1.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(customer)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                          title="Delete customer"
                        >
                          <Trash2 className="w-4 h-4 mr-1.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && customers.length > 0 && (
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
        itemName={deleteModal.customer?.companyName}
        loading={deleteLoading}
      />
    </div>
  );
};

export default CustomerList;
