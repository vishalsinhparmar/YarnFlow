import React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { dashboardUtils } from '../services/dashboardAPI';

const Dashboard = () => {
  const {
    dashboardData,
    realtimeMetrics,
    loading,
    error,
    lastUpdated,
    refreshDashboard,
    clearError
  } = useDashboard(true, 30000); // Auto-refresh every 30 seconds

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-red-500 text-xl mr-3">⚠️</span>
            <div>
              <h3 className="text-red-800 font-semibold">Error Loading Dashboard</h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
          <button
            onClick={() => {
              clearError();
              refreshDashboard();
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const summary = dashboardData?.summary || {};
  const recentActivity = dashboardData?.recentActivity || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">YarnFlow Dashboard</h1>
        <p className="text-gray-600">Complete Textile Supply Chain Management Overview</p>
      </div>

      {/* Master Data Statistics */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Master Data Overview</h2>
          {lastUpdated && (
            <div className="flex items-center text-xs text-gray-500">
              <span className="mr-1">🕒</span>
              Last updated: {dashboardUtils.getRelativeTime(lastUpdated)}
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total Categories */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 mb-1">Total Categories</p>
                <p className="text-3xl font-bold text-purple-900">
                  {dashboardUtils.formatNumber(summary.totalCategories || 0)}
                </p>
              </div>
              <div className="w-14 h-14 bg-purple-200 rounded-full flex items-center justify-center">
                <span className="text-purple-700 text-2xl">📁</span>
              </div>
            </div>
          </div>

          {/* Total Products */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Total Products</p>
                <p className="text-3xl font-bold text-blue-900">
                  {dashboardUtils.formatNumber(summary.totalProducts || 0)}
                </p>
              </div>
              <div className="w-14 h-14 bg-blue-200 rounded-full flex items-center justify-center">
                <span className="text-blue-700 text-2xl">📦</span>
              </div>
            </div>
          </div>

          {/* Total Suppliers */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">Total Suppliers</p>
                <p className="text-3xl font-bold text-green-900">
                  {dashboardUtils.formatNumber(summary.totalSuppliers || 0)}
                </p>
              </div>
              <div className="w-14 h-14 bg-green-200 rounded-full flex items-center justify-center">
                <span className="text-green-700 text-2xl">🏭</span>
              </div>
            </div>
          </div>

          {/* Total Customers */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 mb-1">Total Customers</p>
                <p className="text-3xl font-bold text-orange-900">
                  {dashboardUtils.formatNumber(summary.totalCustomers || 0)}
                </p>
              </div>
              <div className="w-14 h-14 bg-orange-200 rounded-full flex items-center justify-center">
                <span className="text-orange-700 text-2xl">👥</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <button
            onClick={refreshDashboard}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div className="space-y-4">
          {recentActivity && recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${dashboardUtils.getActivityStatusColor(activity.status)}`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500">
                    {activity.description} - {dashboardUtils.getRelativeTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
