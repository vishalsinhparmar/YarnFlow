import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { salesChallanAPI, salesChallanUtils } from '../services/salesChallanAPI';
import CreateChallanModal from '../components/CreateChallanModal';
import ChallanDetailModal from '../components/ChallanDetailModal';
import ChallanStatusUpdateModal from '../components/ChallanStatusUpdateModal';

const SalesChallan = () => {
  const location = useLocation();
  const [challans, setChallans] = useState([]);
  const [stats, setStats] = useState({
    overview: {
      totalChallans: 0,
      thisMonth: 0,
      inTransit: 0,
      deliveredThisMonth: 0
    },
    statusBreakdown: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchAllData();
    
    // Auto-open create modal if navigated from Sales Order
    if (location.state?.selectedOrderId) {
      setShowCreateModal(true);
    }
  }, [currentPage, searchTerm, statusFilter, location.state]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats and challans in parallel
      const [statsRes, challansRes] = await Promise.all([
        salesChallanAPI.getStats(),
        salesChallanAPI.getAll({
          page: currentPage,
          limit: 10,
          search: searchTerm,
          status: statusFilter
        })
      ]);

      if (statsRes.success) {
        setStats(statsRes?.data || {
          overview: {
            totalChallans: 0,
            thisMonth: 0,
            inTransit: 0,
            deliveredThisMonth: 0
          },
          statusBreakdown: []
        });
      } else {
        // Set fallback stats on API failure
        setStats({
          overview: {
            totalChallans: 0,
            thisMonth: 0,
            inTransit: 0,
            deliveredThisMonth: 0
          },
          statusBreakdown: []
        });
      }

      if (challansRes.success) {
        setChallans(challansRes.data);
        setPagination(challansRes.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle challan creation
  const handleCreateChallan = async (challanData) => {
    try {
      await salesChallanAPI.create(challanData);
      setShowCreateModal(false);
      fetchAllData(); // Refresh data
    } catch (err) {
      console.error('Error creating challan:', err);
      throw err;
    }
  };

  // Handle status update
  const handleStatusUpdate = async (challanId, statusData) => {
    try {
      await salesChallanAPI.updateStatus(challanId, statusData);
      setShowStatusModal(false);
      fetchAllData(); // Refresh data
      
      // Update selected challan if it's the one being updated
      if (selectedChallan && selectedChallan._id === challanId) {
        const updatedChallan = await salesChallanAPI.getById(challanId);
        setSelectedChallan(updatedChallan.data);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      throw err;
    }
  };

  // Handle challan action
  const handleChallanAction = async (action, challan) => {
    switch (action.type) {
      case 'view':
        setSelectedChallan(challan);
        setShowDetailModal(true);
        break;
      case 'updateStatus':
        setSelectedChallan(challan);
        setShowStatusModal(true);
        break;
      case 'track':
        // Open tracking modal or navigate to tracking page
        window.open(`/track/${challan.challanNumber}`, '_blank');
        break;
      case 'print':
        // Handle print functionality
        window.print();
        break;
      case 'delete':
        if (window.confirm('Are you sure you want to delete this challan?')) {
          try {
            await salesChallanAPI.delete(challan._id);
            fetchAllData();
          } catch (err) {
            alert('Failed to delete challan: ' + err.message);
          }
        }
        break;
      default:
        break;
    }
  };

  // Get status breakdown for overview
  const getStatusCount = (status) => {
    const statusData = stats?.statusBreakdown?.find(s => s._id === status);
    return statusData ? statusData.count : 0;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sales Challan</h1>
            <p className="text-gray-600">Manage delivery challans and shipment documents</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            + New Challan
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Challans</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.overview?.totalChallans || 0}</p>
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <span className="text-teal-600 text-xl">🚚</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Transit</p>
              <p className="text-2xl font-bold text-orange-600">{stats?.overview?.inTransit || 0}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-xl">🚛</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-green-600">{stats?.overview?.deliveredThisMonth || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-blue-600">{stats?.overview?.thisMonth || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">📅</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Status Overview */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Status Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-600 text-2xl">📋</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Prepared</p>
            <p className="text-xl font-bold text-blue-600">{getStatusCount('Prepared')}</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-yellow-600 text-2xl">📦</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Packed</p>
            <p className="text-xl font-bold text-yellow-600">{getStatusCount('Packed')}</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-orange-600 text-2xl">🚚</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Dispatched</p>
            <p className="text-xl font-bold text-orange-600">{getStatusCount('Dispatched')}</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-green-600 text-2xl">🏠</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Delivered</p>
            <p className="text-xl font-bold text-green-600">{getStatusCount('Delivered')}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search challans by number, SO reference, customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Status</option>
              <option value="Prepared">Prepared</option>
              <option value="Packed">Packed</option>
              <option value="Dispatched">Dispatched</option>
              <option value="In_Transit">In Transit</option>
              <option value="Out_for_Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Returned">Returned</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sales Challans Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Sales Challans</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            <p className="mt-2 text-gray-600">Loading challans...</p>
          </div>
        ) : challans.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No challans found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Challan No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SO Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dispatch Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle No.
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
                {challans.map((challan) => (
                  <tr key={challan._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {challan.challanNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {challan.soReference}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {challan.customerDetails?.companyName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {salesChallanUtils.formatDate(challan.challanDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {challan.transportDetails?.vehicleNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${salesChallanUtils.getStatusColor(challan.status)}`}>
                        {salesChallanUtils.formatStatus(challan.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {salesChallanUtils.getAvailableActions(challan).map((action, index) => (
                          <button
                            key={index}
                            onClick={() => handleChallanAction(action, challan)}
                            className={`text-${action.color}-600 hover:text-${action.color}-900 text-sm`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
              {pagination.totalItems} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded text-sm">
                {currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateChallanModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateChallan}
          preSelectedOrderId={location.state?.selectedOrderId}
        />
      )}

      {showDetailModal && selectedChallan && (
        <ChallanDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          challan={selectedChallan}
          onStatusUpdate={(statusData) => handleStatusUpdate(selectedChallan._id, statusData)}
        />
      )}

      {showStatusModal && selectedChallan && (
        <ChallanStatusUpdateModal
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          challan={selectedChallan}
          onSubmit={(statusData) => handleStatusUpdate(selectedChallan._id, statusData)}
        />
      )}
    </div>
  );
};

export default SalesChallan;
