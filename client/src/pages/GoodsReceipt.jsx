import React, { useState, useEffect } from 'react';
import { grnAPI, grnUtils } from '../services/grnAPI';
import Modal from '../components/model/Modal';
import GRNForm from '../components/GRN/GRNForm';
import GRNDetail from '../components/GRN/GRNDetail';
import GRNQualityCheck from '../components/GRN/GRNQualityCheck';

const GoodsReceipt = () => {
  const [grns, setGRNs] = useState([]);
  const [stats, setStats] = useState({
    totalGRNs: 0,
    statusBreakdown: [],
    pendingReview: 0,
    thisMonth: 0,
    monthlyValue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showCreateGRN, setShowCreateGRN] = useState(false);
  const [showGRNDetail, setShowGRNDetail] = useState(false);
  const [showQualityCheck, setShowQualityCheck] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState(null);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Fetch GRN statistics
  const fetchStats = async () => {
    try {
      const response = await grnAPI.getStats();
      setStats(response?.data || {
        totalGRNs: 0,
        statusBreakdown: [],
        pendingReview: 0,
        thisMonth: 0,
        monthlyValue: 0
      });
    } catch (err) {
      console.error('Error fetching GRN stats:', err);
      // Set fallback stats on error
      setStats({
        totalGRNs: 0,
        statusBreakdown: [],
        pendingReview: 0,
        thisMonth: 0,
        monthlyValue: 0
      });
    }
  };

  // Fetch GRNs
  const fetchGRNs = async (page = 1, search = '', status = '') => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        ...(search && { search }),
        ...(status && { status })
      };
      
      const response = await grnAPI.getAll(params);
      setGRNs(response?.data || []);
      setPagination(response?.pagination || {});
      setError(null);
    } catch (err) {
      setError('Failed to fetch GRNs');
      setGRNs([]); // Set empty array on error
      console.error('Error fetching GRNs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchStats();
    fetchGRNs();
  }, []);

  // Handle search and filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchGRNs(1, searchTerm, statusFilter);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  // Handle GRN creation
  const handleCreateGRN = async (grnData) => {
    try {
      await grnAPI.create(grnData);
      setShowCreateGRN(false);
      fetchGRNs(currentPage, searchTerm, statusFilter);
      fetchStats();
    } catch (err) {
      console.error('Error creating GRN:', err);
      throw err;
    }
  };

  // Handle status update
  const handleStatusUpdate = async (grnId, newStatus, notes = '') => {
    try {
      await grnAPI.updateStatus(grnId, {
        status: newStatus,
        notes: notes,
        updatedBy: 'Admin'
      });
      fetchGRNs(currentPage, searchTerm, statusFilter);
      fetchStats();
      if (selectedGRN && selectedGRN._id === grnId) {
        const updatedGRN = await grnAPI.getById(grnId);
        setSelectedGRN(updatedGRN.data);
      }
    } catch (err) {
      console.error('Error updating GRN status:', err);
      alert('Failed to update GRN status');
    }
  };

  // Handle GRN approval
  const handleApproveGRN = async (grnId, approvedBy, notes) => {
    try {
      await grnAPI.approve(grnId, approvedBy, notes);
      fetchGRNs(currentPage, searchTerm, statusFilter);
      fetchStats();
      if (selectedGRN && selectedGRN._id === grnId) {
        const updatedGRN = await grnAPI.getById(grnId);
        setSelectedGRN(updatedGRN.data);
      }
    } catch (err) {
      console.error('Error approving GRN:', err);
      throw err;
    }
  };

  // View GRN details
  const handleViewGRN = async (grn) => {
    try {
      const response = await grnAPI.getById(grn._id);
      setSelectedGRN(response.data);
      setShowGRNDetail(true);
    } catch (err) {
      console.error('Error fetching GRN details:', err);
      alert('Failed to load GRN details');
    }
  };

  // Handle quality check
  const handleQualityCheck = async (grn) => {
    try {
      const response = await grnAPI.getById(grn._id);
      setSelectedGRN(response.data);
      setShowQualityCheck(true);
    } catch (err) {
      console.error('Error loading GRN for quality check:', err);
      alert('Failed to load GRN for quality check');
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Goods Receipt Note (GRN)</h1>
            <p className="text-gray-600">Track and manage incoming goods and materials</p>
          </div>
          <button 
            onClick={() => setShowCreateGRN(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            + New GRN
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total GRNs</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalGRNs || 0}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-xl">📦</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-600">{stats?.pending || 0}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-600 text-xl">⏳</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats?.completed || 0}</p>
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
              <p className="text-2xl font-bold text-blue-600">{stats?.thisMonth || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">📅</span>
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
              placeholder="Search GRNs by number, PO reference, supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Partial">Partial</option>
              <option value="Complete">Complete</option>
            </select>
          </div>
        </div>
      </div>

      {/* GRN Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Goods Receipt Notes</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-2 text-gray-600">Loading GRNs...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => fetchGRNs(currentPage, searchTerm, statusFilter)}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Retry
            </button>
          </div>
        ) : !grns || grns.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No GRNs found</p>
            <button 
              onClick={() => setShowCreateGRN(true)}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Create First GRN
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GRN Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PO Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Received Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity & Weight
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
                  {grns.map((grn) => {
                    const totalQty = grn.items?.reduce((total, item) => total + item.receivedQuantity, 0) || 0;
                    
                    // Calculate total weight - if receivedWeight is 0, calculate from quantity
                    const totalWeight = grn.items?.reduce((total, item) => {
                      let weight = item.receivedWeight || 0;
                      
                      // If weight is 0 but we have quantity, calculate it
                      if (weight === 0 && item.receivedQuantity > 0 && item.orderedQuantity > 0 && item.orderedWeight > 0) {
                        const weightPerUnit = item.orderedWeight / item.orderedQuantity;
                        weight = item.receivedQuantity * weightPerUnit;
                      }
                      
                      return total + weight;
                    }, 0) || 0;
                    
                    const unit = grn.items?.[0]?.unit || '';
                    
                    // Calculate receipt status based on items
                    let receiptStatus = 'Pending';
                    if (grn.items && grn.items.length > 0) {
                      const allComplete = grn.items.every(item => {
                        const pending = (item.orderedQuantity || 0) - ((item.previouslyReceived || 0) + item.receivedQuantity);
                        return pending <= 0;
                      });
                      const anyReceived = grn.items.some(item => item.receivedQuantity > 0);
                      
                      if (allComplete && anyReceived) {
                        receiptStatus = 'Complete';
                      } else if (anyReceived) {
                        receiptStatus = 'Partial';
                      }
                    }
                    
                    // Use backend receiptStatus if available, otherwise use calculated
                    const displayStatus = grn.receiptStatus || receiptStatus;
                    
                    return (
                      <tr key={grn._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{grn.grnNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{grn.poNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{grn.supplierDetails?.companyName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {grnUtils.formatDate(grn.receiptDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {totalQty} {unit}
                          </div>
                          <div className="text-xs text-gray-500">
                            {totalWeight.toFixed(2)} kg
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={'inline-flex px-2 py-1 text-xs font-semibold rounded-full ' + (displayStatus === 'Complete' ? 'bg-green-100 text-green-800' : displayStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800')}>
                            {displayStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => handleViewGRN(grn)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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
                      fetchGRNs(newPage, searchTerm, statusFilter);
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
                      fetchGRNs(newPage, searchTerm, statusFilter);
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
      {showCreateGRN && (
        <Modal
          isOpen={showCreateGRN}
          onClose={() => setShowCreateGRN(false)}
          title="Create New GRN"
          size="xl"
        >
          <GRNForm
            onSubmit={handleCreateGRN}
            onCancel={() => setShowCreateGRN(false)}
          />
        </Modal>
      )}

      {showGRNDetail && selectedGRN && (
        <Modal
          isOpen={showGRNDetail}
          onClose={() => setShowGRNDetail(false)}
          title={`GRN Details - ${selectedGRN.grnNumber}`}
          size="xl"
        >
          <GRNDetail
            grn={selectedGRN}
            onStatusUpdate={handleStatusUpdate}
            onApprove={handleApproveGRN}
            onClose={() => setShowGRNDetail(false)}
          />
        </Modal>
      )}

      {showQualityCheck && selectedGRN && (
        <Modal
          isOpen={showQualityCheck}
          onClose={() => setShowQualityCheck(false)}
          title={`Quality Check - ${selectedGRN.grnNumber}`}
          size="xl"
        >
          <GRNQualityCheck
            grn={selectedGRN}
            onSubmit={(qualityData) => {
              // Handle quality check submission
              console.log('Quality check data:', qualityData);
              setShowQualityCheck(false);
              fetchGRNs(currentPage, searchTerm, statusFilter);
            }}
            onCancel={() => setShowQualityCheck(false)}
          />
        </Modal>
      )}
    </div>
  );
};

export default GoodsReceipt;
