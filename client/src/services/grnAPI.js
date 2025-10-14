// GRN (Goods Receipt Note) API Service
import { apiRequest } from './common.js';

// Generic API request handler moved to ./common.js

// Handle API errors consistently
export const handleAPIError = (error, defaultMessage = 'An error occurred') => {
  if (error.message) {
    return error.message;
  }
  return defaultMessage;
};

// ============ GRN API ============
export const grnAPI = {
  // Get all GRNs with pagination and filters
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/grn?${queryString}` : '/grn';
    return apiRequest(endpoint);
  },

  // Get GRN by ID
  getById: async (id) => {
    return apiRequest(`/grn/${id}`);
  },

  // Create new GRN
  create: async (grnData) => {
    return apiRequest('/grn', {
      method: 'POST',
      body: JSON.stringify(grnData),
    });
  },

  // Update GRN
  update: async (id, grnData) => {
    return apiRequest(`/grn/${id}`, {
      method: 'PUT',
      body: JSON.stringify(grnData),
    });
  },

  // Delete GRN (draft only)
  delete: async (id) => {
  },

  // Update GRN status
  updateStatus: async (id, statusData) => {
    return await apiRequest(`/grn/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData)
    });
  },

  // Approve GRN and create inventory lots
  approve: async (id, approvedBy, notes = '') => {
    return await apiRequest(`/grn/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ approvedBy, notes }),
    });
  },

  // Get GRN statistics
  getStats: async () => {
    return apiRequest('/grn/stats');
  },

  // Get GRNs by Purchase Order
  getByPO: async (poId) => {
    return apiRequest(`/grn/by-po/${poId}`);
  },

  // Search GRNs
  search: async (searchTerm, filters = {}) => {
    const params = { search: searchTerm, ...filters };
    return grnAPI.getAll(params);
  },

  // Get GRNs by status
  getByStatus: async (status, params = {}) => {
    return grnAPI.getAll({ status, ...params });
  },

  // Get GRNs by supplier
  getBySupplier: async (supplierId, params = {}) => {
    return grnAPI.getAll({ supplier: supplierId, ...params });
  },

  // Get GRNs by date range
  getByDateRange: async (dateFrom, dateTo, params = {}) => {
    return grnAPI.getAll({ dateFrom, dateTo, ...params });
  }
};

// ============ GRN UTILITIES ============
export const grnUtils = {
  // Format GRN status for display
  formatStatus: (status) => {
    const statusMap = {
      'Draft': 'Draft',
      'Received': 'Received',
      'Under_Review': 'Under Review',
      'Approved': 'Approved',
      'Rejected': 'Rejected',
      'Completed': 'Completed'
    };
    return statusMap[status] || status;
  },

  // Get status color for UI
  getStatusColor: (status) => {
    const colorMap = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Received': 'bg-blue-100 text-blue-800',
      'Under_Review': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Completed': 'bg-green-100 text-green-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  },

  // Format quality status
  formatQualityStatus: (status) => {
    const statusMap = {
      'Pending': 'Pending Review',
      'In_Progress': 'In Progress',
      'Completed': 'Completed',
      'Failed': 'Failed'
    };
    return statusMap[status] || status;
  },

  // Get quality status color
  getQualityStatusColor: (status) => {
    const colorMap = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'In_Progress': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800',
      'Failed': 'bg-red-100 text-red-800'
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

  // Format quantity with unit
  formatQuantity: (quantity, unit) => {
    return `${quantity} ${unit}`;
  },

  // Calculate completion percentage
  calculateCompletion: (items) => {
    if (!items || items.length === 0) return 0;
    
    const totalItems = items.length;
    const completedItems = items.filter(item => 
      item.qualityStatus === 'Approved' || item.qualityStatus === 'Rejected'
    ).length;
    
    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  },

  // Get next valid statuses for workflow
  getNextStatuses: (currentStatus) => {
    const statusFlow = {
      'Draft': ['Received', 'Rejected'],
      'Received': ['Under_Review', 'Approved', 'Rejected'],
      'Under_Review': ['Approved', 'Rejected'],
      'Approved': ['Completed'],
      'Rejected': [],
      'Completed': []
    };
    return statusFlow[currentStatus] || [];
  },

  // Check if GRN can be edited
  canEdit: (status) => {
    return ['Draft', 'Received'].includes(status);
  },

  // Check if GRN can be approved
  canApprove: (status, qualityStatus) => {
    return (status === 'Under_Review' || status === 'Received') && qualityStatus === 'Completed';
  },

  // Check if GRN can be deleted
  canDelete: (status) => {
    return status === 'Draft';
  },

  // Get action buttons for GRN
  getAvailableActions: (grn) => {
    const actions = [];
    
    // Always show view
    actions.push({ type: 'view', label: 'View', color: 'blue' });
    
    // Edit for draft and received
    if (grnUtils.canEdit(grn.status)) {
      actions.push({ type: 'edit', label: 'Edit', color: 'gray' });
    }
    
    // Review for received status
    if (grn.status === 'Received') {
      actions.push({ type: 'review', label: 'Review', color: 'yellow' });
    }
    
    // Approve for under review with completed quality check
    if (grnUtils.canApprove(grn.status, grn.qualityCheckStatus)) {
      actions.push({ type: 'approve', label: 'Approve', color: 'green' });
    }
    
    // Delete for draft only
    if (grnUtils.canDelete(grn.status)) {
      actions.push({ type: 'delete', label: 'Delete', color: 'red' });
    }
    
    return actions;
  }
};

export default grnAPI;
