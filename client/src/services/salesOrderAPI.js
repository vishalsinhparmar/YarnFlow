// Sales Order API Service
import { apiRequest } from './common.js';

// Generic API request handler moved to ./common.js

// ============ SALES ORDER API SERVICE ============

export const salesOrderAPI = {
  // Get all sales orders with filtering and pagination
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    const endpoint = queryParams.toString() 
      ? `/sales-orders?${queryParams.toString()}`
      : '/sales-orders';
    
    return await apiRequest(endpoint);
  },

  // Get single sales order by ID
  getById: async (id) => {
    return await apiRequest(`/sales-orders/${id}`);
  },

  // Create new sales order
  create: async (salesOrderData) => {
    return await apiRequest('/sales-orders', {
      method: 'POST',
      body: JSON.stringify(salesOrderData)
    });
  },

  // Update sales order
  update: async (id, salesOrderData) => {
    return await apiRequest(`/sales-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(salesOrderData)
    });
  },

  // Delete sales order (draft only)
  delete: async (id) => {
    return await apiRequest(`/sales-orders/${id}`, {
      method: 'DELETE'
    });
  },

  // Update sales order status
  updateStatus: async (id, statusData) => {
    return await apiRequest(`/sales-orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData)
    });
  },

  // Get sales order statistics
  getStats: async () => {
    return await apiRequest('/sales-orders/stats');
  },

  // Cancel sales order
  cancel: async (id, cancellationData) => {
    return await apiRequest(`/sales-orders/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify(cancellationData)
    });
  }
};

// ============ SALES ORDER UTILITIES ============

export const salesOrderUtils = {
  // Format currency in Indian format
  formatCurrency: (amount) => {
    if (!amount && amount !== 0) return '₹0';
    
    const numAmount = parseFloat(amount);
    if (numAmount >= 10000000) { // 1 Crore
      return `₹${(numAmount / 10000000).toFixed(1)}Cr`;
    } else if (numAmount >= 100000) { // 1 Lakh
      return `₹${(numAmount / 100000).toFixed(1)}L`;
    } else if (numAmount >= 1000) { // 1 Thousand
      return `₹${(numAmount / 1000).toFixed(1)}K`;
    } else {
      return `₹${numAmount.toLocaleString('en-IN')}`;
    }
  },

  // Format date in Indian format
  formatDate: (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  },

  // Format relative time
  formatRelativeTime: (date) => {
    if (!date) return '-';
    
    const now = new Date();
    const targetDate = new Date(date);
    const diffMs = now - targetDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'Just now';
    }
  },

  // Get status color
  getStatusColor: (status) => {
    const statusColors = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Processing': 'bg-purple-100 text-purple-800',
      'Delivered': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  },

  // Calculate completion percentage
  getCompletionPercentage: (salesOrder) => {
    if (!salesOrder.items || salesOrder.items.length === 0) return 0;
    
    const totalQuantity = salesOrder.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const deliveredQuantity = salesOrder.items.reduce((sum, item) => sum + (item.deliveredQuantity || 0), 0);
    
    return totalQuantity > 0 ? Math.round((deliveredQuantity / totalQuantity) * 100) : 0;
  },

  // Calculate days until delivery
  getDaysUntilDelivery: (expectedDeliveryDate) => {
    if (!expectedDeliveryDate) return null;
    
    const now = new Date();
    const deliveryDate = new Date(expectedDeliveryDate);
    const diffTime = deliveryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  },

  // Check if order is overdue
  isOverdue: (expectedDeliveryDate, status) => {
    if (status === 'Delivered' || status === 'Cancelled') return false;
    
    const daysUntilDelivery = salesOrderUtils.getDaysUntilDelivery(expectedDeliveryDate);
    return daysUntilDelivery !== null && daysUntilDelivery < 0;
  },

  // Check if order can be edited
  canEdit: (status) => {
    return ['Draft', 'Pending'].includes(status);
  },

  // Check if order can be cancelled
  canCancel: (status) => {
    return ['Draft', 'Pending', 'Processing'].includes(status);
  },

};

export default salesOrderAPI;
