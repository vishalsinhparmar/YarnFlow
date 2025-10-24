import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesOrderAPI, salesOrderUtils } from '../services/salesOrderAPI';
import NewSalesOrderModal from '../components/SalesOrders/NewSalesOrderModal';
import SalesOrderDetailModal from '../components/SalesOrders/SalesOrderDetailModal';
import ShipOrderModal from '../components/ShipOrderModal';
import StatusUpdateModal from '../components/StatusUpdateModal';

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
  const [showShipModal, setShowShipModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
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
        case 'updateStatus':
          setSelectedOrder(order);
          setShowStatusModal(true);
          break;
        case 'createChallan':
          // Navigate to Sales Challan page with pre-selected order
          navigate('/sales-challan', { state: { selectedOrderId: order._id } });
          break;
        case 'ship':
          setSelectedOrder(order);
          setShowShipModal(true);
          break;
        case 'reserve':
          await salesOrderAPI.reserveInventory(order._id, 'Admin');
          await fetchSalesOrders();
          alert('Inventory reserved successfully');
          break;
        case 'deliver':
          await salesOrderAPI.markDelivered(order._id, { deliveredBy: 'Admin' });
          await fetchSalesOrders();
          await fetchStats();
          alert('Order marked as delivered');
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
        case 'track':
          if (order.trackingNumber) {
            alert(`Tracking Number: ${order.trackingNumber}\nCourier: ${order.courierCompany}`);
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
    setShowShipModal(false);
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
          <button 
            onClick={() => setShowNewOrderModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            + New Sales Order
          </button>
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
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {salesOrderStats?.statusBreakdown?.find(s => s._id === 'Pending')?.count || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-yellow-600 text-xl">⏳</span>
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
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                {salesOrderUtils.formatCurrency(salesOrderStats?.overview?.totalRevenue || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xl">💰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Pipeline */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Pipeline</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-600 text-xl">📝</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Draft</p>
            <p className="text-2xl font-bold text-blue-600">
              {salesOrderStats?.statusBreakdown?.find(s => s._id === 'Draft')?.count || 0}
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-yellow-600 text-xl">⏳</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {salesOrderStats?.statusBreakdown?.find(s => s._id === 'Pending')?.count || 0}
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-purple-600 text-xl">🏭</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Processing</p>
            <p className="text-2xl font-bold text-purple-600">
              {salesOrderStats?.statusBreakdown?.find(s => s._id === 'Processing')?.count || 0}
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-orange-600 text-xl">🚚</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Shipping</p>
            <p className="text-2xl font-bold text-orange-600">
              {salesOrderStats?.statusBreakdown?.find(s => s._id === 'Shipped')?.count || 0}
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-green-600 text-xl">✅</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Delivered</p>
            <p className="text-2xl font-bold text-green-600">
              {salesOrderStats?.statusBreakdown?.find(s => s._id === 'Delivered')?.count || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search orders, customers, SO numbers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
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
                          {salesOrderUtils.getAvailableActions(order).map((action, index) => (
                            <button
                              key={index}
                              onClick={() => handleOrderAction(action.type, order)}
                              className={`text-${action.color}-600 hover:text-${action.color}-900 text-xs px-2 py-1 rounded border border-${action.color}-200 hover:bg-${action.color}-50`}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
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

      {showShipModal && selectedOrder && (
        <ShipOrderModal
          isOpen={showShipModal}
          onClose={handleModalClose}
          order={selectedOrder}
        />
      )}

      {showStatusModal && selectedOrder && (
        <StatusUpdateModal
          isOpen={showStatusModal}
          onClose={() => {
            setShowStatusModal(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
        />
      )}
    </div>
  );
};

export default SalesOrder;
