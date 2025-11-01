import React, { useState, useEffect } from 'react';
import { grnAPI, grnUtils } from '../services/grnAPI';
import Modal from '../components/model/Modal';
import GRNForm from '../components/GRN/GRNForm';
import GRNDetail from '../components/GRN/GRNDetail';
import GRNQualityCheck from '../components/GRN/GRNQualityCheck';

const GoodsReceipt = () => {
  const [grns, setGRNs] = useState([]);
  const [groupedByPO, setGroupedByPO] = useState([]);
  const [expandedPOs, setExpandedPOs] = useState({});
  const [poGRNLimits, setPOGRNLimits] = useState({}); // Pagination per PO
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
  const [selectedPO, setSelectedPO] = useState(null);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  
  // PO-level pagination
  const [currentPOPage, setCurrentPOPage] = useState(1);
  const [posPerPage] = useState(5); // Show 5 POs per page

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

  // Group GRNs by Purchase Order
  const groupGRNsByPO = (grnList) => {
    const grouped = {};
    
    grnList.forEach(grn => {
      const poKey = grn.purchaseOrder?._id || grn.poNumber || 'unknown';
      
      if (!grouped[poKey]) {
        // Get category from PO or first product
        let category = 'Uncategorized';
        
        // Try to get from PO's category field first
        if (grn.purchaseOrder?.category?.categoryName) {
          category = grn.purchaseOrder.category.categoryName;
        } else if (grn.purchaseOrder?.category && typeof grn.purchaseOrder.category === 'string') {
          category = grn.purchaseOrder.category;
        } else if (grn.purchaseOrder?.items && grn.purchaseOrder.items.length > 0) {
          // Fallback: get from first product
          const firstItem = grn.purchaseOrder.items[0];
          if (firstItem.product?.category?.categoryName) {
            category = firstItem.product.category.categoryName;
          } else if (firstItem.product?.category && typeof firstItem.product.category === 'string') {
            category = firstItem.product.category;
          }
        }
        
        grouped[poKey] = {
          poId: grn.purchaseOrder?._id,
          poNumber: grn.poNumber || 'N/A',
          supplier: grn.supplierDetails?.companyName || 'Unknown',
          category: category,
          grns: [],
          totalItems: 0,
          completedItems: 0,
          poStatus: 'Pending',
          purchaseOrder: grn.purchaseOrder // Store full PO for reference
        };
      }
      
      grouped[poKey].grns.push(grn);
    });
    
    // Determine PO status from actual PO data and sort GRNs
    Object.values(grouped).forEach(po => {
      // Use actual PO status from backend if available
      if (po.purchaseOrder && po.purchaseOrder.status) {
        // Map backend status to display status
        const statusMap = {
          'Fully_Received': 'Complete',
          'Partially_Received': 'Partial',
          'Pending': 'Pending',
          'Draft': 'Pending'
        };
        po.poStatus = statusMap[po.purchaseOrder.status] || 'Pending';
        
        // Calculate completion from PO items
        if (po.purchaseOrder.items) {
          po.totalItems = po.purchaseOrder.items.length;
          po.completedItems = po.purchaseOrder.items.filter(item => 
            item.receiptStatus === 'Complete' || item.manuallyCompleted
          ).length;
        }
      } else {
        // Fallback: Calculate from GRN items if PO data not available
        po.totalItems = 0;
        po.completedItems = 0;
        const itemsMap = new Map();
        
        po.grns.forEach(grn => {
          grn.items?.forEach(item => {
            const itemKey = item.purchaseOrderItem || item.productCode;
            if (!itemsMap.has(itemKey)) {
              itemsMap.set(itemKey, {
                ordered: item.orderedQuantity || 0,
                received: 0,
                manuallyCompleted: false
              });
            }
            const tracked = itemsMap.get(itemKey);
            tracked.received += item.receivedQuantity || 0;
            if (item.manuallyCompleted) {
              tracked.manuallyCompleted = true;
            }
          });
        });
        
        itemsMap.forEach(item => {
          po.totalItems++;
          if (item.received >= item.ordered || item.manuallyCompleted) {
            po.completedItems++;
          }
        });
        
        if (po.completedItems === 0) {
          po.poStatus = 'Pending';
        } else if (po.completedItems < po.totalItems) {
          po.poStatus = 'Partial';
        } else {
          po.poStatus = 'Complete';
        }
      }
      
      // Sort GRNs by date (latest first)
      po.grns.sort((a, b) => new Date(b.receiptDate) - new Date(a.receiptDate));
    });
    
    // Sort POs by latest GRN date (latest PO first)
    return Object.values(grouped).sort((a, b) => {
      const latestDateA = a.grns.length > 0 ? new Date(a.grns[0].receiptDate) : new Date(0);
      const latestDateB = b.grns.length > 0 ? new Date(b.grns[0].receiptDate) : new Date(0);
      return latestDateB - latestDateA;
    });
  };

  // Fetch GRNs
  const fetchGRNs = async (page = 1, search = '', status = '') => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 50, // Fetch more to group properly
        ...(search && { search }),
        ...(status && { status })
      };
      
      const response = await grnAPI.getAll(params);
      const grnData = response?.data || [];
      setGRNs(grnData);
      
      // Group by PO
      const grouped = groupGRNsByPO(grnData);
      setGroupedByPO(grouped);
      
      // Auto-expand all POs and set initial pagination
      const expanded = {};
      const limits = {};
      grouped.forEach(po => {
        const poKey = po.poId || po.poNumber;
        expanded[poKey] = true;
        limits[poKey] = 5; // Show first 5 GRNs per PO
      });
      setExpandedPOs(expanded);
      setPOGRNLimits(limits);
      
      setPagination(response?.pagination || {});
      setError(null);
    } catch (err) {
      setError('Failed to fetch GRNs');
      setGRNs([]);
      setGroupedByPO([]);
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

  // Toggle PO expansion
  const togglePO = (poKey) => {
    setExpandedPOs(prev => ({
      ...prev,
      [poKey]: !prev[poKey]
    }));
  };

  // Handle create GRN for specific PO
  const handleCreateGRNForPO = (po) => {
    setSelectedPO(po);
    setShowCreateGRN(true);
  };

  // Load more GRNs for a specific PO
  const loadMoreGRNs = (poKey) => {
    setPOGRNLimits(prev => ({
      ...prev,
      [poKey]: (prev[poKey] || 5) + 5
    }));
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

 
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading GRNs...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => fetchGRNs(currentPage, searchTerm, statusFilter)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Retry
            </button>
          </div>
        ) : groupedByPO.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-600 mb-4">No GRNs found</p>
            <button 
              onClick={() => setShowCreateGRN(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Create First GRN
            </button>
          </div>
        ) : (
          <>
            {/* Paginated POs */}
            {groupedByPO
              .slice((currentPOPage - 1) * posPerPage, currentPOPage * posPerPage)
              .map((po) => {
            const poKey = po.poId || po.poNumber;
            const isExpanded = expandedPOs[poKey];
            
            return (
              <div key={poKey} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* PO Header */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
                  <div className="px-6 py-4 flex items-center justify-between">
                    <button
                      onClick={() => togglePO(poKey)}
                      className="flex items-center gap-4 flex-1 text-left hover:bg-gray-50 -mx-2 px-2 py-2 rounded transition-colors"
                    >
                      <span className="text-2xl">{isExpanded ? '▼' : '▶'}</span>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">{po.poNumber}</h3>
                          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                            po.poStatus === 'Complete' ? 'bg-green-100 text-green-800' :
                            po.poStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {po.poStatus}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {po.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Supplier: {po.supplier} • {po.grns.length} GRN(s) • {po.completedItems}/{po.totalItems} items completed
                        </p>
                      </div>
                    </button>
                    {/* Only show Add GRN button if PO is not Complete */}
                    {po.poStatus !== 'Complete' && (
                      <button
                        onClick={() => handleCreateGRNForPO(po)}
                        className="ml-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        <span>+</span>
                        <span>Add GRN</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* GRNs List */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GRN Number</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Received Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity & Weight</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GRN Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {po.grns.slice(0, poGRNLimits[poKey] || 5).map((grn) => {
                          // Use GRN status from backend (considers manual completion)
                          let grnStatus = grn.receiptStatus || 'Pending';
                          
                          // Map backend status to display status
                          const grnStatusMap = {
                            'Complete': 'Complete',
                            'Partial': 'Partial',
                            'Pending': 'Pending'
                          };
                          grnStatus = grnStatusMap[grnStatus] || grnStatus;
                          
                          return (
                            <tr key={grn._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{grn.grnNumber}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {grnUtils.formatDate(grn.receiptDate)}
                              </td>
                              <td className="px-6 py-4">
                                {grn.items?.map((item, idx) => (
                                  <div key={idx} className="text-sm mb-1">
                                    <span className="font-medium text-gray-900">{item.productName}</span>
                                    <span className="text-gray-500 ml-2">({item.productCode})</span>
                                  </div>
                                ))}
                              </td>
                              <td className="px-6 py-4">
                                {grn.items?.map((item, idx) => {
                                  let weight = item.receivedWeight || 0;
                                  if (weight === 0 && item.receivedQuantity > 0 && item.orderedQuantity > 0 && item.orderedWeight > 0) {
                                    weight = item.receivedQuantity * (item.orderedWeight / item.orderedQuantity);
                                  }
                                  return (
                                    <div key={idx} className="text-sm mb-1">
                                      <div className="font-medium text-gray-900">
                                        {item.receivedQuantity} {item.unit}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {weight.toFixed(2)} kg
                                      </div>
                                    </div>
                                  );
                                })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  grnStatus === 'Complete' ? 'bg-green-100 text-green-800' :
                                  grnStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {grnStatus}
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
                    
                    {/* Load More Button */}
                    {po.grns.length > (poGRNLimits[poKey] || 5) && (
                      <div className="px-6 py-4 border-t border-gray-200 text-center">
                        <button
                          onClick={() => loadMoreGRNs(poKey)}
                          className="px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          Load More ({po.grns.length - (poGRNLimits[poKey] || 5)} remaining)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* PO Pagination */}
          {groupedByPO.length > posPerPage && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((currentPOPage - 1) * posPerPage) + 1} to {Math.min(currentPOPage * posPerPage, groupedByPO.length)} of {groupedByPO.length} Purchase Orders
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPOPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPOPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-700">
                    Page {currentPOPage} of {Math.ceil(groupedByPO.length / posPerPage)}
                  </span>
                  <button
                    onClick={() => setCurrentPOPage(prev => Math.min(Math.ceil(groupedByPO.length / posPerPage), prev + 1))}
                    disabled={currentPOPage === Math.ceil(groupedByPO.length / posPerPage)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
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
          onClose={() => {
            setShowCreateGRN(false);
            setSelectedPO(null);
          }}
          title={selectedPO ? `Create New GRN for ${selectedPO.poNumber}` : "Create New GRN"}
          size="xl"
        >
          <GRNForm
            onSubmit={handleCreateGRN}
            onCancel={() => {
              setShowCreateGRN(false);
              setSelectedPO(null);
            }}
            preSelectedPO={selectedPO?.poId}
            purchaseOrderData={selectedPO?.purchaseOrder}
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
