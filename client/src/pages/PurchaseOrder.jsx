import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, Clock, AlertCircle, Plus, Search, Eye, Edit, XCircle, Trash2 } from 'lucide-react';
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

  // Handle PO creation/update
  const handleCreatePO = async (poData) => {
    try {
      if (selectedPO && selectedPO._id) {
        // Update existing PO
        await purchaseOrderAPI.update(selectedPO._id, poData);
      } else {
        // Create new PO
        await purchaseOrderAPI.create(poData);
      }
      setShowCreatePO(false);
      setSelectedPO(null);
      fetchPurchaseOrders(currentPage, searchTerm, statusFilter);
      fetchStats();
    } catch (err) {
      console.error('Error saving PO:', err);
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

  // Handle order actions (edit, cancel, delete)
  const handleOrderAction = async (action, po) => {
    try {
      switch (action) {
        case 'view':
          handleViewPO(po);
          break;
        case 'edit':
          setSelectedPO(po);
          setShowCreatePO(true);
          break;
        case 'cancel':
          if (confirm('Are you sure you want to cancel this purchase order?')) {
            await purchaseOrderAPI.cancel(po._id, { 
              cancellationReason: 'Cancelled by admin',
              cancelledBy: 'Admin'
            });
            await fetchPurchaseOrders(currentPage, searchTerm, statusFilter);
            await fetchStats();
            alert('Purchase order cancelled successfully');
          }
          break;
        case 'delete':
          if (confirm('Are you sure you want to permanently delete this purchase order? This action cannot be undone.')) {
            await purchaseOrderAPI.delete(po._id);
            await fetchPurchaseOrders(currentPage, searchTerm, statusFilter);
            await fetchStats();
            alert('Purchase order deleted successfully');
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
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold">Purchase Orders (PO)</h1>
            </div>
            <p className="text-orange-100 ml-[52px]">Manage and track purchase orders from suppliers</p>
          </div>
          <button 
            onClick={() => {
              setSelectedPO(null);
              setShowCreatePO(true);
            }}
            className="bg-white text-orange-600 hover:bg-orange-50 px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New PO
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Total POs</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalPOs || 0}</p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center shadow-inner">
              <ClipboardList className="w-7 h-7 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl shadow-sm p-6 border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-orange-600 uppercase tracking-wide">Partially Received</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">
                {getStatusCount('Partially_Received')}
              </p>
            </div>
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center shadow-inner">
              <Clock className="w-7 h-7 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm p-6 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-600 uppercase tracking-wide">Fully Received</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {getStatusCount('Fully_Received')}
              </p>
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center shadow-inner">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search POs by number, supplier, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white"
            >
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Partially_Received">Partially Received</option>
              <option value="Fully_Received">Fully Received</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* PO Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-lg font-semibold text-gray-900">Purchase Orders</h2>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <span className="ml-3 text-gray-600">Loading purchase orders...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => fetchPurchaseOrders(currentPage, searchTerm, statusFilter)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : purchaseOrders.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-600 mb-2">No purchase orders found</p>
            <p className="text-sm text-gray-500 mb-4">Create your first purchase order to get started</p>
            <button 
              onClick={() => {
                setSelectedPO(null);
                setShowCreatePO(true);
              }}
              className="px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-medium flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Create First PO
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      PO Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchaseOrders && purchaseOrders.length > 0 ? (
                    purchaseOrders.map((po) => (
                    <tr key={po._id} className="hover:bg-orange-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{po.poNumber}</div>
                        {poUtils.isOverdue(po.expectedDeliveryDate, po.status) && (
                          <div className="text-xs text-red-600 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3" />
                            Overdue
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{po.supplierDetails?.companyName}</div>
                        <div className="text-xs text-gray-500">{po.supplier?.supplierCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded-lg">
                          {po.category?.categoryName || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {poUtils.formatDate(po.orderDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-lg ${poUtils.getStatusColor(po.status)}`}>
                          {poUtils.formatStatus(po.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOrderAction('view', po)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {po.status === 'Draft' && (
                            <>
                              <button
                                onClick={() => handleOrderAction('edit', po)}
                                className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOrderAction('cancel', po)}
                                className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                                title="Cancel"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {po.status === 'Cancelled' && (
                            <button
                              onClick={() => handleOrderAction('delete', po)}
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
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        No purchase orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newPage = currentPage - 1;
                      setCurrentPage(newPage);
                      fetchPurchaseOrders(newPage, searchTerm, statusFilter);
                    }}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-200">
                    Page {currentPage} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => {
                      const newPage = currentPage + 1;
                      setCurrentPage(newPage);
                      fetchPurchaseOrders(newPage, searchTerm, statusFilter);
                    }}
                    disabled={currentPage === pagination.pages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
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
          onClose={() => {
            setShowCreatePO(false);
            setSelectedPO(null);
          }}
          title={selectedPO ? `Edit Purchase Order - ${selectedPO.poNumber}` : "Create New Purchase Order"}
          size="xl"
        >
          <PurchaseOrderForm
            key={selectedPO ? selectedPO._id : 'new-po'}
            purchaseOrder={selectedPO}
            onSubmit={handleCreatePO}
            onCancel={() => {
              setShowCreatePO(false);
              setSelectedPO(null);
            }}
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
            onClose={() => setShowPODetail(false)}
          />
        </Modal>
      )}

    </div>
  );
};

export default PurchaseOrder;
