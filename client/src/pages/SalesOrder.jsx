import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesOrderAPI, salesOrderUtils } from '../services/salesOrderAPI';
import NewSalesOrderModal from '../components/SalesOrders/NewSalesOrderModal';
import SalesOrderDetailModal from '../components/SalesOrders/SalesOrderDetailModal';

const SalesOrder = () => {
  const navigate = useNavigate();
  
  // State management
  const [salesOrders, setSalesOrders] = useState([]);
  const [salesOrderStats, setSalesOrderStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Filter and pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch sales orders
  const fetchSalesOrders = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter
      };
      
      const response = await salesOrderAPI.getAll(params);
      setSalesOrders(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setError(null);
    } catch (err) {
      console.error('Error fetching sales orders:', err);
      setError('Failed to fetch sales orders');
      setSalesOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await salesOrderAPI.getStats();
      setSalesOrderStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchSalesOrders();
    fetchStats();
  }, [currentPage, searchTerm, statusFilter]);

  // Handle order actions
  const handleOrderAction = async (action, order) => {
    try {
      switch (action) {
        case 'view':
          setSelectedOrder(order);
          setShowDetailModal(true);
          break;
        case 'edit':
          setSelectedOrder(order);
          setShowNewOrderModal(true);
          break;
        case 'cancel':
          if (confirm('Are you sure you want to cancel this order?')) {
            await salesOrderAPI.cancel(order._id, { 
              cancellationReason: 'Cancelled by admin',
              cancelledBy: 'Admin'
            });
            await fetchSalesOrders();
            await fetchStats();
            alert('Order cancelled successfully');
          }
          break;
        case 'delete':
          if (confirm('Are you sure you want to permanently delete this cancelled order? This action cannot be undone.')) {
            await salesOrderAPI.delete(order._id);
            await fetchSalesOrders();
            await fetchStats();
            alert('Order deleted successfully');
          }
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Error performing action:', err);
      alert('Failed to perform action');
    }
  };

  // Handle modal close and refresh
  const handleModalClose = () => {
    setShowNewOrderModal(false);
    setShowDetailModal(false);
    setSelectedOrder(null);
    fetchSalesOrders();
    fetchStats();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sales Orders (SO)</h1>
            <p className="text-gray-600">Manage customer orders and sales transactions</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowNewOrderModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              + New Sales Order
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {salesOrderStats?.overview?.totalOrders || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <span className="text-indigo-600 text-xl">📄</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {salesOrderStats?.statusBreakdown?.find(s => s._id === 'Delivered')?.count || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Draft</p>
              <p className="text-2xl font-bold text-blue-600">
                {salesOrderStats?.statusBreakdown?.find(s => s._id === 'Draft')?.count || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">📝</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search orders, customers, SO numbers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                statusFilter === '' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('Draft')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                statusFilter === 'Draft' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Draft
            </button>
            <button
              onClick={() => setStatusFilter('Delivered')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                statusFilter === 'Delivered' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Delivered
            </button>
            <button
              onClick={() => setStatusFilter('Cancelled')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                statusFilter === 'Cancelled' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>
      </div>

      {/* Sales Orders Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Sales Orders</h2>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading sales orders...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchSalesOrders}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SO Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salesOrders && salesOrders.length > 0 ? (
                  salesOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.soNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.customerDetails?.companyName || 'Unknown Customer'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.category?.categoryName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {salesOrderUtils.formatDate(order.orderDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {salesOrderUtils.formatDate(order.expectedDeliveryDate)}
                        {salesOrderUtils.isOverdue(order.expectedDeliveryDate, order.status) && (
                          <span className="ml-1 text-red-500 text-xs">⚠️ Overdue</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${salesOrderUtils.getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleOrderAction('view', order)}
                            className="text-blue-600 hover:text-blue-900 text-xs px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
                          >
                            View
                          </button>
                          {order.status === 'Draft' && (
                            <button
                              onClick={() => handleOrderAction('edit', order)}
                              className="text-green-600 hover:text-green-900 text-xs px-2 py-1 rounded border border-green-200 hover:bg-green-50"
                            >
                              Edit
                            </button>
                          )}
                          {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                            <button
                              onClick={() => handleOrderAction('cancel', order)}
                              className="text-orange-600 hover:text-orange-900 text-xs px-2 py-1 rounded border border-orange-200 hover:bg-orange-50"
                            >
                              Cancel
                            </button>
                          )}
                          {order.status === 'Cancelled' && (
                            <button
                              onClick={() => handleOrderAction('delete', order)}
                              className="text-red-600 hover:text-red-900 text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50"
                              title="Permanently delete this cancelled order"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <span className="text-4xl mb-4">📋</span>
                        <p className="text-lg font-medium mb-2">No sales orders found</p>
                        <p className="text-sm">Create your first sales order to get started</p>
                        <button 
                          onClick={() => setShowNewOrderModal(true)}
                          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                        >
                          + New Sales Order
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewOrderModal && (
        <NewSalesOrderModal
          isOpen={showNewOrderModal}
          onClose={handleModalClose}
          order={selectedOrder}
        />
      )}

      {showDetailModal && selectedOrder && (
        <SalesOrderDetailModal
          isOpen={showDetailModal}
          onClose={handleModalClose}
          order={selectedOrder}
        />
      )}

    </div>
  );
};

export default SalesOrder;
