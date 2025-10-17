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

  const workflowMetrics = dashboardData?.workflowMetrics || {};
  const keyMetrics = dashboardData?.keyMetrics || {};
  const recentActivity = dashboardData?.recentActivity || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">YarnFlow Dashboard</h1>
        <p className="text-gray-600">Complete Textile Supply Chain Management Overview</p>
      </div>

      {/* Workflow Process Flow */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Supply Chain Workflow</h2>
          {lastUpdated && (
            <div className="flex items-center text-xs text-gray-500">
              <span className="mr-1">🕒</span>
              Last updated: {dashboardUtils.getRelativeTime(lastUpdated)}
            </div>
          )}
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
          
          {/* Supplier */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
              <span className="text-purple-600 text-xl">🏭</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Supplier</p>
            <p className="text-xs text-gray-500">{dashboardUtils.formatNumber(workflowMetrics.suppliers || 0)} Active</p>
          </div>
          
          <div className="text-gray-400">→</div>
          
          {/* Purchase Order */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
              <span className="text-blue-600 text-xl">🛒</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Purchase Order</p>
            <p className="text-xs text-gray-500">{dashboardUtils.formatNumber(workflowMetrics.purchaseOrders || 0)} Active</p>
          </div>
          
          <div className="text-gray-400">→</div>
          
          {/* GRN */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-2">
              <span className="text-green-600 text-xl">📋</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Goods Receipt</p>
            <p className="text-xs text-gray-500">{dashboardUtils.formatNumber(workflowMetrics.goodsReceipt || 0)} Processed</p>
          </div>
          
          <div className="text-gray-400">→</div>
          
          {/* Inventory */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-lg flex items-center justify-center mb-2">
              <span className="text-yellow-600 text-xl">📦</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Inventory Lots</p>
            <p className="text-xs text-gray-500">{dashboardUtils.formatNumber(workflowMetrics.inventoryLots || 0)} Bags</p>
          </div>
          
          <div className="text-gray-400">→</div>
          
          {/* Sales Order */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center mb-2">
              <span className="text-indigo-600 text-xl">📄</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Sales Order</p>
            <p className="text-xs text-gray-500">{dashboardUtils.formatNumber(workflowMetrics.salesOrders || 0)} Orders</p>
          </div>
          
          <div className="text-gray-400">→</div>
          
          {/* Sales Challan */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-teal-100 rounded-lg flex items-center justify-center mb-2">
              <span className="text-teal-600 text-xl">🚚</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Sales Challan</p>
            <p className="text-xs text-gray-500">{dashboardUtils.formatNumber(workflowMetrics.salesChallans || 0)} Dispatched</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Inventory</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardUtils.formatNumber(keyMetrics.totalInventory?.value || 0)}
              </p>
              <div className="flex items-center space-x-2">
                <p className="text-xs text-gray-500">{keyMetrics.totalInventory?.unit || 'Bags/Rolls'}</p>
                {keyMetrics.totalInventory?.change && (
                  <span className={`text-xs ${dashboardUtils.getTrendColor(keyMetrics.totalInventory.trend)}`}>
                    {keyMetrics.totalInventory.change}
                  </span>
                )}
              </div>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-yellow-600 text-xl">📦</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cotton Yarn Stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardUtils.formatNumber(keyMetrics.cottonYarnStock?.value || 0)}
              </p>
              <div className="flex items-center space-x-2">
                <p className="text-xs text-gray-500">{keyMetrics.cottonYarnStock?.unit || 'Bags Available'}</p>
                {keyMetrics.cottonYarnStock?.change && (
                  <span className={`text-xs ${dashboardUtils.getTrendColor(keyMetrics.cottonYarnStock.trend)}`}>
                    {keyMetrics.cottonYarnStock.change}
                  </span>
                )}
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xl">🧶</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Polyester Rolls</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardUtils.formatNumber(keyMetrics.polyesterRolls?.value || 0)}
              </p>
              <div className="flex items-center space-x-2">
                <p className="text-xs text-gray-500">{keyMetrics.polyesterRolls?.unit || 'Rolls in Stock'}</p>
                {keyMetrics.polyesterRolls?.change && (
                  <span className={`text-xs ${dashboardUtils.getTrendColor(keyMetrics.polyesterRolls.trend)}`}>
                    {keyMetrics.polyesterRolls.change}
                  </span>
                )}
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">🎯</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardUtils.formatCurrency(keyMetrics.monthlyRevenue?.value || 0)}
              </p>
              <div className="flex items-center space-x-2">
                <p className="text-xs text-gray-500">{keyMetrics.monthlyRevenue?.unit || 'This Month'}</p>
                {keyMetrics.monthlyRevenue?.change && (
                  <span className={`text-xs ${dashboardUtils.getTrendColor(keyMetrics.monthlyRevenue.trend)}`}>
                    {keyMetrics.monthlyRevenue.change}
                  </span>
                )}
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-xl">💰</span>
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
