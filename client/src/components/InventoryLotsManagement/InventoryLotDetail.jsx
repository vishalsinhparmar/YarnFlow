import React, { useState, useEffect } from 'react';
import { inventoryAPI, inventoryUtils } from '../../services/inventoryAPI';

const InventoryLotDetail = ({ isOpen, onClose, lot, onRefresh }) => {
  const [lotDetail, setLotDetail] = useState(null);
  const [movementHistory, setMovementHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (isOpen && lot) {
      fetchLotDetail();
      fetchMovementHistory();
    }
  }, [isOpen, lot]);

  const fetchLotDetail = async () => {
    try {
      const response = await inventoryAPI.getById(lot._id);
      if (response.success) {
        setLotDetail(response.data);
      }
    } catch (error) {
      console.error('Error fetching lot detail:', error);
    }
  };

  const fetchMovementHistory = async () => {
    try {
      const response = await inventoryAPI.getMovementHistory(lot._id, { limit: 20 });
      if (response.success) {
        setMovementHistory(response.data.movements || []);
      }
    } catch (error) {
      console.error('Error fetching movement history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await inventoryAPI.acknowledgeAlert(lot._id, alertId);
      fetchLotDetail(); // Refresh to update alert status
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  if (!isOpen || !lot) return null;

  const currentLot = lotDetail || lot;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Lot Details - {currentLot.lotNumber}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{currentLot.productName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'movements'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Movement History
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'alerts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Alerts {currentLot.alerts?.filter(a => !a.acknowledged).length > 0 && (
                <span className="ml-1 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                  {currentLot.alerts.filter(a => !a.acknowledged).length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Lot Number:</span>
                          <span className="font-medium">{currentLot.lotNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Product:</span>
                          <span className="font-medium">{currentLot.productName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Product Code:</span>
                          <span className="font-medium">{currentLot.productCode}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            inventoryUtils.getStatusColor(currentLot.status)
                          }`}>
                            {inventoryUtils.formatStatus(currentLot.status)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quality Status:</span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            inventoryUtils.getQualityStatusColor(currentLot.qualityStatus)
                          }`}>
                            {inventoryUtils.formatQualityStatus(currentLot.qualityStatus)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Quantity Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Received Quantity:</span>
                          <span className="font-medium">{currentLot.receivedQuantity} {currentLot.unit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Current Quantity:</span>
                          <span className="font-medium text-green-600">{currentLot.currentQuantity} {currentLot.unit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Reserved Quantity:</span>
                          <span className="font-medium text-yellow-600">{currentLot.reservedQuantity || 0} {currentLot.unit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Available Quantity:</span>
                          <span className="font-medium text-blue-600">{currentLot.availableQuantity || currentLot.currentQuantity} {currentLot.unit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Unit Cost:</span>
                          <span className="font-medium">{inventoryUtils.formatCurrency(currentLot.unitCost || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Value:</span>
                          <span className="font-medium text-purple-600">{inventoryUtils.formatCurrency(currentLot.totalCost || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Supplier and Reference Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Supplier Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Supplier:</span>
                          <span className="font-medium">{currentLot.supplierName || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Supplier Batch:</span>
                          <span className="font-medium">{currentLot.supplierBatchNumber || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">GRN Number:</span>
                          <span className="font-medium">{currentLot.grnNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">PO Number:</span>
                          <span className="font-medium">{currentLot.poNumber || '-'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Storage Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Warehouse:</span>
                          <span className="font-medium">{currentLot.warehouse || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Location:</span>
                          <span className="font-medium">{inventoryUtils.formatLocation(currentLot.location)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Received Date:</span>
                          <span className="font-medium">{inventoryUtils.formatDate(currentLot.receivedDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Expiry Date:</span>
                          <span className="font-medium">{inventoryUtils.formatDate(currentLot.expiryDate)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {currentLot.notes && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Notes</h4>
                      <p className="text-sm text-gray-700">{currentLot.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Movement History Tab */}
              {activeTab === 'movements' && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Movement History</h4>
                  {movementHistory.length > 0 ? (
                    <div className="space-y-3">
                      {movementHistory.map((movement, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <span className="text-lg mr-3">
                                {inventoryUtils.getMovementTypeIcon(movement.type)}
                              </span>
                              <div>
                                <span className="font-medium text-gray-900">
                                  {inventoryUtils.formatMovementType(movement.type)}
                                </span>
                                <span className="ml-2 text-sm text-gray-600">
                                  {movement.quantity} {currentLot.unit}
                                </span>
                              </div>
                            </div>
                            <span className="text-sm text-gray-500">
                              {inventoryUtils.formatRelativeTime(movement.date)}
                            </span>
                          </div>
                          {movement.reference && (
                            <div className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">Reference:</span> {movement.reference}
                            </div>
                          )}
                          {movement.notes && (
                            <div className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">Notes:</span> {movement.notes}
                            </div>
                          )}
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">Performed by:</span> {movement.performedBy}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No movement history available
                    </div>
                  )}
                </div>
              )}

              {/* Alerts Tab */}
              {activeTab === 'alerts' && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Alerts</h4>
                  {currentLot.alerts && currentLot.alerts.length > 0 ? (
                    <div className="space-y-3">
                      {currentLot.alerts.map((alert, index) => (
                        <div key={index} className={`border rounded-lg p-4 ${
                          alert.acknowledged ? 'bg-gray-50 border-gray-200' : inventoryUtils.getAlertPriorityColor(alert.type)
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <span className="font-medium">
                                {alert.type.replace('_', ' ')}
                              </span>
                              {alert.acknowledged && (
                                <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                  Acknowledged
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">
                              {inventoryUtils.formatRelativeTime(alert.date)}
                            </span>
                          </div>
                          <p className="text-sm mb-2">{alert.message}</p>
                          {!alert.acknowledged && (
                            <button
                              onClick={() => handleAcknowledgeAlert(alert._id)}
                              className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                            >
                              Acknowledge
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No alerts for this lot
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Close
            </button>
            <button
              onClick={() => {
                onRefresh();
                onClose();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Refresh & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryLotDetail;
