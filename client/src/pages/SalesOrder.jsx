import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, CheckCircle, FileEdit, Plus, Search, Eye, Trash2, XCircle } from 'lucide-react';
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
      {/* Page Header with Stats */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold">Sales Orders (SO)</h1>
              </div>
              <p className="text-blue-100 ml-[52px]">Manage customer orders and sales transactions</p>
            </div>
            <button 
              onClick={() => setShowNewOrderModal(true)}
              className="bg-white hover:bg-blue-50 text-blue-600 px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Sales Order
            </button>
          </div>
        </div>

      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl shadow-sm p-6 border border-indigo-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {salesOrderStats?.overview?.totalOrders || 0}
              </p>
            </div>
            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center shadow-inner">
              <ShoppingCart className="w-7 h-7 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm p-6 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-600 uppercase tracking-wide">Completed</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {salesOrderStats?.statusBreakdown?.find(s => s._id === 'Delivered')?.count || 0}
              </p>
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center shadow-inner">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl shadow-sm p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Draft</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {salesOrderStats?.statusBreakdown?.find(s => s._id === 'Draft')?.count || 0}
              </p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center shadow-inner">
              <FileEdit className="w-7 h-7 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search orders, customers, SO numbers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-lg font-semibold text-gray-900">Recent Sales Orders</h2>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading sales orders...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchSalesOrders}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SO Number</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Delivery Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salesOrders && salesOrders.length > 0 ? (
                  salesOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{order.soNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.customerDetails?.companyName || 'Unknown Customer'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded-lg">
                          {order.category?.categoryName || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {salesOrderUtils.formatDate(order.orderDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {salesOrderUtils.formatDate(order.expectedDeliveryDate)}
                        {salesOrderUtils.isOverdue(order.expectedDeliveryDate, order.status) && (
                          <span className="ml-2 text-red-500 text-xs flex items-center gap-1 mt-1">
                            <XCircle className="w-3 h-3" />
                            Overdue
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-lg ${salesOrderUtils.getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOrderAction('view', order)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {order.status === 'Draft' && (
                            <button
                              onClick={() => handleOrderAction('edit', order)}
                              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <FileEdit className="w-4 h-4" />
                            </button>
                          )}
                          {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                            <button
                              onClick={() => handleOrderAction('cancel', order)}
                              className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          {order.status === 'Cancelled' && (
                            <button
                              onClick={() => handleOrderAction('delete', order)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Delete Permanently"
                            >
                              <Trash2 className="w-4 h-4" />
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
                        <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-lg font-medium mb-2">No sales orders found</p>
                        <p className="text-sm text-gray-500 mb-4">Create your first sales order to get started</p>
                        <button 
                          onClick={() => setShowNewOrderModal(true)}
                          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                        >
                          <Plus className="w-5 h-5" />
                          New Sales Order
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
