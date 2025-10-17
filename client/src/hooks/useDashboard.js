import { useState, useEffect, useCallback } from 'react';
import dashboardAPI, { handleDashboardError } from '../services/dashboardAPI';

// Custom hook for Dashboard data management
export const useDashboard = (autoRefresh = false, refreshInterval = null) => {
  // Use production-optimized refresh interval
  const config = dashboardAPI.getConfig();
  const actualRefreshInterval = refreshInterval || config.refreshInterval;
  const [dashboardData, setDashboardData] = useState(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch dashboard statistics
  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getStats();
      setDashboardData(response.data);
      setLastUpdated(new Date());
      setError(null);
      return response;
    } catch (err) {
      const errorMessage = handleDashboardError(err, 'Failed to fetch dashboard statistics');
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch real-time metrics
  const fetchRealtimeMetrics = useCallback(async () => {
    try {
      // Temporarily disable realtime metrics for production until backend is redeployed
      if (window.location.hostname !== 'localhost') {
        console.log('Realtime metrics disabled in production until backend redeploy');
        return null;
      }
      
      const response = await dashboardAPI.getRealtimeMetrics();
      setRealtimeMetrics(response.data);
      setError(null);
      return response;
    } catch (err) {
      const errorMessage = handleDashboardError(err, 'Failed to fetch real-time metrics');
      console.warn('Realtime metrics error (expected until backend redeploy):', errorMessage);
      // Don't set error for realtime metrics to avoid dashboard disruption
      return null;
    }
  }, []);

  // Refresh all dashboard data
  const refreshDashboard = useCallback(async () => {
    await Promise.all([
      fetchDashboardStats(),
      fetchRealtimeMetrics()
    ]);
  }, [fetchDashboardStats, fetchRealtimeMetrics]);

  // Initialize dashboard data on mount
  useEffect(() => {
    fetchDashboardStats();
    fetchRealtimeMetrics();
  }, [fetchDashboardStats, fetchRealtimeMetrics]);

  // Set up auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchRealtimeMetrics(); // Only refresh real-time metrics for performance
    }, actualRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, actualRefreshInterval, fetchRealtimeMetrics]);

  return {
    // Data
    dashboardData,
    realtimeMetrics,
    
    // State
    loading,
    error,
    lastUpdated,
    
    // Actions
    fetchDashboardStats,
    fetchRealtimeMetrics,
    refreshDashboard,
    
    // Clear error
    clearError: () => setError(null)
  };
};

export default useDashboard;
