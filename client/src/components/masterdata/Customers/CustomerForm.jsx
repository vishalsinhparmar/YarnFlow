import { useState, useEffect } from 'react';

const CustomerForm = ({ customer, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    gstNumber: '',
    panNumber: '',
    notes: '',
    address: {
      city: ''
    }
  });

  // Populate form if editing existing customer
  useEffect(() => {
    if (customer) {
      setFormData({
        companyName: customer.companyName || '',
        gstNumber: customer.gstNumber || '',
        panNumber: customer.panNumber || '',
        notes: customer.notes || '',
        address: {
          city: customer.address?.city || ''
        }
      });
    }
  }, [customer]);

  // Function to extract PAN from GST number
  const extractPANFromGST = (gstNumber) => {
    if (gstNumber && gstNumber.length >= 10) {
      // PAN is characters 3-12 (0-indexed: 2-11) in GST number
      return gstNumber.substring(2, 12).toUpperCase();
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else if (name === 'gstNumber') {
      // Auto-fill PAN when GST is entered
      const panFromGST = extractPANFromGST(value);
      setFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase(),
        panNumber: panFromGST
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Company Name *
        </label>
        <input
          type="text"
          name="companyName"
          value={formData.companyName}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter company name"
          required
        />
      </div>

      {/* GST Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          GST Number
        </label>
        <input
          type="text"
          name="gstNumber"
          value={formData.gstNumber}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="22AAAAA0000A1Z5"
          maxLength="15"
        />
        <p className="text-xs text-gray-500 mt-1">PAN will be auto-filled from GST number</p>
      </div>

      {/* PAN Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          PAN Number
        </label>
        <input
          type="text"
          name="panNumber"
          value={formData.panNumber}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          placeholder="AAAAA0000A"
          maxLength="10"
          readOnly={formData.gstNumber.length >= 10}
        />
        {formData.gstNumber.length >= 10 && (
          <p className="text-xs text-green-600 mt-1">Auto-filled from GST number</p>
        )}
      </div>

      {/* City */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          City
        </label>
        <input
          type="text"
          name="address.city"
          value={formData.address.city}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter city"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Additional notes..."
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Saving...' : customer ? 'Update Customer' : 'Create Customer'}
        </button>
      </div>
    </form>
  );
};

export default CustomerForm;
