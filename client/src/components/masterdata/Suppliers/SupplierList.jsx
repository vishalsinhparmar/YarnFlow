import { useState, useEffect } from 'react';
import { supplierAPI, formatters, handleAPIError } from '../../../services/masterDataAPI';

const SupplierList = ({ onEdit, onRefresh, refreshTrigger }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  // Fetch suppliers
  const fetchSuppliers = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = {
        page: 1,
        limit: 10,
        ...params
      };
      
      if (searchTerm) queryParams.search = searchTerm;
      if (typeFilter) queryParams.type = typeFilter;
      
      const response = await supplierAPI.getAll(queryParams);
      
      if (response.success) {
        setSuppliers(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(handleAPIError(err, 'Failed to fetch suppliers'));
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts or refresh is triggered
  useEffect(() => {
    fetchSuppliers();
  }, [searchTerm, typeFilter, refreshTrigger]);

  // Handle delete supplier
  const handleDeleteSupplier = async (supplierId, supplierName) => {
    if (window.confirm(`Are you sure you want to delete supplier "${supplierName}"?`)) {
      try {
        const response = await supplierAPI.delete(supplierId);
        if (response.success) {
          fetchSuppliers(); // Refresh list
          onRefresh?.(); // Notify parent
        }
      } catch (err) {
        setError(handleAPIError(err, 'Failed to delete supplier'));
      }
    }
  };


  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        {/* Type Filter */}
        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Types</option>
            <option value="Yarn Supplier">Yarn Supplier</option>
            <option value="Raw Material">Raw Material</option>
            <option value="Equipment">Equipment</option>
            <option value="Service Provider">Service Provider</option>
          </select>
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading suppliers...</p>
        </div>
      )}

      {/* Suppliers Table */}
      {!loading && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company Name
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
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suppliers.length > 0 ? (
                suppliers.map((supplier) => (
                  <tr key={supplier._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {supplier.companyName}
                        </div>
                        <div className="text-sm text-gray-500">
                          Code: {supplier.supplierCode}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {supplier.gstNumber || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {supplier.panNumber || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {supplier.city || supplier.address?.city || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        supplier.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : supplier.status === 'Inactive'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {supplier.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => onEdit(supplier)}
                        className="text-purple-600 hover:text-purple-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(supplier._id, supplier.companyName)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No suppliers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {!loading && suppliers.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total Suppliers:</span>
              <span className="font-medium ml-2">{pagination.total}</span>
            </div>
            <div>
              <span className="text-gray-500">Yarn Suppliers:</span>
              <span className="font-medium text-blue-600 ml-2">
                {suppliers.filter(s => s.supplierType === 'Yarn Supplier').length}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Raw Material:</span>
              <span className="font-medium text-green-600 ml-2">
                {suppliers.filter(s => s.supplierType === 'Raw Material').length}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Service Providers:</span>
              <span className="font-medium text-orange-600 ml-2">
                {suppliers.filter(s => s.supplierType === 'Service Provider').length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierList;
