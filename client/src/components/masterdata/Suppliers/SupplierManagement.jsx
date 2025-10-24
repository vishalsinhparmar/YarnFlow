import { useState, useEffect } from 'react';
import Modal from '../../model/Modal';
import SupplierForm from './SupplierForm';
import { supplierAPI, formatters, handleAPIError } from '../../../services/masterDataAPI';

const SupplierManagement = ({ isOpen, onClose }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  // Removed type and verification filters
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
      // No additional filters
      
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

  // Load suppliers when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSuppliers();
    }
  }, [isOpen, searchTerm]);

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filters removed

  // Handle create supplier
  const handleCreateSupplier = async (supplierData) => {
    try {
      setFormLoading(true);
      const response = await supplierAPI.create(supplierData);
      
      if (response.success) {
        setShowForm(false);
        setEditingSupplier(null);
        fetchSuppliers(); // Refresh list
        alert('Supplier created successfully!');
      }
    } catch (err) {
      alert(handleAPIError(err, 'Failed to create supplier'));
    } finally {
      setFormLoading(false);
    }
  };

  // Handle update supplier
  const handleUpdateSupplier = async (supplierData) => {
    try {
      setFormLoading(true);
      const response = await supplierAPI.update(editingSupplier._id, supplierData);
      
      if (response.success) {
        setShowForm(false);
        setEditingSupplier(null);
        fetchSuppliers(); // Refresh list
        alert('Supplier updated successfully!');
      }
    } catch (err) {
      alert(handleAPIError(err, 'Failed to update supplier'));
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete supplier
  const handleDeleteSupplier = async (supplierId, supplierName) => {
    if (window.confirm(`Are you sure you want to delete ${supplierName}?`)) {
      try {
        setLoading(true);
        const response = await supplierAPI.delete(supplierId);
        
        if (response.success) {
          fetchSuppliers(); // Refresh list
          alert('Supplier deleted successfully!');
        }
      } catch (err) {
        alert(handleAPIError(err, 'Failed to delete supplier'));
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle edit supplier
  const handleEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setShowForm(true);
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingSupplier(null);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    fetchSuppliers({ page });
  };

  if (!isOpen) return null;

  // Removed supplier types and verification statuses

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Supplier Management" 
      size="xl"
    >
      {showForm ? (
        <SupplierForm
          supplier={editingSupplier}
          onSubmit={editingSupplier ? handleUpdateSupplier : handleCreateSupplier}
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
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
            </div>
            
            {/* Add Supplier Button */}
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              + Add Supplier
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
                  {suppliers.length > 0 ? (
                    suppliers.map((supplier) => (
                      <tr key={supplier._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {supplier.companyName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {supplier.supplierCode}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">
                              {supplier.contactPerson}
                            </div>
                            <div className="text-sm text-gray-500">
                              {supplier.email}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatters.phone(supplier.phone)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {supplier.address?.city}, {supplier.address?.state}
                          </div>
                          <div className="text-sm text-gray-500">
                            {supplier.address?.pincode}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEditSupplier(supplier)}
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
                      <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                        No suppliers found
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
                Showing {suppliers.length} of {pagination.total} suppliers
              </div>
              <div className="flex space-x-2">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded ${
                      page === pagination.current
                        ? 'bg-purple-600 text-white'
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
  );
};

export default SupplierManagement;
