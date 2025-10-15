import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Modal from '../../model/Modal';
import CustomerForm from './CustomerForm';
import { customerAPI, formatters, handleAPIError } from '../../../services/masterDataAPI';
import useToast from '../../../hooks/useToast';

const CustomerManagement = ({ isOpen, onClose }) => {
  const { customerToasts } = useToast();
  
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  // Fetch customers
  const fetchCustomers = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = {
        page: 1,
        limit: 10,
        ...params
      };
      
      if (searchTerm) queryParams.search = searchTerm;
      
      const response = await customerAPI.getAll(queryParams);
      
      if (response.success) {
        setCustomers(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(handleAPIError(err, 'Failed to fetch customers'));
      customerToasts.loadError();
    } finally {
      setLoading(false);
    }
  };

  // Load customers when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen, searchTerm]);

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };


  // Handle create customer
  const handleCreateCustomer = async (customerData) => {
    try {
      setFormLoading(true);
      const response = await customerAPI.create(customerData);
      
      if (response.success) {
        setShowForm(false);
        setEditingCustomer(null);
        fetchCustomers(); // Refresh list
        customerToasts.created();
      }
    } catch (err) {
      customerToasts.createError();
    } finally {
      setFormLoading(false);
    }
  };

  // Handle update customer
  const handleUpdateCustomer = async (customerData) => {
    try {
      setFormLoading(true);
      const response = await customerAPI.update(editingCustomer._id, customerData);
      
      if (response.success) {
        setShowForm(false);
        setEditingCustomer(null);
        fetchCustomers(); // Refresh list
        customerToasts.updated();
      }
    } catch (err) {
      customerToasts.updateError();
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete customer
  const handleDeleteCustomer = async (customerId, customerName) => {
    if (window.confirm(`Are you sure you want to delete ${customerName}?`)) {
      try {
        setLoading(true);
        const response = await customerAPI.delete(customerId);
        
        if (response.success) {
          fetchCustomers(); // Refresh list
          customerToasts.deleted(customerName);
        }
      } catch (err) {
        customerToasts.deleteError();
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle edit customer
  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCustomer(null);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    fetchCustomers({ page });
  };

  if (!isOpen) return null;

  return (
    <>
      <Toaster />
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="Customer Management" 
        size="xl"
      >
      {showForm ? (
        <CustomerForm
          customer={editingCustomer}
          onSubmit={editingCustomer ? handleUpdateCustomer : handleCreateCustomer}
          onCancel={handleFormCancel}
          loading={formLoading}
        />
      ) : (
        <div className="space-y-4">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
            </div>
            
            {/* Add Customer Button */}
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              + Add Customer
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
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.length > 0 ? (
                    customers.map((customer) => (
                      <tr key={customer._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {customer.companyName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {customer.customerCode}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">
                              {customer.contactPerson}
                            </div>
                            <div className="text-sm text-gray-500">
                              {customer.email}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatters.phone(customer.phone)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {customer.address?.city}, {customer.address?.state}
                          </div>
                          <div className="text-sm text-gray-500">
                            {customer.address?.pincode}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEditCustomer(customer)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(customer._id, customer.companyName)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                        No customers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {customers.length} of {pagination.total} customers
              </div>
              <div className="flex space-x-2">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded ${
                      page === pagination.current
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      </Modal>
    </>
  );
};

export default CustomerManagement;
