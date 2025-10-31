// Inventory API Service
import { apiRequest } from './common.js';

// ============ INVENTORY API SERVICE ============
// Note: Inventory is now GRN-based (single source of truth)
// This file maintains backward compatibility while redirecting to GRN endpoints

export const inventoryAPI = {
  // Get all inventory (now fetches from GRN-based inventory)
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString();
    // Redirect to GRN-based inventory endpoint
    return apiRequest(`/inventory${queryString ? `?${queryString}` : ''}`);
  },

  // ============ DEPRECATED METHODS ============
  // The following methods are deprecated and will be removed in future versions
  // They are kept for backward compatibility only

  // Get inventory statistics for dashboard (DEPRECATED)
  getStats: async () => {
    console.warn('inventoryAPI.getStats() is deprecated. Use GRN-based stats instead.');
    return { success: false, message: 'This endpoint has been deprecated' };
  },

  // Get single inventory lot by ID (DEPRECATED)
  getById: async (id) => {
    console.warn('inventoryAPI.getById() is deprecated. Use GRN details instead.');
    return { success: false, message: 'This endpoint has been deprecated' };
  },

  // Update inventory lot (DEPRECATED)
  update: async (id, data) => {
    console.warn('inventoryAPI.update() is deprecated. Update GRN status instead.');
    return { success: false, message: 'This endpoint has been deprecated' };
  },

  // Record stock movement (DEPRECATED)
  recordMovement: async (id, movementData) => {
    console.warn('inventoryAPI.recordMovement() is deprecated. Stock movements are tracked through GRNs.');
    return { success: false, message: 'This endpoint has been deprecated' };
  },

  // Transfer stock between lots or locations (DEPRECATED)
  transferStock: async (transferData) => {
    console.warn('inventoryAPI.transferStock() is deprecated. Stock transfers are managed through GRNs.');
    return { success: false, message: 'This endpoint has been deprecated' };
  },

  // Get low stock alerts (DEPRECATED)
  getLowStockAlerts: async (threshold = 50) => {
    console.warn('inventoryAPI.getLowStockAlerts() is deprecated.');
    return { success: false, message: 'This endpoint has been deprecated' };
  },

  // Get expiry alerts (DEPRECATED)
  getExpiryAlerts: async (days = 30) => {
    console.warn('inventoryAPI.getExpiryAlerts() is deprecated.');
    return { success: false, message: 'This endpoint has been deprecated' };
  },

  // Acknowledge alert (DEPRECATED)
  acknowledgeAlert: async (lotId, alertId) => {
    console.warn('inventoryAPI.acknowledgeAlert() is deprecated.');
    return { success: false, message: 'This endpoint has been deprecated' };
  },

  // Get movement history for a lot (DEPRECATED)
  getMovementHistory: async (id, params = {}) => {
    console.warn('inventoryAPI.getMovementHistory() is deprecated. Use GRN history instead.');
    return { success: false, message: 'This endpoint has been deprecated' };
  },

  // Search lots (DEPRECATED)
  search: async (searchTerm, filters = {}) => {
    const params = { search: searchTerm, ...filters };
    return inventoryAPI.getAll(params);
  },

  // Get lots by status (DEPRECATED)
  getByStatus: async (status, params = {}) => {
    return inventoryAPI.getAll({ status, ...params });
  },

  // Get lots by product (DEPRECATED)
  getByProduct: async (productId, params = {}) => {
    return inventoryAPI.getAll({ product: productId, ...params });
  },

  // Get lots by supplier (DEPRECATED)
  getBySupplier: async (supplierId, params = {}) => {
    return inventoryAPI.getAll({ supplier: supplierId, ...params });
  },

  // Get lots by warehouse (DEPRECATED)
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
