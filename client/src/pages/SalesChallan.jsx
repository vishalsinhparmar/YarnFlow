import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { salesChallanAPI, salesChallanUtils } from '../services/salesChallanAPI';
import CreateChallanModal from '../components/SalesChallan/CreateChallanModal';
import ChallanDetailModal from '../components/SalesChallan/ChallanDetailModal';
import ChallanStatusUpdateModal from '../components/SalesChallan/ChallanStatusUpdateModal';

const SalesChallan = () => {
  const location = useLocation();
  const [challans, setChallans] = useState([]);
  const [groupedBySO, setGroupedBySO] = useState([]);
  const [expandedSOs, setExpandedSOs] = useState({});
  const [soChallanLimits, setSOChallanLimits] = useState({}); // Pagination per SO
  const [stats, setStats] = useState({
    totalChallans: 0,
    completed: 0,
    partial: 0,
    thisMonth: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [selectedSO, setSelectedSO] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '', 'Completed', 'Partial'
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSOPage, setCurrentSOPage] = useState(1);
  const [sosPerPage] = useState(5); // Show 5 SOs per page
  const [pagination, setPagination] = useState(null);
  const [pdfLoading, setPdfLoading] = useState({});

  // Group Challans by Sales Order
  const groupChallansBySO = (challanList) => {
    const grouped = {};
    
    challanList.forEach(challan => {
      const soKey = challan.salesOrder?._id || challan.soReference || 'unknown';
      
      if (!grouped[soKey]) {
        grouped[soKey] = {
          soId: challan.salesOrder?._id,
          soNumber: challan.soReference || 'N/A',
          customer: challan.customerDetails?.companyName || 'Unknown',
          challans: [],
          totalItems: 0,
          dispatchedItems: 0,
          soStatus: 'Pending',
          salesOrder: challan.salesOrder
        };
      }
      
      grouped[soKey].challans.push(challan);
      
      // Calculate items
      if (challan.items) {
        grouped[soKey].totalItems += challan.items.length;
        challan.items.forEach(item => {
          if (item.dispatchQuantity >= item.orderedQuantity) {
            grouped[soKey].dispatchedItems++;
          }
        });
      }
    });
    
    // Determine SO status - use actual SO status from database if available
    Object.values(grouped).forEach(so => {
      // First priority: Use actual SO status from populated salesOrder
      if (so.salesOrder && so.salesOrder.status) {
        if (so.salesOrder.status === 'Delivered') {
          so.soStatus = 'Delivered';
        } else if (so.salesOrder.status === 'Shipped' || so.salesOrder.status === 'Processing') {
          so.soStatus = 'Partial';
        } else {
          so.soStatus = 'Pending';
        }
      } else {
        // Fallback: Calculate based on challan statuses
        const allDelivered = so.challans.every(c => c.status === 'Delivered');
        const someDelivered = so.challans.some(c => c.status === 'Delivered');
        
        if (allDelivered) {
          so.soStatus = 'Delivered';
        } else if (someDelivered || so.dispatchedItems > 0) {
          so.soStatus = 'Partial';
        } else {
          so.soStatus = 'Pending';
        }
      }
    });
    
    return Object.values(grouped);
  };

  // Toggle SO expansion
  const toggleSO = (soKey) => {
    setExpandedSOs(prev => ({
      ...prev,
      [soKey]: !prev[soKey]
    }));
  };

  // Load more challans for a specific SO
  const loadMoreChallans = (soKey) => {
    setSOChallanLimits(prev => ({
      ...prev,
      [soKey]: (prev[soKey] || 5) + 5
    }));
  };

  // Debounced search to avoid too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAllData();
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  // Auto-open create modal if navigated from Sales Order
  useEffect(() => {
    if (location.state?.selectedOrderId) {
      setShowCreateModal(true);
    }
  }, [location.state]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch stats and challans in parallel
      const [statsRes, challansRes] = await Promise.all([
        salesChallanAPI.getStats(),
        salesChallanAPI.getAll({
          page: 1,
          limit: 100, // Reasonable limit for performance
          search: searchTerm
        })
      ]);

      if (statsRes.success) {
        const data = statsRes.data;
        setStats({
          totalChallans: data?.overview?.totalChallans || 0,
          completed: data?.completed || 0,
          partial: data?.partial || 0,
          thisMonth: data?.overview?.thisMonth || 0
        });
      }

      if (challansRes.success) {
        let challanData = Array.isArray(challansRes?.data) ? challansRes.data : [];
        
        // Apply status filter on frontend (optimized)
        if (statusFilter && challanData.length > 0) {
          challanData = challanData.filter(challan => {
            // Safety check
            if (!challan || !Array.isArray(challan.items) || challan.items.length === 0) {
              return statusFilter === 'Pending';
            }
            
            // Use for loop for better performance with large datasets
            let allItemsComplete = true;
            let anyItemPartial = false;
            
            for (let i = 0; i < challan.items.length; i++) {
              const item = challan.items[i];
              const dispatched = item.dispatchQuantity || 0;
              const ordered = item.orderedQuantity || 0;
              const manuallyCompleted = item.manuallyCompleted || false;
              
              if (manuallyCompleted || dispatched >= ordered) {
                // Item is complete - continue checking
                continue;
              } else if (dispatched > 0 && dispatched < ordered) {
                // Item is partial
                allItemsComplete = false;
                anyItemPartial = true;
              } else {
                // Item is pending
                allItemsComplete = false;
              }
            }
            
            // Return based on filter
            if (statusFilter === 'Completed') {
              return allItemsComplete;
            } else if (statusFilter === 'Partial') {
              return anyItemPartial;
            }
            return true;
          });
        }
        
        setChallans(challanData);
        
        // Group by SO
        const grouped = groupChallansBySO(challanData);
        setGroupedBySO(grouped);
        
        // Initialize expansion and limits (optimized)
        const expanded = {};
        const limits = {};
        for (let i = 0; i < grouped.length; i++) {
          const so = grouped[i];
          const soKey = so.soId || so.soNumber;
          expanded[soKey] = i < 5; // Only expand first 5 SOs by default
          limits[soKey] = 5;
        }
        setExpandedSOs(expanded);
        setSOChallanLimits(limits);
      }
      
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to fetch data';
      setError(errorMessage);
      setChallans([]);
      setGroupedBySO([]);
      console.error('Error fetching sales challan data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle challan creation (memoized)
  const handleCreateChallan = useCallback(async (challanData) => {
    try {
      const response = await salesChallanAPI.create(challanData);
      setShowCreateModal(false);
      await fetchAllData(); // Refresh data
      return response;
    } catch (err) {
      console.error('Error creating challan:', err);
      throw err;
    }
  }, []);

  // Handle Consolidated PDF Download for SO
  const handleDownloadPDF = async (soId, soNumber) => {
    try {
      setPdfLoading(prev => ({ ...prev, [soId]: 'download' }));
      await salesChallanAPI.generateConsolidatedPDF(soId);
      // Success - PDF downloads automatically
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError(`Failed to download PDF for ${soNumber}`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setPdfLoading(prev => ({ ...prev, [soId]: null }));
    }
  };

  // Handle Consolidated PDF Preview for SO
  const handlePreviewPDF = async (soId, soNumber) => {
    try {
      setPdfLoading(prev => ({ ...prev, [soId]: 'preview' }));
      await salesChallanAPI.previewConsolidatedPDF(soId);
      // Success - PDF opens in new tab
    } catch (err) {
      console.error('Error previewing PDF:', err);
      setError(`Failed to preview PDF for ${soNumber}`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setPdfLoading(prev => ({ ...prev, [soId]: null }));
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

  // Handle create challan for specific SO
  const handleCreateChallanForSO = (so) => {
    setSelectedSO(so);
    setShowCreateModal(true);
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
              <p className="text-2xl font-bold text-gray-900">{stats.totalChallans}</p>
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <span className="text-teal-600 text-xl">🚚</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Partial</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.partial}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-yellow-600 text-xl">📦</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-blue-600">{stats.thisMonth}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">📅</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search challans by number, SO reference, customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                statusFilter === '' 
                  ? 'bg-teal-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('Completed')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                statusFilter === 'Completed' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setStatusFilter('Partial')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                statusFilter === 'Partial' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Partial
            </button>
          </div>
        </div>
      </div>

      {/* Sales Challans Grouped by SO */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading challans...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => fetchAllData()}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Retry
            </button>
          </div>
        ) : groupedBySO.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-600 mb-4">No challans found</p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Create First Challan
            </button>
          </div>
        ) : (
          <>
            {/* Paginated SOs */}
            {groupedBySO
              .slice((currentSOPage - 1) * sosPerPage, currentSOPage * sosPerPage)
              .map((so) => {
            const soKey = so.soId || so.soNumber;
            const isExpanded = expandedSOs[soKey];
            
            return (
              <div key={soKey} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* SO Header */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
                  <div className="px-6 py-4 flex items-center justify-between">
                    <button
                      onClick={() => toggleSO(soKey)}
                      className="flex items-center gap-4 flex-1 text-left hover:bg-gray-50 -mx-2 px-2 py-2 rounded transition-colors"
                    >
                      <span className="text-2xl">{isExpanded ? '▼' : '▶'}</span>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">{so.soNumber}</h3>
                          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                            so.soStatus === 'Delivered' ? 'bg-green-100 text-green-800' :
                            so.soStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {so.soStatus}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Customer: {so.customer} • {so.challans.length} Challan(s) • {so.dispatchedItems}/{so.totalItems} items dispatched
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-3">
                      {/* Show PDF button only for Delivered/Completed SOs */}
                      {so.soStatus === 'Delivered' && (
                        <>
                          <button
                            onClick={() => handlePreviewPDF(so.soId, so.soNumber)}
                            disabled={pdfLoading[so.soId]}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Preview Consolidated PDF"
                          >
                            {pdfLoading[so.soId] === 'preview' ? '⏳' : '📄'}
                            <span>Preview PDF</span>
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(so.soId, so.soNumber)}
                            disabled={pdfLoading[so.soId]}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Download Consolidated PDF"
                          >
                            {pdfLoading[so.soId] === 'download' ? '⏳' : '📥'}
                            <span>Download PDF</span>
                          </button>
                        </>
                      )}
                      
                      {/* Only show Add Challan button if SO is not Delivered */}
                      {so.soStatus !== 'Delivered' && (
                        <button
                          onClick={() => handleCreateChallanForSO(so)}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                          <span>+</span>
                          <span>Add Challan</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Challans List */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Challan Number</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dispatch Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity & Weight</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Challan Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {so.challans.slice(0, soChallanLimits[soKey] || 5).map((challan) => {
                          // Determine challan status based on item completion
                          let challanStatus = 'Pending';
                          
                          if (challan.items && challan.items.length > 0) {
                            let allItemsComplete = true;
                            let anyItemPartial = false;
                            
                            challan.items.forEach(item => {
                              const dispatched = item.dispatchQuantity || 0;
                              const ordered = item.orderedQuantity || 0;
                              const manuallyCompleted = item.manuallyCompleted || false;
                              
                              if (manuallyCompleted || dispatched >= ordered) {
                                // Item is complete
                              } else if (dispatched > 0 && dispatched < ordered) {
                                // Item is partial
                                allItemsComplete = false;
                                anyItemPartial = true;
                              } else {
                                // Item is pending
                                allItemsComplete = false;
                              }
                            });
                            
                            if (allItemsComplete) {
                              challanStatus = 'Delivered';
                            } else if (anyItemPartial) {
                              challanStatus = 'Partial';
                            } else {
                              challanStatus = 'Pending';
                            }
                          }
                          
                          return (
                            <tr key={challan._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{challan.challanNumber}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {salesChallanUtils.formatDate(challan.challanDate)}
                              </td>
                              <td className="px-6 py-4">
                                {challan.items?.map((item, idx) => (
                                  <div key={idx} className="text-sm mb-1">
                                    <span className="font-medium text-gray-900">{item.productName}</span>
                                  </div>
                                ))}
                              </td>
                              <td className="px-6 py-4">
                                {challan.items?.map((item, idx) => (
                                  <div key={idx} className="text-sm mb-1">
                                    <div className="font-medium text-gray-900">
                                      {item.dispatchQuantity} {item.unit}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {item.weight?.toFixed(2) || 0} kg
                                    </div>
                                  </div>
                                ))}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  challanStatus === 'Delivered' ? 'bg-green-100 text-green-800' :
                                  challanStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {challanStatus}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button 
                                  onClick={() => {
                                    setSelectedChallan(challan);
                                    setShowDetailModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 font-medium"
                                  title="View Details"
                                >
                                  👁️ View Details
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    
                    {/* Load More Button */}
                    {so.challans.length > (soChallanLimits[soKey] || 5) && (
                      <div className="px-6 py-4 border-t border-gray-200 text-center">
                        <button
                          onClick={() => loadMoreChallans(soKey)}
                          className="text-teal-600 hover:text-teal-800 font-medium"
                        >
                          Load More Challans ({so.challans.length - (soChallanLimits[soKey] || 5)} more)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* SO Pagination */}
          {groupedBySO.length > sosPerPage && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((currentSOPage - 1) * sosPerPage) + 1} to{' '}
                  {Math.min(currentSOPage * sosPerPage, groupedBySO.length)} of{' '}
                  {groupedBySO.length} Sales Orders
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentSOPage(Math.max(1, currentSOPage - 1))}
                    disabled={currentSOPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded text-sm">
                    {currentSOPage} of {Math.ceil(groupedBySO.length / sosPerPage)}
                  </span>
                  <button
                    onClick={() => setCurrentSOPage(Math.min(Math.ceil(groupedBySO.length / sosPerPage), currentSOPage + 1))}
                    disabled={currentSOPage === Math.ceil(groupedBySO.length / sosPerPage)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
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
      {showCreateModal && (
        <CreateChallanModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedSO(null);
          }}
          onSubmit={handleCreateChallan}
          preSelectedOrderId={selectedSO?.soId || selectedSO?._id || location.state?.selectedOrderId}
        />
      )}

      {showDetailModal && selectedChallan && (
        <ChallanDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          challan={selectedChallan}
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
