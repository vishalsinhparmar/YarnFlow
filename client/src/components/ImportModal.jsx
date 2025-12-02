import React, { useState } from 'react';
import { importMasterData } from '../services/masterDataAPI';

const ImportModal = ({ isOpen, onClose, onSuccess, defaultType = 'customers' }) => {
  const [selectedType, setSelectedType] = useState(defaultType);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Update selectedType when defaultType changes
  React.useEffect(() => {
    if (isOpen) {
      setSelectedType(defaultType);
    }
  }, [isOpen, defaultType]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (validTypes.includes(file.type) || file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please select a valid Excel (.xlsx, .xls) or CSV file');
        setSelectedFile(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const response = await importMasterData(selectedType, selectedFile);
      
      if (response.success) {
        setResult(response.data);
        
        // Auto-close and refresh after 3 seconds
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 3000);
      } else {
        setError(response.message || 'Import failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during import');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    setUploading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Import Excel Data</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Data Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={uploading}
            >
              <option value="customers">Customers</option>
              <option value="suppliers">Suppliers</option>
              <option value="products">Products</option>
              <option value="categories">Categories</option>
            </select>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Excel File
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={uploading}
              />
            </div>
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>

          {/* Expected Format Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800 font-medium mb-1">Expected Excel Columns:</p>
            <div className="text-xs text-blue-700">
              {selectedType === 'customers' && (
                <ul className="list-disc list-inside space-y-1">
                  <li>companyName (required)</li>
                  <li>gstNumber</li>
                  <li>panNumber</li>
                  <li>city</li>
                  <li>notes</li>
                  <li>status (Active/Inactive)</li>
                </ul>
              )}
              {selectedType === 'suppliers' && (
                <ul className="list-disc list-inside space-y-1">
                  <li>companyName (required)</li>
                  <li>gstNumber</li>
                  <li>panNumber</li>
                  <li>city</li>
                  <li>notes</li>
                  <li>status (Active/Inactive/Blocked)</li>
                </ul>
              )}
              {selectedType === 'categories' && (
                <ul className="list-disc list-inside space-y-1">
                  <li>categoryName (required)</li>
                  <li>description</li>
                  <li>status (Active/Inactive)</li>
                </ul>
              )}
              {selectedType === 'products' && (
                <ul className="list-disc list-inside space-y-1">
                  <li>productName (required)</li>
                  <li>category (required - category name)</li>
                  <li>description</li>
                  <li>status (Active/Inactive/Discontinued)</li>
                </ul>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Success Result */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-green-800 mb-2">Import Completed!</h3>
              <div className="space-y-1 text-sm text-green-700">
                <p>✓ Inserted: {result.inserted}</p>
                <p>↻ Updated: {result.updated}</p>
                <p>⊘ Skipped: {result.skipped}</p>
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Errors:</p>
                    <ul className="list-disc list-inside text-xs">
                      {result.errors.slice(0, 5).map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                      {result.errors.length > 5 && (
                        <li>... and {result.errors.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={uploading || !selectedFile}
            >
              {uploading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </span>
              ) : (
                'Import'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ImportModal;
