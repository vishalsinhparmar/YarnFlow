import { useState, useEffect } from 'react';
import { customerAPI, formatters, handleAPIError } from '../../../services/masterDataAPI';

const CustomerList = ({ onEdit, onRefresh, refreshTrigger }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts or refresh is triggered
  useEffect(() => {
    fetchCustomers();
  }, [searchTerm, refreshTrigger]);

  // Handle delete customer
  const handleDeleteCustomer = async (customerId, customerName) => {
    if (window.confirm(`Are you sure you want to delete customer "${customerName}"?`)) {
      try {
        const response = await customerAPI.delete(customerId);
        if (response.success) {
          fetchCustomers(); // Refresh list
          onRefresh?.(); // Notify parent
        }
      } catch (err) {
        setError(handleAPIError(err, 'Failed to delete customer'));
      }
    }
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
                customers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {customer.companyName}
                        </div>
                        <div className="text-sm text-gray-500">
                          Code: {customer.customerCode}
                        </div>
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
                      <button
                        onClick={() => onEdit(customer)}
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
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {!loading && customers.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Total Customers: <span className="font-medium">{pagination.total}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
