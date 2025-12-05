// Dashboard API Service for YarnFlow Frontend
import { apiRequest } from './common.js';

// Production configuration
const DASHBOARD_CONFIG = {
  refreshInterval: import.meta?.env?.VITE_DASHBOARD_REFRESH_INTERVAL || 30000,
  apiTimeout: import.meta?.env?.VITE_API_TIMEOUT || 5000,
  retryAttempts: 3,
  retryDelay: 1000
};

// Dashboard API endpoints with production optimizations
const dashboardAPI = {
  // Get comprehensive dashboard statistics
  getStats: async (retryCount = 0) => {
    try {
      return await apiRequest('/dashboard/stats', {
        timeout: DASHBOARD_CONFIG.apiTimeout,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
    } catch (error) {
      // Retry logic for production reliability
      if (retryCount < DASHBOARD_CONFIG.retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, DASHBOARD_CONFIG.retryDelay));
        return dashboardAPI.getStats(retryCount + 1);
      }
      throw error;
    }
  },

  // Get real-time metrics for auto-refresh
  getRealtimeMetrics: async (retryCount = 0) => {
    try {
      return await apiRequest('/dashboard/realtime', {
        timeout: DASHBOARD_CONFIG.apiTimeout / 2, // Faster timeout for real-time data
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
    } catch (error) {
      // Retry logic for real-time data
      if (retryCount < 2) { // Fewer retries for real-time data
        await new Promise(resolve => setTimeout(resolve, 500));
        return dashboardAPI.getRealtimeMetrics(retryCount + 1);
      }
      throw error;
    }
  },

  // Configuration getter
  getConfig: () => DASHBOARD_CONFIG
};

// Utility functions for dashboard data
export const dashboardUtils = {
  // Format numbers with commas
  formatNumber: (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  },

  // Get relative time string
  getRelativeTime: (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  },

  // Get activity status color
  getActivityStatusColor: (status) => {
    const colors = {
      info: 'bg-blue-500',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  }
};

// Error handling helper
export const handleDashboardError = (error, fallbackMessage = 'Dashboard operation failed') => {
  console.error('Dashboard API Error:', error);
  
  if (error.message) {
    return error.message;
  }
  
  return fallbackMessage;
};

export default dashboardAPI;
