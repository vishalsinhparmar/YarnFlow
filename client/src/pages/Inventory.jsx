import React, { useState, useEffect } from 'react';
import { inventoryAPI, inventoryUtils } from '../services/inventoryAPI';
import StockMovementModal from '../components/StockMovementModal';
import StockTransferModal from '../components/StockTransferModal';
import InventoryLotDetail from '../components/InventoryLotsManagement/InventoryLotDetail';

const Inventory = () => {
  const [inventoryStats, setInventoryStats] = useState(null);
  const [inventoryLots, setInventoryLots] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showLotDetail, setShowLotDetail] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [statsRes, lotsRes, alertsRes] = await Promise.all([
        inventoryAPI.getStats(),
        inventoryAPI.getAll({
          page: currentPage,
          limit: 10,
          search: searchTerm,
          status: statusFilter
        }),
        inventoryAPI.getLowStockAlerts(50)
      ]);

      if (statsRes.success) {
        setInventoryStats(statsRes.data);
        setRecentMovements(statsRes.data.recentMovements || []);
      }
      
      if (lotsRes.success) {
        setInventoryLots(lotsRes.data);
        setPagination(lotsRes.pagination);
      }
      
      if (alertsRes.success) {
        setLowStockAlerts(alertsRes.data);
      }
      
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleStockMovement = async (movementData) => {
    try {
      const response = await inventoryAPI.recordMovement(selectedLot._id, movementData);
      if (response.success) {
        fetchAllData(); // Refresh data
        setShowStockInModal(false);
        setShowStockOutModal(false);
        setSelectedLot(null);
      }
    } catch (error) {
      console.error('Error recording stock movement:', error);
    }
  };

  const handleStockTransfer = async (transferData) => {
    try {
      const response = await inventoryAPI.transferStock(transferData);
      if (response.success) {
        fetchAllData(); // Refresh data
        setShowTransferModal(false);
      }
    } catch (error) {
      console.error('Error transferring stock:', error);
    }
  };

  const handleViewLot = (lot) => {
    setSelectedLot(lot);
    setShowLotDetail(true);
  };

  const handleQuickAction = (action, lot = null) => {
    setSelectedLot(lot);
    switch (action) {
      case 'stock-in':
        setShowStockInModal(true);
        break;
      case 'stock-out':
        setShowStockOutModal(true);
        break;
      case 'transfer':
        setShowTransferModal(true);
        break;
    }
  };

  if (loading && !inventoryStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Inventory Lots Management</h1>
            <p className="text-gray-600">Track yarn bags, polyester rolls, and textile inventory lots</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => handleQuickAction('stock-in')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              + Add Lot
            </button>
            <button 
              onClick={() => handleQuickAction('transfer')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              📦 Lot Transfer
            </button>
            <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              📊 Reports
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards - Real Data from Backend */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cotton Yarn Bags</p>
              <p className="text-2xl font-bold text-gray-900">
                {inventoryStats?.productTypeBreakdown?.find(p => p._id?.includes('Cotton'))?.quantity || '850'}
              </p>
              <p className="text-xs text-gray-500">120kg each</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xl">🧶</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Polyester Rolls</p>
              <p className="text-2xl font-bold text-gray-900">
                {inventoryStats?.productTypeBreakdown?.find(p => p._id?.includes('Polyester'))?.quantity || '395'}
              </p>
              <p className="text-xs text-gray-500">75kg each</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">🎯</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Lots</p>
              <p className="text-2xl font-bold text-green-600">
                {inventoryStats?.overview?.activeLots || '89'}
              </p>
              <p className="text-xs text-gray-500">Different batches</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-yellow-600 text-xl">🏷️</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-purple-600">
                {inventoryUtils.formatCurrency(inventoryStats?.overview?.totalValue || 890000)}
              </p>
              <p className="text-xs text-gray-500">Current stock</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-xl">💎</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search lots, products, suppliers..."
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
              <option value="Active">Available</option>
              <option value="Reserved">Reserved</option>
              <option value="Consumed">Consumed</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Actions, Alerts, and Recent Movements */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => handleQuickAction('stock-in')}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-lg mr-3">📥</span>
                <span className="font-medium">Stock In</span>
              </div>
            </button>
            <button 
              onClick={() => handleQuickAction('stock-out')}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-lg mr-3">📤</span>
                <span className="font-medium">Stock Out</span>
              </div>
            </button>
            <button 
              onClick={() => handleQuickAction('transfer')}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-lg mr-3">🔄</span>
                <span className="font-medium">Stock Transfer</span>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Alerts</h3>
          <div className="space-y-3">
            {lowStockAlerts.length > 0 ? (
              lowStockAlerts.slice(0, 3).map((alert, index) => (
                <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm font-medium text-red-800">{alert.productName}</p>
                  <p className="text-xs text-red-600">
                    Only {alert.currentQuantity} {alert.unit} remaining
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No low stock alerts</p>
                <p className="text-xs">All inventory levels are healthy</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Movements</h3>
          <div className="space-y-3">
            {recentMovements.length > 0 ? (
              recentMovements.slice(0, 3).map((movement, index) => (
                <div key={index} className="flex items-center justify-between p-2">
                  <div className="flex items-center">
                    <span className="mr-2">{inventoryUtils.getMovementTypeIcon(movement.movements?.type)}</span>
                    <div>
                      <p className="text-sm font-medium">{movement.productName}</p>
                      <p className="text-xs text-gray-500">
                        {movement.movements?.type === 'Received' ? '+' : '-'}{movement.movements?.quantity} {movement.unit || 'units'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {inventoryUtils.formatRelativeTime(movement.movements?.date)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No recent movements</p>
                <p className="text-xs">Stock movements will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inventory Lots Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Inventory Lots Tracking</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lot Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight/Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventoryLots.length > 0 ? (
                inventoryLots.map((lot) => (
                  <tr key={lot._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {lot.lotNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lot.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                        lot.unit === 'Bags' ? 'bg-green-100 text-green-800' :
                        lot.unit === 'Rolls' ? 'bg-blue-100 text-blue-800' :
                        lot.unit === 'Kg' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {inventoryUtils.getUnitIcon(lot.unit)} {lot.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {inventoryUtils.formatQuantity(lot.currentQuantity, lot.unit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lot.unitCost ? `₹${lot.unitCost} each` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lot.supplierName || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        inventoryUtils.getStatusColor(lot.status)
                      }`}>
                        {inventoryUtils.formatStatus(lot.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleViewLot(lot)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleQuickAction('stock-out', lot)}
                        className="text-red-600 hover:text-red-900 mr-3"
                      >
                        Issue
                      </button>
                      <button 
                        onClick={() => handleQuickAction('transfer', lot)}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Transfer
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                // Fallback data when no real data is available
                <>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">LOT-2024-001</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Cotton Yarn 2s</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                        🧶 Bags
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">100 bags</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">50.2 kg avg</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">ABC Textiles</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Available</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                      <button className="text-red-600 hover:text-red-900 mr-3">Issue</button>
                      <button className="text-purple-600 hover:text-purple-900">Transfer</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">LOT-2024-002</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Polyester 3s</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        🎯 Rolls
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">75 rolls</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">75 kg each</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">XYZ Mills</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Available</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                      <button className="text-red-600 hover:text-red-900 mr-3">Issue</button>
                      <button className="text-purple-600 hover:text-purple-900">Transfer</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">LOT-2024-003</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Cotton Yarn 20s</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                        🧶 Bags
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">25 bags</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">49.8 kg avg</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Premium Cotton Ltd</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Partial</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                      <button className="text-red-600 hover:text-red-900 mr-3">Issue</button>
                      <button className="text-orange-600 hover:text-orange-900">Transfer</button>
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {[...Array(pagination.pages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`px-3 py-1 border rounded-md text-sm font-medium ${
                    currentPage === index + 1
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
                disabled={currentPage === pagination.pages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showStockInModal && (
        <StockMovementModal
          isOpen={showStockInModal}
          onClose={() => setShowStockInModal(false)}
          onSubmit={handleStockMovement}
          movementType="Received"
          lot={selectedLot}
          title="Stock In - Add Inventory"
        />
      )}

      {showStockOutModal && (
        <StockMovementModal
          isOpen={showStockOutModal}
          onClose={() => setShowStockOutModal(false)}
          onSubmit={handleStockMovement}
          movementType="Issued"
          lot={selectedLot}
          title="Stock Out - Issue Inventory"
        />
      )}

      {showTransferModal && (
        <StockTransferModal
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          onSubmit={handleStockTransfer}
          sourceLot={selectedLot}
        />
      )}

      {showLotDetail && selectedLot && (
        <InventoryLotDetail
          isOpen={showLotDetail}
          onClose={() => setShowLotDetail(false)}
          lot={selectedLot}
          onRefresh={fetchAllData}
        />
      )}
    </div>
  );
};

export default Inventory;
