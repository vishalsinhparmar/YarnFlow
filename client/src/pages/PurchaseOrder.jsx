import React, { useState, useEffect } from 'react';
import { purchaseOrderAPI, poUtils } from '../services/purchaseOrderAPI';
import Modal from '../components/model/Modal';
import PurchaseOrderForm from '../components/PurchaseOrders/PurchaseOrderForm';
import PurchaseOrderDetail from '../components/PurchaseOrders/PurchaseOrderDetail';

const PurchaseOrder = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [stats, setStats] = useState({
    totalPOs: 0,
    statusBreakdown: [],
    overduePOs: 0,
    monthlyValue: 0,
    pendingApprovals: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showCreatePO, setShowCreatePO] = useState(false);
  const [showPODetail, setShowPODetail] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Fetch PO statistics
  const fetchStats = async () => {
    try {
      const response = await purchaseOrderAPI.getStats();
      setStats(response?.data || {
        totalPOs: 0,
        statusBreakdown: [],
        overduePOs: 0,
        monthlyValue: 0,
        pendingApprovals: 0
      });
    } catch (err) {
      console.error('Error fetching PO stats:', err);
      // Set fallback stats on error
      setStats({
        totalPOs: 0,
        statusBreakdown: [],
        overduePOs: 0,
        monthlyValue: 0,
        pendingApprovals: 0
      });
    }
  };

  // Fetch purchase orders
  const fetchPurchaseOrders = async (page = 1, search = '', status = '') => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        ...(search && { search }),
        ...(status && { status })
      };
      
      const response = await purchaseOrderAPI.getAll(params);
      setPurchaseOrders(response.data);
      setPagination(response.pagination);
      setError(null);
    } catch (err) {
      setError('Failed to fetch purchase orders');
      console.error('Error fetching POs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchStats();
    fetchPurchaseOrders();
  }, []);

  // Handle search and filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPurchaseOrders(1, searchTerm, statusFilter);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  // Handle PO creation
  const handleCreatePO = async (poData) => {
    try {
      await purchaseOrderAPI.create(poData);
      setShowCreatePO(false);
      fetchPurchaseOrders(currentPage, searchTerm, statusFilter);
      fetchStats();
    } catch (err) {
      console.error('Error creating PO:', err);
      throw err;
    }
  };

  // Handle status update
  const handleStatusUpdate = async (poId, newStatus, notes = '') => {
    try {
      await purchaseOrderAPI.updateStatus(poId, newStatus, notes);
      fetchPurchaseOrders(currentPage, searchTerm, statusFilter);
      fetchStats();
      if (selectedPO && selectedPO._id === poId) {
        const updatedPO = await purchaseOrderAPI.getById(poId);
        setSelectedPO(updatedPO.data);
      }
    } catch (err) {
      console.error('Error updating PO status:', err);
      alert('Failed to update PO status');
    }
  };


  // View PO details
  const handleViewPO = async (po) => {
    try {
      const response = await purchaseOrderAPI.getById(po._id);
      setSelectedPO(response.data);
      setShowPODetail(true);
    } catch (err) {
      console.error('Error fetching PO details:', err);
      alert('Failed to load PO details');
    }
  };

  // Get status counts for display
  const getStatusCount = (status) => {
    const statusItem = stats?.statusBreakdown?.find(item => item._id === status);
    return statusItem ? statusItem.count : 0;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Purchase Orders (PO)</h1>
            <p className="text-gray-600">Manage and track purchase orders from suppliers</p>
          </div>
          <button 
            onClick={() => setShowCreatePO(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            + New PO
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total POs</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalPOs || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">📋</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Partially Received</p>
              <p className="text-2xl font-bold text-orange-600">
                {getStatusCount('Partially_Received')}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-xl">📦</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Fully Received</p>
              <p className="text-2xl font-bold text-green-600">
                {getStatusCount('Fully_Received')}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xl">✅</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search POs by number, supplier, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Partially_Received">Partially Received</option>
              <option value="Fully_Received">Fully Received</option>
            </select>
          </div>
        </div>
      </div>

      {/* PO Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Purchase Orders</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading purchase orders...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => fetchPurchaseOrders(currentPage, searchTerm, statusFilter)}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : purchaseOrders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No purchase orders found</p>
            <button 
              onClick={() => setShowCreatePO(true)}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create First PO
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PO Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchaseOrders && purchaseOrders.length > 0 ? (
                    purchaseOrders.map((po) => (
                    <tr key={po._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{po.poNumber}</div>
                        {poUtils.isOverdue(po.expectedDeliveryDate, po.status) && (
                          <div className="text-xs text-red-600">Overdue</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{po.supplierDetails?.companyName}</div>
                        <div className="text-xs text-gray-500">{po.supplier?.supplierCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {po.category?.categoryName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {poUtils.formatDate(po.orderDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${poUtils.getStatusColor(po.status)}`}>
                          {poUtils.formatStatus(po.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleViewPO(po)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View
                        </button>
                        {po.status === 'Sent' && (
                          <button 
                            onClick={() => handleStatusUpdate(po._id, 'Approved')}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                        No purchase orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      const newPage = currentPage - 1;
                      setCurrentPage(newPage);
                      fetchPurchaseOrders(newPage, searchTerm, statusFilter);
                    }}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Page {currentPage} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => {
                      const newPage = currentPage + 1;
                      setCurrentPage(newPage);
                      fetchPurchaseOrders(newPage, searchTerm, statusFilter);
                    }}
                    disabled={currentPage === pagination.pages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showCreatePO && (
        <Modal
          isOpen={showCreatePO}
          onClose={() => setShowCreatePO(false)}
          title="Create New Purchase Order"
          size="xl"
        >
          <PurchaseOrderForm
            onSubmit={handleCreatePO}
            onCancel={() => setShowCreatePO(false)}
          />
        </Modal>
      )}

      {showPODetail && selectedPO && (
        <Modal
          isOpen={showPODetail}
          onClose={() => setShowPODetail(false)}
          title={`Purchase Order - ${selectedPO.poNumber}`}
          size="xl"
        >
          <PurchaseOrderDetail
            purchaseOrder={selectedPO}
            onStatusUpdate={handleStatusUpdate}
            onClose={() => setShowPODetail(false)}
          />
        </Modal>
      )}

    </div>
  );
};

export default PurchaseOrder;
