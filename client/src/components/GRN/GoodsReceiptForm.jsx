import React, { useState } from 'react';
import { Plus, Minus, Package, CheckCircle, FileText } from 'lucide-react';

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
    <form onSubmit={handleSubmit} className="space-y-5">
      {(errors.submit || errors.general) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm font-medium">{errors.submit || errors.general}</p>
        </div>
      )}

      {/* PO Summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">PO Number</p>
            <p className="font-bold text-gray-900">{purchaseOrder.poNumber}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Supplier</p>
            <p className="font-bold text-gray-900">{purchaseOrder.supplierDetails?.companyName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Expected Delivery</p>
            <p className="font-bold text-gray-900">
              {new Date(purchaseOrder.expectedDeliveryDate).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-4 h-4 text-green-600" />
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Items to Receive</h3>
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Ordered</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-green-700 uppercase tracking-wide">Receiving Now</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {receivedItems.map((item, index) => (
                <tr key={item.itemId} className={item.pendingQuantity === 0 ? 'bg-green-50' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold text-gray-900">{item.productName}</div>
                    {item.productCode && <div className="text-xs text-gray-400">{item.productCode}</div>}
                    {item.pendingQuantity === 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <span className="text-xs text-green-600 font-medium">Fully Received</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <span className="font-medium">{item.orderedQuantity}</span>
                    <span className="text-gray-400 ml-1">{item.unit}</span>
                  </td>
                  <td className="px-4 py-3">
                    {item.pendingQuantity > 0 ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(index, Math.max(0, item.newReceiptQuantity - 1))}
                            className="p-1 bg-gray-100 hover:bg-red-50 hover:border-red-300 rounded border border-gray-300 transition-colors"
                            disabled={item.newReceiptQuantity <= 0}
                          >
                            <Minus className="w-3.5 h-3.5 text-gray-600" />
                          </button>
                          <input
                            type="number"
                            value={item.newReceiptQuantity}
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                            className={`w-20 px-2 py-1.5 text-sm text-center border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-medium ${
                              errors[`item_${index}`] ? 'border-red-400 bg-red-50' : 'border-gray-300'
                            }`}
                            min="0"
                            max={item.pendingQuantity}
                            step="1"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(index, Math.min(item.pendingQuantity, item.newReceiptQuantity + 1))}
                            className="p-1 bg-gray-100 hover:bg-green-50 hover:border-green-300 rounded border border-gray-300 transition-colors"
                            disabled={item.newReceiptQuantity >= item.pendingQuantity}
                          >
                            <Plus className="w-3.5 h-3.5 text-gray-600" />
                          </button>
                          <span className="text-xs text-gray-500">{item.unit}</span>
                        </div>
                        {errors[`item_${index}`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`item_${index}`]}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {item.pendingQuantity > 0 ? (
                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) => handleItemNotesChange(index, e.target.value)}
                        className="w-36 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Optional..."
                      />
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
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
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <h4 className="text-sm font-semibold text-green-900">Receipt Summary</h4>
          </div>
          <div className="space-y-1">
            {getItemsWithReceipt().map((item) => (
              <div key={item.itemId} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{item.productName}</span>
                <span className="font-semibold text-green-700">{item.newReceiptQuantity} {item.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* General Notes */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-gray-500" />
          <label className="text-sm font-semibold text-gray-700">Receipt Notes</label>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows="3"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          placeholder="Add notes about this receipt (quality issues, partial delivery, etc.)..."
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || getTotalReceiving() === 0}
          className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Confirm Receipt ({getTotalReceiving()} {receivedItems[0]?.unit || 'units'})
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default GoodsReceiptForm;
