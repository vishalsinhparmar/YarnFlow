import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { FileText, CheckCircle, Clock, Calendar, Plus, Search, ChevronDown, ChevronRight, Eye } from 'lucide-react';
import { salesChallanAPI, salesChallanUtils } from '../services/salesChallanAPI';
import CreateChallanModal from '../components/SalesChallan/CreateChallanModal';
import ChallanDetailModal from '../components/SalesChallan/ChallanDetailModal';
import PdfPreviewModal from '../components/SalesChallan/PdfPreviewModal';

const getChallanDisplayStatus = (items = []) => {
  if (items.length === 0) return 'Pending';

  let completedItems = 0;
  let hasDispatch = false;
  items.forEach((item) => {
    const dispatched = Number(item.dispatchQuantity) || 0;
    const ordered = Number(item.orderedQuantity) || 0;
    const isComplete = item.manuallyCompleted || (ordered > 0 && dispatched >= ordered);
    if (isComplete) completedItems += 1;
    if (dispatched > 0 || item.manuallyCompleted) hasDispatch = true;
  });

  if (completedItems === items.length) return 'Delivered';
  if (hasDispatch || completedItems > 0) return 'Partial';
  return 'Pending';
};

const SalesChallan = () => {
  const location = useLocation();
  const [, setChallans] = useState([]);
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
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [selectedSO, setSelectedSO] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '', 'Completed', 'Partial'
  const [currentSOPage, setCurrentSOPage] = useState(1);
  const [sosPerPage] = useState(5); // Show 5 SOs per page
  const [pdfLoading, setPdfLoading] = useState({});
  const [challanPdfLoading, setChallanPdfLoading] = useState({});
  const [pdfPreviewModal, setPdfPreviewModal] = useState({ open: false, url: null, challanId: null, challanNumber: '' });
  const [consolidatedPreviewModal, setConsolidatedPreviewModal] = useState({ open: false, url: null, soId: null, soNumber: '' });

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
    if (location.state?.selectedSalesOrderId) {
      setSelectedSO(location.state.selectedSalesOrderId);
      if (location.state?.openCreateModal) {
        setShowCreateModal(true);
      }
      // Clear the state so it doesn't persist on refresh
      window.history.replaceState({}, document.title);
    } else if (location.state?.selectedOrderId) {
      // Backward compatibility
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
            const displayStatus = getChallanDisplayStatus(challan?.items || []);
            if (statusFilter === 'Completed') {
              return displayStatus === 'Delivered';
            }
            if (statusFilter === 'Partial') {
              return displayStatus === 'Partial';
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
      setCurrentSOPage(1);
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

  // Handle Consolidated PDF Preview for SO — opens in-app modal
  const handlePreviewPDF = async (soId, soNumber) => {
    try {
      setPdfLoading(prev => ({ ...prev, [soId]: 'preview' }));
      const result = await salesChallanAPI.previewConsolidatedPDF(soId);
      setConsolidatedPreviewModal({ open: true, url: result.blobUrl, soId, soNumber });
    } catch (err) {
      console.error('Error previewing PDF:', err);
      setError(`Failed to preview PDF for ${soNumber}`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setPdfLoading(prev => ({ ...prev, [soId]: null }));
    }
  };

  const closeConsolidatedPreviewModal = () => {
    if (consolidatedPreviewModal.url) window.URL.revokeObjectURL(consolidatedPreviewModal.url);
    setConsolidatedPreviewModal({ open: false, url: null, soId: null, soNumber: '' });
  };

  // Handle individual challan PDF preview — opens in-app modal
  const handlePreviewChallanPDF = async (challanId, challanNumber) => {
    try {
      setChallanPdfLoading(prev => ({ ...prev, [challanId]: 'preview' }));
      const result = await salesChallanAPI.previewPDF(challanId);
      setPdfPreviewModal({ open: true, url: result.blobUrl, challanId, challanNumber });
    } catch (err) {
      console.error('Error previewing challan PDF:', err);
      setError(`Failed to preview PDF for ${challanNumber}`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setChallanPdfLoading(prev => ({ ...prev, [challanId]: null }));
    }
  };

  const closePdfPreviewModal = () => {
    if (pdfPreviewModal.url) window.URL.revokeObjectURL(pdfPreviewModal.url);
    setPdfPreviewModal({ open: false, url: null, challanId: null, challanNumber: '' });
  };

  // Handle individual challan PDF download
  const handleDownloadChallanPDF = async (challanId, challanNumber) => {
    try {
      setChallanPdfLoading(prev => ({ ...prev, [challanId]: 'download' }));
      await salesChallanAPI.generatePDF(challanId);
    } catch (err) {
      console.error('Error downloading challan PDF:', err);
      setError(`Failed to download PDF for ${challanNumber}`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setChallanPdfLoading(prev => ({ ...prev, [challanId]: null }));
    }
  };

  // Handle create challan for specific SO
  const handleCreateChallanForSO = (so) => {
    setSelectedSO(so);
    setShowCreateModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Compact Header with Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sales Challan</h1>
                <p className="text-sm text-gray-600">Manage delivery challans and shipment documents</p>
              </div>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Challan
            </button>
          </div>

          {/* Compact Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Total Challans</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalChallans}</p>
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Completed</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">{stats.completed}</p>
                </div>
                <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-yellow-600 uppercase tracking-wide">Partial</p>
                  <p className="text-2xl font-bold text-yellow-700 mt-1">{stats.partial}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-200 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">This Month</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">{stats.thisMonth}</p>
                </div>
                <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}

      
      {/* Compact Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search challans by number, SO reference, customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                statusFilter === '' 
                  ? 'bg-teal-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('Completed')}
              className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                statusFilter === 'Completed' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setStatusFilter('Partial')}
              className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
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
          <div className="bg-white rounded-xl shadow-sm p-16 text-center border border-gray-100">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-50 rounded-full mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-200 border-t-teal-600"></div>
            </div>
            <p className="text-lg font-medium text-gray-700">Loading challans...</p>
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
              onClick={() => fetchAllData()}
              className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl hover:from-teal-700 hover:to-emerald-700 font-medium shadow-md"
            >
              Retry
            </button>
          </div>
        ) : groupedBySO.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-16 text-center border border-gray-100">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-50 rounded-full mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-700 mb-2">No challans found</p>
            <p className="text-sm text-gray-500 mb-6">Create your first challan to get started</p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl hover:from-teal-700 hover:to-emerald-700 font-medium shadow-md flex items-center gap-2 mx-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
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
              <div key={soKey} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                {/* SO Header */}
                <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                  <div className="px-6 py-4 flex items-center justify-between">
                    <button
                      onClick={() => toggleSO(soKey)}
                      className="flex items-center gap-4 flex-1 text-left hover:bg-gray-100 -mx-2 px-3 py-2 rounded-lg transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isExpanded ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-500'}`}>
                        <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-gray-900">{so.soNumber}</h3>
                          <span className={`inline-flex px-3 py-1 rounded-lg text-sm font-semibold ${
                            so.soStatus === 'Delivered' ? 'bg-green-100 text-green-700' :
                            so.soStatus === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {so.soStatus}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {so.customer}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {so.challans.length} Challan(s)
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            {so.dispatchedItems}/{so.totalItems} items
                          </span>
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-3">
                      {/* Show PDF button only for Delivered/Completed SOs */}
                      {so.soStatus === 'Delivered' && (
                        <>
                          <button
                            onClick={() => handlePreviewPDF(so.soId, so.soNumber)}
                            disabled={pdfLoading[so.soId]}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            title="Preview Consolidated PDF"
                          >
                            {pdfLoading[so.soId] === 'preview' ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                            <span>Preview</span>
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(so.soId, so.soNumber)}
                            disabled={pdfLoading[so.soId]}
                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            title="Download Consolidated PDF"
                          >
                            {pdfLoading[so.soId] === 'download' ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            )}
                            <span>Download</span>
                          </button>
                        </>
                      )}
                      
                      {/* Only show Add Challan button if SO is not Delivered */}
                      {so.soStatus !== 'Delivered' && (
                        <button
                          onClick={() => handleCreateChallanForSO(so)}
                          className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all flex items-center gap-2 shadow-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
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
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Challan Number</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Dispatch Date</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Dispatched Items</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {so.challans.slice(0, soChallanLimits[soKey] || 5).map((challan) => {
                          const challanStatus = getChallanDisplayStatus(challan.items || []);
                          
                          return (
                            <tr key={challan._id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <span className="text-sm font-semibold text-gray-900">{challan.challanNumber}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-700 font-medium">
                                  {salesChallanUtils.formatDate(challan.challanDate)}
                                </div>
                              </td>
                              <td className="min-w-[360px] px-6 py-3">
                                <div className="divide-y divide-gray-100">
                                  {challan.items?.map((item, idx) => {
                                    const exactWeights = Array.isArray(item.subProductWeights)
                                      ? item.subProductWeights
                                      : [];
                                    const itemWeight = exactWeights.length > 0
                                      ? exactWeights.reduce((sum, weight) => sum + (Number(weight) || 0), 0)
                                      : Number(item.weight) || 0;
                                    return (
                                      <div
                                        key={item._id || `${challan._id}-item-${idx}`}
                                        className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 py-2 first:pt-0 last:pb-0"
                                      >
                                        <p className="min-w-0 break-words text-sm font-medium text-gray-900">
                                          {item.subProductName
                                            ? `${item.productName} X ${item.subProductName}`
                                            : item.productName}
                                        </p>
                                        <div className="whitespace-nowrap text-right">
                                          <p className="text-sm font-semibold text-gray-900">
                                            {item.dispatchQuantity} {item.unit}
                                          </p>
                                          <p className="text-xs text-gray-500">{itemWeight.toFixed(2)} kg</p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-lg ${
                                  challanStatus === 'Delivered' ? 'bg-green-100 text-green-700' :
                                  challanStatus === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {challanStatus}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  {/* View Details */}
                                  <button 
                                    onClick={() => {
                                      setSelectedChallan(challan);
                                      setShowDetailModal(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-medium rounded-lg transition-all shadow-sm"
                                    title="View Details"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    View
                                  </button>

                                  {/* Preview PDF */}
                                  <button
                                    onClick={() => handlePreviewChallanPDF(challan._id, challan.challanNumber)}
                                    disabled={!!challanPdfLoading[challan._id]}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white text-xs font-medium rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Preview PDF"
                                  >
                                    {challanPdfLoading[challan._id] === 'preview' ? (
                                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                                    ) : (
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                    )}
                                    PDF
                                  </button>

                                  {/* Download PDF */}
                                  <button
                                    onClick={() => handleDownloadChallanPDF(challan._id, challan.challanNumber)}
                                    disabled={!!challanPdfLoading[challan._id]}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-xs font-medium rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Download PDF"
                                  >
                                    {challanPdfLoading[challan._id] === 'download' ? (
                                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                                    ) : (
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                      </svg>
                                    )}
                                    DL
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    
                    {/* Load More Button */}
                    {so.challans.length > (soChallanLimits[soKey] || 5) && (
                      <div className="px-6 py-4 border-t border-gray-100 text-center bg-gray-50">
                        <button
                          onClick={() => loadMoreChallans(soKey)}
                          className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-semibold transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
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
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{((currentSOPage - 1) * sosPerPage) + 1}</span> to{' '}
                  <span className="font-semibold text-gray-900">{Math.min(currentSOPage * sosPerPage, groupedBySO.length)}</span> of{' '}
                  <span className="font-semibold text-gray-900">{groupedBySO.length}</span> Sales Orders
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentSOPage(Math.max(1, currentSOPage - 1))}
                    disabled={currentSOPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>
                  <span className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg text-sm font-semibold shadow-sm">
                    {currentSOPage} of {Math.ceil(groupedBySO.length / sosPerPage)}
                  </span>
                  <button
                    onClick={() => setCurrentSOPage(Math.min(Math.ceil(groupedBySO.length / sosPerPage), currentSOPage + 1))}
                    disabled={currentSOPage === Math.ceil(groupedBySO.length / sosPerPage)}
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
      {showCreateModal && (
        <CreateChallanModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedSO(null);
          }}
          onSubmit={handleCreateChallan}
          preSelectedOrderId={selectedSO?.soId || selectedSO?._id || location.state?.selectedSalesOrderId || location.state?.selectedOrderId}
        />
      )}

      {showDetailModal && selectedChallan && (
        <ChallanDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          challan={selectedChallan}
        />
      )}

      <PdfPreviewModal
        isOpen={pdfPreviewModal.open}
        url={pdfPreviewModal.url}
        title="Delivery challan"
        reference={pdfPreviewModal.challanNumber}
        description="Individual challan document"
        onClose={closePdfPreviewModal}
        onDownload={() => handleDownloadChallanPDF(
          pdfPreviewModal.challanId,
          pdfPreviewModal.challanNumber
        )}
        downloading={challanPdfLoading[pdfPreviewModal.challanId] === 'download'}
      />

      <PdfPreviewModal
        isOpen={consolidatedPreviewModal.open}
        url={consolidatedPreviewModal.url}
        title="Consolidated delivery challan"
        reference={consolidatedPreviewModal.soNumber}
        description="All challans for this sales order"
        onClose={closeConsolidatedPreviewModal}
        onDownload={() => handleDownloadPDF(
          consolidatedPreviewModal.soId,
          consolidatedPreviewModal.soNumber
        )}
        downloading={pdfLoading[consolidatedPreviewModal.soId] === 'download'}
      />

    </div>
  );
};

export default SalesChallan;
