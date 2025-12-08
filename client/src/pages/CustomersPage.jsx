import { useState } from 'react';
import { Users, Plus } from 'lucide-react';
import { customerAPI, handleAPIError } from '../services/masterDataAPI';
import CustomerForm from '../components/masterdata/Customers/CustomerForm';
import CustomerList from '../components/masterdata/Customers/CustomerList';
import Modal from '../components/model/Modal';
import useToast from '../hooks/useToast';

const CustomersPage = () => {
  const { customerToasts } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Handle create customer
  const handleCreateCustomer = async (customerData) => {
    try {
      setFormLoading(true);
      const response = await customerAPI.create(customerData);
      
      if (response.success) {
        setShowForm(false);
        setRefreshTrigger(prev => prev + 1); // Trigger list refresh
        customerToasts.createSuccess(customerData.companyName);
      }
    } catch (err) {
      console.error('Failed to create customer:', err);
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
        setRefreshTrigger(prev => prev + 1); // Trigger list refresh
        customerToasts.updateSuccess(customerData.companyName);
      }
    } catch (err) {
      console.error('Failed to update customer:', err);
      customerToasts.updateError();
    } finally {
      setFormLoading(false);
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Customer Management</h1>
            <p className="text-gray-600">Manage customer information, contacts, and relationships</p>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="text-blue-600 w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Content - Always Show List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* List Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-600">
            Manage customer information and relationships
          </div>
          
          {/* Add Customer Button */}
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-md hover:shadow-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Customer
          </button>
        </div>

        {/* Customer List - Always Visible */}
        <CustomerList 
          onEdit={handleEditCustomer}
          onRefresh={handleRefresh}
          refreshTrigger={refreshTrigger}
        />
      </div>

      {/* Customer Form Modal */}
      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={handleFormCancel}
          title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
          size="3xl"
        >
          <CustomerForm
            customer={editingCustomer}
            onSubmit={editingCustomer ? handleUpdateCustomer : handleCreateCustomer}
            onCancel={handleFormCancel}
            loading={formLoading}
          />
        </Modal>
      )}
    </div>
  );
};

export default CustomersPage;
