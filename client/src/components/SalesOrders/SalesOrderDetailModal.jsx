import React, { useState } from 'react';
import { salesOrderUtils } from '../../services/salesOrderAPI';

const SalesOrderDetailModal = ({ isOpen, onClose, order }) => {
  const [activeTab, setActiveTab] = useState('details');

  if (!isOpen || !order) return null;

  const tabs = [
    { id: 'details', label: 'Order Details', icon: '📋' },
    { id: 'items', label: 'Items', icon: '📦' },
    { id: 'workflow', label: 'Workflow History', icon: '🔄' },
    { id: 'shipping', label: 'Shipping Info', icon: '🚚' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Sales Order Details
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {order.soNumber} - {order.customerDetails?.companyName}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${salesOrderUtils.getStatusColor(order.status)}`}>
              {salesOrderUtils.getStatusIcon(order.status)} {order.status}
            </span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Order Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Order Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">SO Number:</span>
                      <span className="text-sm text-gray-900">{order.soNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Order Date:</span>
                      <span className="text-sm text-gray-900">{salesOrderUtils.formatDate(order.orderDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Expected Delivery:</span>
                      <span className="text-sm text-gray-900">{salesOrderUtils.formatDate(order.expectedDeliveryDate)}</span>
                    </div>
                    {order.actualDeliveryDate && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Actual Delivery:</span>
                        <span className="text-sm text-gray-900">{salesOrderUtils.formatDate(order.actualDeliveryDate)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Payment Status:</span>
                      <span className={`text-sm px-2 py-1 rounded-full ${salesOrderUtils.getPaymentStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Company:</span>
                      <p className="text-sm text-gray-900">{order.customerDetails?.companyName}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Contact Person:</span>
                      <p className="text-sm text-gray-900">{order.customerDetails?.contactPerson}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Email:</span>
                      <p className="text-sm text-gray-900">{order.customerDetails?.email}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Phone:</span>
                      <p className="text-sm text-gray-900">{order.customerDetails?.phone}</p>
                    </div>
                    {order.customerDetails?.address && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Address:</span>
                        <p className="text-sm text-gray-900">
                          {order.customerDetails.address.street}, {order.customerDetails.address.city}, 
                          {order.customerDetails.address.state} - {order.customerDetails.address.pincode}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {(order.customerNotes || order.internalNotes) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {order.customerNotes && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Customer Notes</h3>
                      <p className="text-sm text-gray-700">{order.customerNotes}</p>
                    </div>
                  )}
                  {order.internalNotes && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Internal Notes</h3>
                      <p className="text-sm text-gray-700">{order.internalNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Items Tab */}
          {activeTab === 'items' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordered</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reserved</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipped</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivered</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items?.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                            <div className="text-sm text-gray-500">{item.productCode}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.orderedQuantity} {item.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.reservedQuantity || 0} {item.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.shippedQuantity || 0} {item.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.deliveredQuantity || 0} {item.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {salesOrderUtils.formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {salesOrderUtils.formatCurrency(item.totalPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${salesOrderUtils.getStatusColor(item.itemStatus)}`}>
                            {item.itemStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Workflow History Tab */}
          {activeTab === 'workflow' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Workflow History</h3>
              <div className="flow-root">
                <ul className="-mb-8">
                  {order.workflowHistory?.map((entry, index) => (
                    <li key={index}>
                      <div className="relative pb-8">
                        {index !== order.workflowHistory.length - 1 && (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${salesOrderUtils.getStatusColor(entry.status)}`}>
                              {salesOrderUtils.getStatusIcon(entry.status)}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                Status changed to <span className="font-medium text-gray-900">{entry.status}</span>
                                {entry.notes && (
                                  <span className="block text-sm text-gray-600 mt-1">{entry.notes}</span>
                                )}
                              </p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              <div>{salesOrderUtils.formatDate(entry.changedDate)}</div>
                              <div className="text-xs">by {entry.changedBy}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Shipping Info Tab */}
          {activeTab === 'shipping' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Shipping Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Shipping Details</h4>
                  <div className="space-y-3">
                    {order.trackingNumber && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Tracking Number:</span>
                        <span className="text-sm text-gray-900 font-mono">{order.trackingNumber}</span>
                      </div>
                    )}
                    {order.courierCompany && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Courier Company:</span>
                        <span className="text-sm text-gray-900">{order.courierCompany}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Shipping Address</h4>
                  {order.shippingAddress ? (
                    <div className="text-sm text-gray-700">
                      <p>{order.shippingAddress.street}</p>
                      <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                      <p>{order.shippingAddress.pincode}</p>
                      <p>{order.shippingAddress.country || 'India'}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Same as customer address</p>
                  )}
                </div>
              </div>

              {/* Inventory Allocations */}
              {order.items?.some(item => item.inventoryAllocations?.length > 0) && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Inventory Allocations</h4>
                  <div className="space-y-4">
                    {order.items.map((item, itemIndex) => (
                      item.inventoryAllocations?.length > 0 && (
                        <div key={itemIndex} className="border border-gray-200 rounded-lg p-4">
                          <h5 className="font-medium text-gray-900 mb-2">{item.productName}</h5>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lot Number</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Allocated Qty</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reserved Date</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {item.inventoryAllocations.map((allocation, allocIndex) => (
                                  <tr key={allocIndex}>
                                    <td className="px-4 py-2 text-sm text-gray-900">{allocation.lotNumber}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900">{allocation.allocatedQuantity} {item.unit}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900">{salesOrderUtils.formatDate(allocation.reservedDate)}</td>
                                    <td className="px-4 py-2">
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${salesOrderUtils.getStatusColor(allocation.status)}`}>
                                        {allocation.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div></div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesOrderDetailModal;
