import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, Clock, AlertCircle, Calendar, Plus, Search, ChevronDown, ChevronRight, Eye } from 'lucide-react';
import { grnAPI, grnUtils } from '../services/grnAPI';
import Modal from '../components/model/Modal';
import GRNForm from '../components/GRN/GRNForm';
import GRNDetail from '../components/GRN/GRNDetail';

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
        let category = 'General';
        
        // Try to get from PO's category field first
        if (grn.purchaseOrder?.category?.categoryName) {
          category = grn.purchaseOrder.category.categoryName;
        } else if (grn.purchaseOrder?.category?.name) {
          category = grn.purchaseOrder.category.name;
        } else if (grn.purchaseOrder?.category && typeof grn.purchaseOrder.category === 'string') {
          category = grn.purchaseOrder.category;
        } else if (grn.items && grn.items.length > 0) {
          // Fallback: get from first GRN item
          const firstItem = grn.items[0];
          if (firstItem.product?.category?.categoryName) {
            category = firstItem.product.category.categoryName;
          } else if (firstItem.product?.category?.name) {
            category = firstItem.product.category.name;
          } else if (firstItem.product?.category && typeof firstItem.product.category === 'string') {
            category = firstItem.product.category;
          }
        } else if (grn.purchaseOrder?.items && grn.purchaseOrder.items.length > 0) {
          // Last fallback: get from PO items
          const firstItem = grn.purchaseOrder.items[0];
          if (firstItem.product?.category?.categoryName) {
            category = firstItem.product.category.categoryName;
          } else if (firstItem.product?.category?.name) {
            category = firstItem.product.category.name;
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



  // Handle GRN approval


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
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold">Goods Receipt Note (GRN)</h1>
            </div>
            <p className="text-green-100 ml-[52px]">Track and manage incoming goods and materials</p>
          </div>
          <button 
            onClick={() => setShowCreateGRN(true)}
            className="bg-white text-green-600 hover:bg-green-50 px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New GRN
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl shadow-sm p-6 border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-orange-600 uppercase tracking-wide">Total GRNs</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalGRNs || 0}</p>
            </div>
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center shadow-inner">
              <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm p-6 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-600 uppercase tracking-wide">Completed</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats?.completed || 0}</p>
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center shadow-inner">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">This Month</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats?.thisMonth || 0}</p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center shadow-inner">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search GRNs by number, PO reference, supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                statusFilter === '' 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('Complete')}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                statusFilter === 'Complete' 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Complete
            </button>
            <button
              onClick={() => setStatusFilter('Partial')}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                statusFilter === 'Partial' 
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Partial
            </button>
          </div>
        </div>
      </div>

      {/* GRNs Grouped by PO */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-16 text-center border border-gray-100">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-50 rounded-full mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600"></div>
            </div>
            <p className="text-lg font-medium text-gray-700">Loading GRNs...</p>
            <p className="text-sm text-gray-500 mt-2">Please wait while we fetch your data</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-sm p-16 text-center border border-gray-100">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 rounded-full mb-6">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => fetchGRNs(currentPage, searchTerm, statusFilter)}
              className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-medium shadow-md"
            >
              Retry
            </button>
          </div>
        ) : groupedByPO.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-16 text-center border border-gray-100">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-50 rounded-full mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-700 mb-2">No GRNs found</p>
            <p className="text-sm text-gray-500 mb-6">Create your first GRN to get started</p>
            <button 
              onClick={() => setShowCreateGRN(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-medium shadow-md flex items-center gap-2 mx-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
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
              <div key={poKey} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                {/* PO Header */}
                <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                  <div className="px-6 py-4 flex items-center justify-between">
                    <button
                      onClick={() => togglePO(poKey)}
                      className="flex items-center gap-4 flex-1 text-left hover:bg-gray-100 -mx-2 px-3 py-2 rounded-lg transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isExpanded ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-gray-900">{po.poNumber}</h3>
                          <span className={`inline-flex px-3 py-1 rounded-lg text-sm font-semibold ${
                            po.poStatus === 'Complete' ? 'bg-green-100 text-green-700' :
                            po.poStatus === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {po.poStatus}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-700">
                            {po.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {po.supplier}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {po.grns.length} GRN(s)
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            {po.completedItems}/{po.totalItems} items
                          </span>
                        </div>
                      </div>
                    </button>
                    {/* Only show Add GRN button if PO is not Complete */}
                    {po.poStatus !== 'Complete' && (
                      <button
                        onClick={() => handleCreateGRNForPO(po)}
                        className="ml-4 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all flex items-center gap-2 shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add GRN</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* GRNs List */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">GRN Number</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Received Date</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Products</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantity & Weight</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
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
                            <tr key={grn._id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <span className="text-sm font-semibold text-gray-900">{grn.grnNumber}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-700 font-medium">
                                  {grnUtils.formatDate(grn.receiptDate)}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {grn.items?.map((item, idx) => (
                                  <div key={idx} className="text-sm mb-1 last:mb-0">
                                    <span className="font-medium text-gray-900">{item.productName}</span>
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
                                    <div key={idx} className="text-sm mb-1 last:mb-0">
                                      <div className="font-semibold text-gray-900">
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
                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-lg ${
                                  grnStatus === 'Complete' ? 'bg-green-100 text-green-700' :
                                  grnStatus === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {grnStatus}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button 
                                  onClick={() => handleViewGRN(grn)}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm"
                                  title="View Details"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  View Details
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    
                    {/* Load More Button */}
                    {po.grns.length > (poGRNLimits[poKey] || 5) && (
                      <div className="px-6 py-4 border-t border-gray-100 text-center bg-gray-50">
                        <button
                          onClick={() => loadMoreGRNs(poKey)}
                          className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          Load More GRNs ({po.grns.length - (poGRNLimits[poKey] || 5)} remaining)
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
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{((currentPOPage - 1) * posPerPage) + 1}</span> to{' '}
                  <span className="font-semibold text-gray-900">{Math.min(currentPOPage * posPerPage, groupedByPO.length)}</span> of{' '}
                  <span className="font-semibold text-gray-900">{groupedByPO.length}</span> Purchase Orders
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPOPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPOPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>
                  <span className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-semibold shadow-sm">
                    {currentPOPage} of {Math.ceil(groupedByPO.length / posPerPage)}
                  </span>
                  <button
                    onClick={() => setCurrentPOPage(prev => Math.min(Math.ceil(groupedByPO.length / posPerPage), prev + 1))}
                    disabled={currentPOPage === Math.ceil(groupedByPO.length / posPerPage)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  >
                    Next
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
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
            onClose={() => setShowGRNDetail(false)}
          />
        </Modal>
      )}


    </div>
  );
};

export default GoodsReceipt;
