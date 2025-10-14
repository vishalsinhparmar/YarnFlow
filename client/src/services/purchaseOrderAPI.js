// Purchase Order API Service
import { apiRequest } from './common.js';

// Generic API request handler moved to ./common.js

// Handle API errors consistently
export const handleAPIError = (error, defaultMessage = 'An error occurred') => {
  if (error.message) {
    return error.message;
  }
  return defaultMessage;
};

// ============ PURCHASE ORDER API ============
export const purchaseOrderAPI = {
  // Get all purchase orders with pagination and filters
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/purchase-orders?${queryString}` : '/purchase-orders';
    return apiRequest(endpoint);
  },

  // Get purchase order by ID
  getById: async (id) => {
    return apiRequest(`/purchase-orders/${id}`);
  },

  // Create new purchase order
  create: async (poData) => {
    return apiRequest('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(poData),
    });
  },

  // Update purchase order
  update: async (id, poData) => {
    return apiRequest(`/purchase-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(poData),
    });
  },

  // Delete purchase order (draft only)
  delete: async (id) => {
    return apiRequest(`/purchase-orders/${id}`, {
      method: 'DELETE',
    });
  },

  // Update PO status
  updateStatus: async (id, status, notes = '') => {
    return apiRequest(`/purchase-orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },

  // Receive items (Goods Receipt)
  receiveItems: async (id, receivedItems, notes = '') => {
    return apiRequest(`/purchase-orders/${id}/receive`, {
      method: 'PATCH',
      body: JSON.stringify({ receivedItems, notes }),
    });
  },

  // Get PO statistics
  getStats: async () => {
    return apiRequest('/purchase-orders/stats');
  },

  // Search POs
  search: async (searchTerm, filters = {}) => {
    const params = { search: searchTerm, ...filters };
    return purchaseOrderAPI.getAll(params);
  },

  // Get overdue POs
  getOverdue: async () => {
    return purchaseOrderAPI.getAll({ overdue: 'true' });
  },

  // Get POs by status
  getByStatus: async (status, params = {}) => {
    return purchaseOrderAPI.getAll({ status, ...params });
  },

  // Get POs by supplier
  getBySupplier: async (supplierId, params = {}) => {
    return purchaseOrderAPI.getAll({ supplier: supplierId, ...params });
  },

  // Get POs by date range
  getByDateRange: async (dateFrom, dateTo, params = {}) => {
    return purchaseOrderAPI.getAll({ dateFrom, dateTo, ...params });
  }
};

// ============ PO UTILITIES ============
export const poUtils = {
  // Format PO status for display
  formatStatus: (status) => {
    const statusMap = {
      'Draft': 'Draft',
      'Sent': 'Sent',
      'Acknowledged': 'Acknowledged', 
      'Approved': 'Approved',
      'Partially_Received': 'Partially Received',
      'Fully_Received': 'Fully Received',
      'Cancelled': 'Cancelled',
      'Closed': 'Closed'
    };
    return statusMap[status] || status;
  },

  // Get status color for UI
  getStatusColor: (status) => {
    const colorMap = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Sent': 'bg-blue-100 text-blue-800',
      'Acknowledged': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-green-100 text-green-800',
      'Partially_Received': 'bg-orange-100 text-orange-800',
      'Fully_Received': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'Closed': 'bg-gray-100 text-gray-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  },

  // Format currency
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  // Format date
  formatDate: (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  // Check if PO is overdue
  isOverdue: (expectedDeliveryDate, status) => {
    const today = new Date();
    const deliveryDate = new Date(expectedDeliveryDate);
    const completedStatuses = ['Fully_Received', 'Cancelled', 'Closed'];
    
    return deliveryDate < today && !completedStatuses.includes(status);
  },

  // Calculate completion percentage
  calculateCompletion: (items) => {
    if (!items || items.length === 0) return 0;
    
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const receivedQuantity = items.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0);
    
    return totalQuantity > 0 ? Math.round((receivedQuantity / totalQuantity) * 100) : 0;
  },

  // Get next valid statuses for workflow
  getNextStatuses: (currentStatus) => {
    const statusFlow = {
      'Draft': ['Sent', 'Cancelled'],
      'Sent': ['Acknowledged', 'Cancelled'],
      'Acknowledged': ['Approved', 'Cancelled'],
      'Approved': ['Partially_Received', 'Fully_Received', 'Cancelled'],
      'Partially_Received': ['Fully_Received', 'Cancelled'],
      'Fully_Received': ['Closed'],
      'Cancelled': [],
      'Closed': []
    };
    return statusFlow[currentStatus] || [];
  }
};

export default purchaseOrderAPI;
