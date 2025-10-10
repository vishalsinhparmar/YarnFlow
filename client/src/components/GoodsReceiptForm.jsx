import React, { useState } from 'react';

const GoodsReceiptForm = ({ purchaseOrder, onSubmit, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [notes, setNotes] = useState('');
  const [receivedItems, setReceivedItems] = useState(
    purchaseOrder.items.map(item => ({
      itemId: item._id,
      productName: item.productName,
      productCode: item.productCode,
      orderedQuantity: item.quantity,
      receivedQuantity: item.receivedQuantity || 0,
      pendingQuantity: item.pendingQuantity || item.quantity,
      unit: item.unit,
      newReceiptQuantity: 0,
      notes: ''
    }))
  );

  const handleQuantityChange = (index, quantity) => {
    const updatedItems = [...receivedItems];
    const item = updatedItems[index];
    const newQuantity = Math.max(0, Number(quantity));
    const maxAllowed = item.pendingQuantity;
    
    // Don't allow receiving more than pending quantity
    updatedItems[index] = {
      ...item,
      newReceiptQuantity: Math.min(newQuantity, maxAllowed)
    };
    
    setReceivedItems(updatedItems);
    
    // Clear error if quantity is valid
    if (errors[`item_${index}`] && newQuantity > 0 && newQuantity <= maxAllowed) {
      setErrors(prev => ({
        ...prev,
        [`item_${index}`]: ''
      }));
    }
  };

  const handleItemNotesChange = (index, itemNotes) => {
    const updatedItems = [...receivedItems];
    updatedItems[index] = {
      ...updatedItems[index],
      notes: itemNotes
    };
    setReceivedItems(updatedItems);
  };

  const validateForm = () => {
    const newErrors = {};
    let hasItemsToReceive = false;

    receivedItems.forEach((item, index) => {
      if (item.newReceiptQuantity > 0) {
        hasItemsToReceive = true;
        
        if (item.newReceiptQuantity > item.pendingQuantity) {
          newErrors[`item_${index}`] = `Cannot receive more than ${item.pendingQuantity} ${item.unit}`;
        }
      }
    });

    if (!hasItemsToReceive) {
      newErrors.general = 'Please specify quantities to receive for at least one item';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // Prepare received items data (only items with quantity > 0)
      const itemsToReceive = receivedItems
        .filter(item => item.newReceiptQuantity > 0)
        .map(item => ({
          itemId: item.itemId,
          quantity: item.newReceiptQuantity,
          notes: item.notes
        }));

      await onSubmit(purchaseOrder._id, itemsToReceive, notes);
    } catch (error) {
      console.error('Error submitting goods receipt:', error);
      setErrors({ submit: error.message || 'Failed to process goods receipt' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTotalReceiving = () => {
    return receivedItems.reduce((total, item) => total + item.newReceiptQuantity, 0);
  };

  const getItemsWithReceipt = () => {
    return receivedItems.filter(item => item.newReceiptQuantity > 0);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600 text-sm">{errors.submit}</p>
        </div>
      )}

      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600 text-sm">{errors.general}</p>
        </div>
      )}

      {/* PO Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Purchase Order Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">PO Number:</span>
            <p className="text-gray-900">{purchaseOrder.poNumber}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Supplier:</span>
            <p className="text-gray-900">{purchaseOrder.supplierDetails?.companyName}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Expected Delivery:</span>
            <p className="text-gray-900">
              {new Date(purchaseOrder.expectedDeliveryDate).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Items to Receive */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Items to Receive</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ordered
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Previously Received
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receiving Now
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {receivedItems.map((item, index) => (
                <tr key={item.itemId} className={item.pendingQuantity === 0 ? 'bg-gray-50' : ''}>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                    <div className="text-sm text-gray-500">{item.productCode}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {item.orderedQuantity} {item.unit}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {item.receivedQuantity} {item.unit}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    <span className={item.pendingQuantity === 0 ? 'text-green-600 font-medium' : ''}>
                      {item.pendingQuantity} {item.unit}
                    </span>
                    {item.pendingQuantity === 0 && (
                      <div className="text-xs text-green-600">Fully Received</div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {item.pendingQuantity > 0 ? (
                      <div>
                        <input
                          type="number"
                          value={item.newReceiptQuantity}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          className={`w-24 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors[`item_${index}`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          min="0"
                          max={item.pendingQuantity}
                          step="1"
                        />
                        <span className="ml-1 text-sm text-gray-500">{item.unit}</span>
                        {errors[`item_${index}`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`item_${index}`]}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {item.pendingQuantity > 0 ? (
                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) => handleItemNotesChange(index, e.target.value)}
                        className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Item notes..."
                      />
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Summary */}
      {getTotalReceiving() > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-md font-semibold text-blue-900 mb-2">Receipt Summary</h4>
          <div className="space-y-2">
            <div className="text-sm text-blue-800">
              <span className="font-medium">Items being received:</span> {getItemsWithReceipt().length}
            </div>
            <div className="text-sm text-blue-800">
              <span className="font-medium">Total units:</span> {getTotalReceiving()}
            </div>
            <div className="space-y-1">
              {getItemsWithReceipt().map((item, index) => (
                <div key={item.itemId} className="text-xs text-blue-700">
                  • {item.productName}: {item.newReceiptQuantity} {item.unit}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* General Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Receipt Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows="4"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Add any notes about this goods receipt (quality issues, partial delivery reasons, etc.)..."
        />
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-yellow-800 mb-2">Instructions:</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Enter the actual quantities received for each item</li>
          <li>• You cannot receive more than the pending quantity</li>
          <li>• Items marked as "Fully Received" cannot be modified</li>
          <li>• Add notes for any quality issues or discrepancies</li>
          <li>• Inventory will be automatically updated after submission</li>
        </ul>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || getTotalReceiving() === 0}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : `Receive ${getTotalReceiving()} Items`}
        </button>
      </div>
    </form>
  );
};

export default GoodsReceiptForm;
