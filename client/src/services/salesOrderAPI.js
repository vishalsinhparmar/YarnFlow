// Sales Order API Service
const API_BASE_URL = 'http://localhost:3020/api';

// Generic API request handler
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

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

  // Reserve inventory for sales order
  reserveInventory: async (id, reservedBy) => {
    return await apiRequest(`/sales-orders/${id}/reserve`, {
      method: 'PATCH',
    });
  },

  // Ship sales order
  ship: async (id, shipmentData) => {
    const response = await fetch(`${API_BASE_URL}/sales-orders/${id}/ship`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shipmentData)
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to ship order');
    }
    return data;
  },

  // Mark as delivered
  markDelivered: async (id, deliveryData) => {
    const response = await fetch(`${API_BASE_URL}/sales-orders/${id}/deliver`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(deliveryData)
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to mark as delivered');
    }
    return data;
  },

  // Cancel sales order
  cancel: async (id, cancellationData) => {
    return await apiRequest(`/sales-orders/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify(cancellationData)
    });
  },

  // Get sales order statistics
  getStats: async () => {
    return await apiRequest('/sales-orders/stats');
  },

  // Get sales orders by customer
  getByCustomer: async (customerId, params = {}) => {
    const queryParams = new URLSearchParams(params);
    const endpoint = queryParams.toString() 
      ? `/sales-orders/customer/${customerId}?${queryParams.toString()}`
      : `/sales-orders/customer/${customerId}`;
    
    return await apiRequest(endpoint);
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
      'Confirmed': 'bg-blue-100 text-blue-800',
      'Processing': 'bg-purple-100 text-purple-800',
      'Shipped': 'bg-orange-100 text-orange-800',
      'Delivered': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'Returned': 'bg-pink-100 text-pink-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  },

  // Get priority color
  getPriorityColor: (priority) => {
    const priorityColors = {
      'Low': 'bg-green-100 text-green-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'High': 'bg-orange-100 text-orange-800',
      'Urgent': 'bg-red-100 text-red-800'
    };
    return priorityColors[priority] || 'bg-gray-100 text-gray-800';
  },

  // Get payment status color
  getPaymentStatusColor: (status) => {
    const statusColors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Partial': 'bg-orange-100 text-orange-800',
      'Paid': 'bg-green-100 text-green-800',
      'Overdue': 'bg-red-100 text-red-800',
      'Cancelled': 'bg-gray-100 text-gray-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  },

  // Get status icon
  getStatusIcon: (status) => {
    const statusIcons = {
      'Draft': '📝',
      'Pending': '⏳',
      'Confirmed': '✅',
      'Processing': '⚙️',
      'Shipped': '🚚',
      'Delivered': '📦',
      'Cancelled': '❌',
      'Returned': '↩️'
    };
    return statusIcons[status] || '📋';
  },

  // Get priority icon
  getPriorityIcon: (priority) => {
    const priorityIcons = {
      'Low': '🟢',
      'Medium': '🟡',
      'High': '🟠',
      'Urgent': '🔴'
    };
    return priorityIcons[priority] || '⚪';
  },

  // Calculate completion percentage
  getCompletionPercentage: (salesOrder) => {
    if (!salesOrder.items || salesOrder.items.length === 0) return 0;
    
    const totalItems = salesOrder.items.length;
    const completedItems = salesOrder.items.filter(item => 
      item.itemStatus === 'Delivered'
    ).length;
    
    return Math.round((completedItems / totalItems) * 100);
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

  // Get next valid statuses for workflow
  getNextStatuses: (currentStatus) => {
    const statusFlow = {
      'Draft': ['Pending', 'Cancelled'],
      'Pending': ['Confirmed', 'Cancelled'],
      'Confirmed': ['Processing', 'Cancelled'],
      'Processing': ['Shipped', 'Cancelled'],
      'Shipped': ['Delivered', 'Returned'],
      'Delivered': ['Returned'],
      'Cancelled': [],
      'Returned': []
    };
    return statusFlow[currentStatus] || [];
  },

  // Check if order can be edited
  canEdit: (status) => {
    return ['Draft', 'Pending'].includes(status);
  },

  // Check if order can be cancelled
  canCancel: (status) => {
    return ['Draft', 'Pending', 'Confirmed', 'Processing'].includes(status);
  },

  // Check if order can be shipped
  canShip: (status) => {
    return status === 'Processing';
  },

  // Check if order can be delivered
  canDeliver: (status) => {
    return status === 'Shipped';
  },

  // Get available actions for order
  getAvailableActions: (salesOrder) => {
    const actions = [];
    
    // Always show view
    actions.push({ type: 'view', label: 'View', color: 'blue' });
    
    // Update Status for draft, pending, confirmed orders
    if (['Draft', 'Pending', 'Confirmed'].includes(salesOrder.status)) {
      actions.push({ type: 'updateStatus', label: 'Update Status', color: 'green' });
    }
    
    // Edit for draft and pending
    if (salesOrderUtils.canEdit(salesOrder.status)) {
      actions.push({ type: 'edit', label: 'Edit', color: 'gray' });
    }
    
    // Create Challan for processing orders
    if (salesOrder.status === 'Processing') {
      actions.push({ type: 'createChallan', label: 'Create Challan', color: 'teal' });
    }
    
    // Reserve inventory for confirmed orders
    if (salesOrder.status === 'Confirmed') {
      actions.push({ type: 'reserve', label: 'Reserve', color: 'purple' });
    }
    
    // Ship for processing orders
    if (salesOrderUtils.canShip(salesOrder.status)) {
      actions.push({ type: 'ship', label: 'Ship', color: 'orange' });
    }
    
    // Deliver for shipped orders
    if (salesOrderUtils.canDeliver(salesOrder.status)) {
      actions.push({ type: 'deliver', label: 'Deliver', color: 'green' });
    }
    
    // Track for shipped orders
    if (salesOrder.status === 'Shipped' && salesOrder.trackingNumber) {
      actions.push({ type: 'track', label: 'Track', color: 'blue' });
    }
    
    // Cancel for applicable orders
    if (salesOrderUtils.canCancel(salesOrder.status)) {
      actions.push({ type: 'cancel', label: 'Cancel', color: 'red' });
    }
    
    return actions;
  },

  // Format order items summary
  getItemsSummary: (items) => {
    if (!items || items.length === 0) return 'No items';
    
    if (items.length === 1) {
      return `${items[0].productName} (${items[0].orderedQuantity} ${items[0].unit})`;
    } else {
      return `${items.length} items`;
    }
  },

  // Calculate order totals
  calculateTotals: (items, discountPercentage = 0, discountAmount = 0, shippingCharges = 0) => {
    if (!items || items.length === 0) {
      return {
        subtotal: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: 0
      };
    }
    
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.orderedQuantity * item.unitPrice);
    }, 0);
    
    const taxAmount = items.reduce((sum, item) => {
      const itemTotal = item.orderedQuantity * item.unitPrice;
      return sum + (itemTotal * (item.taxRate || 18) / 100);
    }, 0);
    
    const calculatedDiscountAmount = discountPercentage > 0 
      ? (subtotal * discountPercentage) / 100 
      : discountAmount;
    
    const totalAmount = subtotal + taxAmount - calculatedDiscountAmount + shippingCharges;
    
    return {
      subtotal,
      taxAmount,
      discountAmount: calculatedDiscountAmount,
      totalAmount
    };
  }
};

export default salesOrderAPI;
