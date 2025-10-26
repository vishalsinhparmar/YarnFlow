import { useState, useEffect } from 'react';

const SupplierForm = ({ supplier, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    gstNumber: '',
    panNumber: '',
    city: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  // Populate form if editing existing supplier
  useEffect(() => {
    if (supplier) {
      setFormData({
        companyName: supplier.companyName || '',
        gstNumber: supplier.gstNumber || '',
        panNumber: supplier.panNumber || '',
        city: supplier.address?.city || supplier.city || '',
        notes: supplier.notes || ''
      });
    }
  }, [supplier]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-extract PAN from GST number
    if (name === 'gstNumber' && value.length >= 10) {
      // Extract PAN from GST (characters 3-12, which is index 2-11)
      const extractedPAN = value.substring(2, 12).toUpperCase();
      setFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase(),
        panNumber: extractedPAN
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'gstNumber' || name === 'panNumber' ? value.toUpperCase() : value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    // GST validation (optional but if provided should be valid)
    if (formData.gstNumber && formData.gstNumber.length !== 15) {
      newErrors.gstNumber = 'GST number must be 15 characters';
    }

    // PAN validation (optional but if provided should be valid)
    if (formData.panNumber && formData.panNumber.length !== 10) {
      newErrors.panNumber = 'PAN number must be 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
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
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
            errors.companyName ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter company name"
          required
        />
        {errors.companyName && (
          <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>
        )}
      </div>

      {/* GST and PAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            GST Number
          </label>
          <input
            type="text"
            name="gstNumber"
            value={formData.gstNumber}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              errors.gstNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="22AAAAA0000A1Z5"
            maxLength="15"
          />
          {errors.gstNumber && (
            <p className="text-red-500 text-xs mt-1">{errors.gstNumber}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            PAN Number <span className="text-xs text-gray-500">(Auto-filled from GST)</span>
          </label>
          <input
            type="text"
            name="panNumber"
            value={formData.panNumber}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              errors.panNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Auto-filled from GST"
            maxLength="10"
          />
          {errors.panNumber && (
            <p className="text-red-500 text-xs mt-1">{errors.panNumber}</p>
          )}
        </div>
      </div>

      {/* City */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          City
        </label>
        <input
          type="text"
          name="city"
          value={formData.city}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
          rows="4"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Additional notes about the supplier"
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Saving...' : supplier ? 'Update Supplier' : 'Create Supplier'}
        </button>
      </div>
    </form>
  );
};

export default SupplierForm;
