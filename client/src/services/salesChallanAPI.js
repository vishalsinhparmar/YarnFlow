// Sales Challan API Service
import { apiRequest } from './common.js';

// Generic API request handler moved to ./common.js

// ============ SALES CHALLAN API ============
export const salesChallanAPI = {
  // Get all sales challans with pagination and filters
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/sales-challans?${queryString}` : '/sales-challans';
    return apiRequest(endpoint);
  },

  // Get sales challan by ID
  getById: async (id) => {
    return apiRequest(`/sales-challans/${id}`);
  },

  // Create sales challan from sales order
  create: async (challanData) => {
    return apiRequest('/sales-challans', {
      method: 'POST',
      body: JSON.stringify(challanData),
    });
  },

  // Update sales challan
  update: async (id, challanData) => {
    return apiRequest(`/sales-challans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(challanData),
    });
  },

  // Delete sales challan
  delete: async (id) => {
    return apiRequest(`/sales-challans/${id}`, {
      method: 'DELETE',
    });
  },

  // Update challan status
  updateStatus: async (id, statusData) => {
    return apiRequest(`/sales-challans/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    });
  },

  // Get sales challan statistics
  getStats: async () => {
    return apiRequest('/sales-challans/stats');
  },

  // Get challans by sales order
  getBySalesOrder: async (soId) => {
    return apiRequest(`/sales-challans/by-sales-order/${soId}`);
  },

  // Track challan by number
  track: async (challanNumber) => {
    return apiRequest(`/sales-challans/track/${challanNumber}`);
  }
};

// ============ SALES CHALLAN UTILITIES ============
export const salesChallanUtils = {
  // Format status for display
  formatStatus: (status) => {
    const statusMap = {
      'Prepared': 'Prepared',
      'Packed': 'Packed',
      'Dispatched': 'Dispatched',
      'In_Transit': 'In Transit',
      'Out_for_Delivery': 'Out for Delivery',
      'Delivered': 'Delivered',
      'Returned': 'Returned',
      'Cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  },

  // Get status color
  getStatusColor: (status) => {
    const colorMap = {
      'Prepared': 'bg-blue-100 text-blue-800',
      'Packed': 'bg-yellow-100 text-yellow-800',
      'Dispatched': 'bg-orange-100 text-orange-800',
      'In_Transit': 'bg-purple-100 text-purple-800',
      'Out_for_Delivery': 'bg-indigo-100 text-indigo-800',
      'Delivered': 'bg-green-100 text-green-800',
      'Returned': 'bg-red-100 text-red-800',
      'Cancelled': 'bg-gray-100 text-gray-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  },

  // Check if challan can be updated
  canUpdate: (status) => {
    return !['Delivered', 'Returned', 'Cancelled'].includes(status);
  },

  // Check if challan can be deleted
  canDelete: (status) => {
    return ['Prepared', 'Packed'].includes(status);
  },

  // Get next possible statuses
  getNextStatuses: (currentStatus) => {
    const statusFlow = {
      'Prepared': ['Packed', 'Cancelled'],
      'Packed': ['Dispatched', 'Cancelled'],
      'Dispatched': ['In_Transit', 'Returned'],
      'In_Transit': ['Out_for_Delivery', 'Returned'],
      'Out_for_Delivery': ['Delivered', 'Returned'],
      'Delivered': [],
      'Returned': ['Prepared'],
      'Cancelled': []
    };
    return statusFlow[currentStatus] || [];
  },

  // Format date for display
  formatDate: (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  // Format currency
  formatCurrency: (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  },

  // Generate challan actions based on status
  getAvailableActions: (challan) => {
    const actions = [];
    
    // View action (always available)
    actions.push({ type: 'view', label: 'View', color: 'blue' });
    
    // Update status action
    if (salesChallanUtils.canUpdate(challan.status)) {
      const nextStatuses = salesChallanUtils.getNextStatuses(challan.status);
      if (nextStatuses.length > 0) {
        actions.push({ type: 'updateStatus', label: 'Update Status', color: 'green' });
      }
    }
    
    // Edit action (only for prepared/packed)
    if (['Prepared', 'Packed'].includes(challan.status)) {
      actions.push({ type: 'edit', label: 'Edit', color: 'yellow' });
    }
    
    // Track action (for dispatched and beyond)
    if (['Dispatched', 'In_Transit', 'Out_for_Delivery', 'Delivered'].includes(challan.status)) {
      actions.push({ type: 'track', label: 'Track', color: 'purple' });
    }
    
    // Print action
    actions.push({ type: 'print', label: 'Print', color: 'gray' });
    
    // Delete action (only for prepared/packed)
    if (salesChallanUtils.canDelete(challan.status)) {
      actions.push({ type: 'delete', label: 'Delete', color: 'red' });
    }
    
    return actions;
  }
};
