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

  // Get dispatched quantities for a sales order
  getDispatchedQuantities: async (salesOrderId) => {
    return apiRequest(`/sales-challans/dispatched/${salesOrderId}`);
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
  },

  // Generate PDF (download)
  generatePDF: async (id) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3050/api';
    const url = `${API_BASE_URL}/sales-challans/${id}/pdf/download`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get the blob
      const blob = await response.blob();
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `Sales_Challan_${id}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      return { success: true, message: 'PDF downloaded successfully' };
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  },

  // Preview PDF (open in new tab)
  previewPDF: async (id) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3050/api';
    const url = `${API_BASE_URL}/sales-challans/${id}/pdf/preview`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to preview PDF');
      }

      // Get the blob
      const blob = await response.blob();
      
      // Create object URL and open in new tab
      const pdfUrl = window.URL.createObjectURL(blob);
      window.open(pdfUrl, '_blank');
      
      // Clean up after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(pdfUrl);
      }, 100);

      return { success: true, message: 'PDF preview opened' };
    } catch (error) {
      console.error('Error previewing PDF:', error);
      throw error;
    }
  },

  // Generate Consolidated PDF for SO (download)
  generateConsolidatedPDF: async (soId) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3050/api';
    const url = `${API_BASE_URL}/sales-challans/so/${soId}/pdf/download`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate consolidated PDF');
      }

      // Get the blob
      const blob = await response.blob();
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `SO_Consolidated_${soId}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      return { success: true, message: 'Consolidated PDF downloaded successfully' };
    } catch (error) {
      console.error('Error downloading consolidated PDF:', error);
      throw error;
    }
  },

  // Preview Consolidated PDF for SO (open in new tab)
  previewConsolidatedPDF: async (soId) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3050/api';
    const url = `${API_BASE_URL}/sales-challans/so/${soId}/pdf/preview`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to preview consolidated PDF');
      }

      // Get the blob
      const blob = await response.blob();
      
      // Create object URL and open in new tab
      const pdfUrl = window.URL.createObjectURL(blob);
      window.open(pdfUrl, '_blank');
      
      // Clean up after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(pdfUrl);
      }, 100);

      return { success: true, message: 'Consolidated PDF preview opened' };
    } catch (error) {
      console.error('Error previewing consolidated PDF:', error);
      throw error;
    }
  }
};

// ============ SALES CHALLAN UTILITIES ============
export const salesChallanUtils = {
  // Format status for display
  formatStatus: (status) => {
    const statusMap = {
      'Prepared': 'Prepared',
      'Dispatched': 'Dispatched',
      'Delivered': 'Delivered',
      'Cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  },

  // Get status color
  getStatusColor: (status) => {
    const colorMap = {
      'Prepared': 'bg-blue-100 text-blue-800',
      'Dispatched': 'bg-orange-100 text-orange-800',
      'Delivered': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-gray-100 text-gray-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  },

  // Check if challan can be updated
  canUpdate: (status) => {
    return !['Delivered', 'Cancelled'].includes(status);
  },

  // Check if challan can be deleted
  canDelete: (status) => {
    return status === 'Prepared';
  },

  // Get next possible statuses
  getNextStatuses: (currentStatus) => {
    const statusFlow = {
      'Prepared': ['Dispatched', 'Cancelled'],
      'Dispatched': ['Delivered', 'Cancelled'],
      'Delivered': [],
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
    
    // Edit action (only for prepared)
    if (challan.status === 'Prepared') {
      actions.push({ type: 'edit', label: 'Edit', color: 'yellow' });
    }
    
    // Track action (for dispatched and delivered)
    if (['Dispatched', 'Delivered'].includes(challan.status)) {
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
