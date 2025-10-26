import React from 'react';

// This component is deprecated and replaced by SuppliersPage.jsx
// It's kept here temporarily to prevent build errors
// TODO: Remove this file once confirmed it's not being used anywhere

const SupplierManagement = ({ isOpen, onClose, isFullPage = false }) => {
  // Don't render if not open and not full page
  if (!isOpen && !isFullPage) return null;

  return (
    <div className="p-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-yellow-800 font-semibold">Deprecated Component</h3>
        <p className="text-yellow-600">
          This SupplierManagement component has been replaced by SuppliersPage.jsx. 
          Please use the new Suppliers page instead.
        </p>
      </div>
    </div>
  );
};

export default SupplierManagement;
