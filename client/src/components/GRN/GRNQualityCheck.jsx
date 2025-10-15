import React, { useState } from 'react';

const GRNQualityCheck = ({ grn, onSubmit, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [qualityData, setQualityData] = useState({
    qualityCheckBy: '',
    qualityRemarks: '',
    items: grn.items?.map(item => ({
      itemId: item._id,
      productName: item.productName,
      productCode: item.productCode,
      receivedQuantity: item.receivedQuantity,
      acceptedQuantity: item.acceptedQuantity || item.receivedQuantity,
      rejectedQuantity: item.rejectedQuantity || 0,
      damageQuantity: item.damageQuantity || 0,
      qualityStatus: item.qualityStatus || 'Pending',
      qualityNotes: item.qualityNotes || '',
      unit: item.unit
    })) || []
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setQualityData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...qualityData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    // Auto-calculate accepted quantity when other quantities change
    if (field === 'rejectedQuantity' || field === 'damageQuantity') {
      const item = updatedItems[index];
      const received = Number(item.receivedQuantity) || 0;
      const rejected = Number(item.rejectedQuantity) || 0;
      const damaged = Number(item.damageQuantity) || 0;
      
      updatedItems[index].acceptedQuantity = Math.max(0, received - rejected - damaged);
      
      // Auto-update quality status based on quantities
      if (rejected > 0 && updatedItems[index].acceptedQuantity > 0) {
        updatedItems[index].qualityStatus = 'Partial';
      } else if (rejected >= received || damaged >= received) {
        updatedItems[index].qualityStatus = 'Rejected';
      } else if (updatedItems[index].acceptedQuantity === received) {
        updatedItems[index].qualityStatus = 'Approved';
      }
    }
    
    setQualityData(prev => ({
      ...prev,
      items: updatedItems
    }));

    // Clear item-specific errors
    const errorKey = `items.${index}.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Basic validations
    if (!qualityData.qualityCheckBy) {
      newErrors.qualityCheckBy = 'Quality checker name is required';
    }

    // Item validations
    qualityData.items.forEach((item, index) => {
      const received = Number(item.receivedQuantity) || 0;
      const accepted = Number(item.acceptedQuantity) || 0;
      const rejected = Number(item.rejectedQuantity) || 0;
      const damaged = Number(item.damageQuantity) || 0;
      
      if (accepted + rejected + damaged > received) {
        newErrors[`items.${index}.quantities`] = 'Accepted + Rejected + Damaged cannot exceed received quantity';
      }
      
      if (accepted < 0 || rejected < 0 || damaged < 0) {
        newErrors[`items.${index}.negative`] = 'Quantities cannot be negative';
      }
    });

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
      
      // Prepare data for submission
      const submitData = {
        ...qualityData,
        items: qualityData.items.map(item => ({
          ...item,
          acceptedQuantity: Number(item.acceptedQuantity),
          rejectedQuantity: Number(item.rejectedQuantity),
          damageQuantity: Number(item.damageQuantity)
        }))
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting quality check:', error);
      setErrors({ submit: error.message || 'Failed to save quality check' });
    } finally {
      setLoading(false);
    }
  };

  const getTotalsByStatus = () => {
    const totals = {
      received: 0,
      accepted: 0,
      rejected: 0,
      damaged: 0
    };
    
    qualityData.items.forEach(item => {
      totals.received += Number(item.receivedQuantity) || 0;
      totals.accepted += Number(item.acceptedQuantity) || 0;
      totals.rejected += Number(item.rejectedQuantity) || 0;
      totals.damaged += Number(item.damageQuantity) || 0;
    });
    
    return totals;
  };

  const totals = getTotalsByStatus();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600 text-sm">{errors.submit}</p>
        </div>
      )}

      {/* GRN Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">GRN Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">GRN Number:</span>
            <p className="text-gray-900">{grn.grnNumber}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">PO Reference:</span>
            <p className="text-gray-900">{grn.poNumber}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Supplier:</span>
            <p className="text-gray-900">{grn.supplierDetails?.companyName}</p>
          </div>
        </div>
      </div>

      {/* Quality Check Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Quality Check Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quality Checked By *
            </label>
            <input
              type="text"
              name="qualityCheckBy"
              value={qualityData.qualityCheckBy}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.qualityCheckBy ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter quality checker name"
            />
            {errors.qualityCheckBy && (
              <p className="text-red-500 text-xs mt-1">{errors.qualityCheckBy}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quality Check Date
            </label>
            <input
              type="date"
              value={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              disabled
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quality Remarks
          </label>
          <textarea
            name="qualityRemarks"
            value={qualityData.qualityRemarks}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Overall quality remarks for this GRN..."
          />
        </div>
      </div>

      {/* Items Quality Check */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Items Quality Check</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Received
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accepted
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rejected
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Damaged
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quality Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {qualityData.items.map((item, index) => (
                <tr key={item.itemId} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                    <div className="text-sm text-gray-500">{item.productCode}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {item.receivedQuantity} {item.unit}
                  </td>
                  <td className="px-4 py-4">
                    <input
                      type="number"
                      value={item.acceptedQuantity}
                      onChange={(e) => handleItemChange(index, 'acceptedQuantity', e.target.value)}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max={item.receivedQuantity}
                      step="1"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <input
                      type="number"
                      value={item.rejectedQuantity}
                      onChange={(e) => handleItemChange(index, 'rejectedQuantity', e.target.value)}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max={item.receivedQuantity}
                      step="1"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <input
                      type="number"
                      value={item.damageQuantity}
                      onChange={(e) => handleItemChange(index, 'damageQuantity', e.target.value)}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max={item.receivedQuantity}
                      step="1"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={item.qualityStatus}
                      onChange={(e) => handleItemChange(index, 'qualityStatus', e.target.value)}
                      className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Partial">Partial</option>
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <input
                      type="text"
                      value={item.qualityNotes}
                      onChange={(e) => handleItemChange(index, 'qualityNotes', e.target.value)}
                      className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Quality notes..."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Show quantity validation errors */}
        {qualityData.items.some((_, index) => errors[`items.${index}.quantities`] || errors[`items.${index}.negative`]) && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600 text-sm">Please check item quantities:</p>
            <ul className="text-red-600 text-sm mt-1 list-disc list-inside">
              <li>Accepted + Rejected + Damaged cannot exceed received quantity</li>
              <li>All quantities must be positive numbers</li>
            </ul>
          </div>
        )}
      </div>

      {/* Quality Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-md font-semibold text-blue-900 mb-3">Quality Check Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{totals.received}</div>
            <div className="text-gray-600">Total Received</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{totals.accepted}</div>
            <div className="text-gray-600">Accepted</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">{totals.rejected}</div>
            <div className="text-gray-600">Rejected</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-orange-600">{totals.damaged}</div>
            <div className="text-gray-600">Damaged</div>
          </div>
        </div>
        
        {totals.received > 0 && (
          <div className="mt-4">
            <div className="text-sm text-blue-800 mb-2">Quality Check Progress:</div>
            <div className="flex space-x-1 h-4 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="bg-green-500" 
                style={{ width: `${(totals.accepted / totals.received) * 100}%` }}
              ></div>
              <div 
                className="bg-red-500" 
                style={{ width: `${(totals.rejected / totals.received) * 100}%` }}
              ></div>
              <div 
                className="bg-orange-500" 
                style={{ width: `${(totals.damaged / totals.received) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-blue-700 mt-1">
              <span>Accepted: {((totals.accepted / totals.received) * 100).toFixed(1)}%</span>
              <span>Rejected: {((totals.rejected / totals.received) * 100).toFixed(1)}%</span>
              <span>Damaged: {((totals.damaged / totals.received) * 100).toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-yellow-800 mb-2">Quality Check Instructions:</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Review each item for quality, damage, and compliance with specifications</li>
          <li>• Enter accepted, rejected, and damaged quantities for each item</li>
          <li>• Accepted + Rejected + Damaged should equal the received quantity</li>
          <li>• Add quality notes for any issues or observations</li>
          <li>• Quality status will be auto-updated based on your entries</li>
          <li>• Approved items will be added to inventory after GRN approval</li>
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
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Complete Quality Check'}
        </button>
      </div>
    </form>
  );
};

export default GRNQualityCheck;
