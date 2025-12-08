import { useState, useEffect } from 'react';
import { Loader2, Building2, FileText, MapPin, StickyNote } from 'lucide-react';

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
        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600" />
          Company Name *
        </label>
        <input
          type="text"
          name="companyName"
          value={formData.companyName}
          onChange={handleChange}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="Enter company name"
          required
        />
      </div>

      {/* GST Number */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          GST Number
        </label>
        <input
          type="text"
          name="gstNumber"
          value={formData.gstNumber}
          onChange={handleChange}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="22AAAAA0000A1Z5"
          maxLength="15"
        />
        <p className="text-xs text-blue-600 mt-1.5 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          PAN will be auto-filled from GST number
        </p>
      </div>

      {/* PAN Number */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          PAN Number
        </label>
        <input
          type="text"
          name="panNumber"
          value={formData.panNumber}
          onChange={handleChange}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50"
          placeholder="AAAAA0000A"
          maxLength="10"
          readOnly={formData.gstNumber.length >= 10}
        />
        {formData.gstNumber.length >= 10 && (
          <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Auto-filled from GST number
          </p>
        )}
      </div>

      {/* City */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-600" />
          City
        </label>
        <input
          type="text"
          name="address.city"
          value={formData.address.city}
          onChange={handleChange}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="Enter city"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-blue-600" />
          Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="3"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
          placeholder="Additional notes..."
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-8 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 min-w-[160px] justify-center"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{customer ? 'Update Customer' : 'Create Customer'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default CustomerForm;
