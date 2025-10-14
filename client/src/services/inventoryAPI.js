// Inventory API Service
import { apiRequest } from './common.js';

// Generic API request handler moved to ./common.js

// ============ INVENTORY API SERVICE ============

export const inventoryAPI = {
  // Get all inventory lots with filtering and pagination
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString();
    return apiRequest(`/inventory${queryString ? `?${queryString}` : ''}`);
  },

  // Get inventory statistics for dashboard
  getStats: async () => {
    return apiRequest('/inventory/stats');
  },

  // Get single inventory lot by ID
  getById: async (id) => {
    return apiRequest(`/inventory/${id}`);
  },

  // Update inventory lot
  update: async (id, data) => {
    return apiRequest(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Record stock movement
  recordMovement: async (id, movementData) => {
    return apiRequest(`/inventory/${id}/movement`, {
      method: 'POST',
      body: JSON.stringify(movementData),
    });
  },

  // Transfer stock between lots or locations
  transferStock: async (transferData) => {
    return apiRequest('/inventory/transfer', {
      method: 'POST',
      body: JSON.stringify(transferData),
    });
  },

  // Get low stock alerts
  getLowStockAlerts: async (threshold = 50) => {
    return apiRequest(`/inventory/alerts/low-stock?threshold=${threshold}`);
  },

  // Get expiry alerts
  getExpiryAlerts: async (days = 30) => {
    return apiRequest(`/inventory/alerts/expiry?days=${days}`);
  },

  // Acknowledge alert
  acknowledgeAlert: async (lotId, alertId) => {
    return apiRequest(`/inventory/${lotId}/alerts/${alertId}/acknowledge`, {
      method: 'PUT',
    });
  },

  // Get movement history for a lot
  getMovementHistory: async (id, params = {}) => {
    const queryParams = new URLSearchParams(params);
    const queryString = queryParams.toString();
    return apiRequest(`/inventory/${id}/movements${queryString ? `?${queryString}` : ''}`);
  },

  // Search lots
  search: async (searchTerm, filters = {}) => {
    const params = { search: searchTerm, ...filters };
    return inventoryAPI.getAll(params);
  },

  // Get lots by status
  getByStatus: async (status, params = {}) => {
    return inventoryAPI.getAll({ status, ...params });
  },

  // Get lots by product
  getByProduct: async (productId, params = {}) => {
    return inventoryAPI.getAll({ product: productId, ...params });
  },

  // Get lots by supplier
  getBySupplier: async (supplierId, params = {}) => {
    return inventoryAPI.getAll({ supplier: supplierId, ...params });
  },

  // Get lots by warehouse
  getByWarehouse: async (warehouse, params = {}) => {
    return inventoryAPI.getAll({ warehouse, ...params });
  }
};

// ============ INVENTORY UTILITIES ============
export const inventoryUtils = {
  // Format status for display
  formatStatus: (status) => {
    const statusMap = {
      'Active': 'Available',
      'Reserved': 'Reserved',
      'Consumed': 'Consumed',
      'Expired': 'Expired',
      'Damaged': 'Damaged',
      'Returned': 'Returned'
    };
    return statusMap[status] || status;
  },

  // Get status color
  getStatusColor: (status) => {
    const colorMap = {
      'Active': 'bg-green-100 text-green-800',
      'Reserved': 'bg-yellow-100 text-yellow-800',
      'Consumed': 'bg-gray-100 text-gray-800',
      'Expired': 'bg-red-100 text-red-800',
      'Damaged': 'bg-red-100 text-red-800',
      'Returned': 'bg-blue-100 text-blue-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  },

  // Format quality status
  formatQualityStatus: (qualityStatus) => {
    const statusMap = {
      'Approved': 'Approved',
      'Rejected': 'Rejected',
      'Under_Review': 'Under Review',
      'Quarantine': 'Quarantine'
    };
    return statusMap[qualityStatus] || qualityStatus;
  },

  // Get quality status color
  getQualityStatusColor: (qualityStatus) => {
    const colorMap = {
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Under_Review': 'bg-yellow-100 text-yellow-800',
      'Quarantine': 'bg-orange-100 text-orange-800'
    };
    return colorMap[qualityStatus] || 'bg-gray-100 text-gray-800';
  },

  // Format movement type
  formatMovementType: (type) => {
    const typeMap = {
      'Received': 'Stock In',
      'Reserved': 'Reserved',
      'Issued': 'Stock Out',
      'Returned': 'Returned',
      'Adjusted': 'Adjusted',
      'Transferred': 'Transferred',
      'Damaged': 'Damaged'
    };
    return typeMap[type] || type;
  },

  // Get movement type icon
  getMovementTypeIcon: (type) => {
    const iconMap = {
      'Received': '📥',
      'Reserved': '🔒',
      'Issued': '📤',
      'Returned': '↩️',
      'Adjusted': '⚖️',
      'Transferred': '🔄',
      'Damaged': '⚠️'
    };
    return iconMap[type] || '📦';
  },

  // Format currency (Indian Rupees)
  formatCurrency: (amount) => {
    if (amount >= 10000000) { // 1 crore
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) { // 1 lakh
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) { // 1 thousand
      return `₹${(amount / 1000).toFixed(1)}K`;
    } else {
      return `₹${amount.toFixed(0)}`;
    }
  },

  // Format quantity with unit
  formatQuantity: (quantity, unit) => {
    if (quantity >= 1000) {
      return `${(quantity / 1000).toFixed(1)}K ${unit}`;
    }
    return `${quantity} ${unit}`;
  },

  // Format date for display
  formatDate: (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  },

  // Format relative time
  formatRelativeTime: (date) => {
    if (!date) return '-';
    
    const now = new Date();
    const diffInMs = now - new Date(date);
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return inventoryUtils.formatDate(date);
    }
  },

  // Get unit icon
  getUnitIcon: (unit) => {
    const iconMap = {
      'Bags': '🛍️',
      'Rolls': '🧻',
      'Kg': '⚖️',
      'Meters': '📏',
      'Pieces': '📦'
    };
    return iconMap[unit] || '📦';
  },

  // Calculate stock percentage
  calculateStockPercentage: (current, received) => {
    if (!received || received === 0) return 0;
    return Math.round((current / received) * 100);
  },

  // Get stock level indicator
  getStockLevelColor: (percentage) => {
    if (percentage >= 70) return 'text-green-600';
    if (percentage >= 30) return 'text-yellow-600';
    return 'text-red-600';
  },

  // Format location
  formatLocation: (location) => {
    if (!location) return '-';
    
    const parts = [];
    if (location.zone) parts.push(`Zone ${location.zone}`);
    if (location.rack) parts.push(`Rack ${location.rack}`);
    if (location.shelf) parts.push(`Shelf ${location.shelf}`);
    if (location.bin) parts.push(`Bin ${location.bin}`);
    
    return parts.length > 0 ? parts.join(', ') : '-';
  },

  // Get alert priority color
  getAlertPriorityColor: (type) => {
    const colorMap = {
      'Low_Stock': 'bg-yellow-50 border-yellow-200 text-yellow-800',
      'Expiry_Warning': 'bg-orange-50 border-orange-200 text-orange-800',
      'Quality_Issue': 'bg-red-50 border-red-200 text-red-800',
      'Storage_Issue': 'bg-blue-50 border-blue-200 text-blue-800'
    };
    return colorMap[type] || 'bg-gray-50 border-gray-200 text-gray-800';
  },

  // Validate movement quantity
  validateMovementQuantity: (type, quantity, availableQuantity) => {
    const outgoingTypes = ['Issued', 'Damaged', 'Transferred', 'Reserved'];
    
    if (outgoingTypes.includes(type) && quantity > availableQuantity) {
      return `Insufficient stock. Available: ${availableQuantity}`;
    }
    
    if (quantity <= 0) {
      return 'Quantity must be greater than 0';
    }
    
    return null;
  }
};

export default inventoryAPI;
