import { X } from 'lucide-react';

const SimpleDeleteModal = ({ isOpen, onClose, onConfirm, itemName, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Confirm Delete
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5">
            <p className="text-gray-600">
              Are you sure you want to delete <span className="font-semibold text-gray-900">"{itemName}"</span>?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This action cannot be undone.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-5 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Delete</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleDeleteModal;
