import { useState } from 'react';
import { supplierAPI, handleAPIError } from '../services/masterDataAPI';
import SupplierForm from '../components/masterdata/Suppliers/SupplierForm';
import SupplierList from '../components/masterdata/Suppliers/SupplierList';
import Modal from '../components/model/Modal';
import useToast from '../hooks/useToast';

const SuppliersPage = () => {
  const { supplierToasts } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Handle create supplier
  const handleCreateSupplier = async (supplierData) => {
    try {
      setFormLoading(true);
      const response = await supplierAPI.create(supplierData);
      
      if (response.success) {
        setShowForm(false);
        setRefreshTrigger(prev => prev + 1); // Trigger list refresh
        supplierToasts.createSuccess(supplierData.companyName);
      }
    } catch (err) {
      console.error('Failed to create supplier:', err);
      supplierToasts.createError();
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
        setRefreshTrigger(prev => prev + 1); // Trigger list refresh
        supplierToasts.updateSuccess(supplierData.companyName);
      }
    } catch (err) {
      console.error('Failed to update supplier:', err);
      supplierToasts.updateError();
    } finally {
      setFormLoading(false);
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Supplier Management</h1>
            <p className="text-gray-600">Manage supplier information, contracts, and vendor relationships</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-purple-600 text-2xl">🏭</span>
          </div>
        </div>
      </div>

      {/* Content - Always Show List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* List Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-600">
            Manage supplier information and vendor relationships
          </div>
          
          {/* Add Supplier Button */}
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            + Add Supplier
          </button>
        </div>

        {/* Supplier List - Always Visible */}
        <SupplierList 
          onEdit={handleEditSupplier}
          onRefresh={handleRefresh}
          refreshTrigger={refreshTrigger}
        />
      </div>

      {/* Supplier Form Modal */}
      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={handleFormCancel}
          title={editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
          size="4xl"
        >
          <SupplierForm
            supplier={editingSupplier}
            onSubmit={editingSupplier ? handleUpdateSupplier : handleCreateSupplier}
            onCancel={handleFormCancel}
            loading={formLoading}
          />
        </Modal>
      )}
    </div>
  );
};

export default SuppliersPage;
