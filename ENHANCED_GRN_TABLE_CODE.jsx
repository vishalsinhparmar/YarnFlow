// Enhanced Items Received Table for GRN Form
// This shows: Product, Ordered, Previously Received, Receiving Now (editable qty + weight), Pending, Progress

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
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
          Prev. Received
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
          Receiving Now *
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-orange-50">
          Pending
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Progress
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {formData.items.map((item, index) => {
        const completionPercentage = item.orderedQuantity > 0 
          ? Math.round(((item.previouslyReceived + Number(item.receivedQuantity || 0)) / item.orderedQuantity) * 100)
          : 0;
        
        return (
          <tr key={index} className="hover:bg-gray-50">
            {/* Product */}
            <td className="px-4 py-4">
              <div className="text-sm font-medium text-gray-900">{item.productName}</div>
              <div className="text-sm text-gray-500">{item.productCode}</div>
              {item.receiptStatus && item.receiptStatus !== 'Pending' && (
                <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                  item.receiptStatus === 'Complete' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {item.receiptStatus}
                </span>
              )}
            </td>
            
            {/* Ordered */}
            <td className="px-4 py-4">
              <div className="text-sm font-medium text-gray-900">
                {item.orderedQuantity} {item.unit}
              </div>
              <div className="text-xs text-gray-500">
                {item.orderedWeight > 0 ? `${item.orderedWeight} kg` : '-'}
              </div>
            </td>
            
            {/* Previously Received */}
            <td className="px-4 py-4 bg-blue-50">
              <div className="text-sm font-medium text-blue-700">
                {item.previouslyReceived || 0} {item.unit}
              </div>
              <div className="text-xs text-blue-600">
                {item.previousWeight > 0 ? `${item.previousWeight.toFixed(2)} kg` : '0 kg'}
              </div>
            </td>
            
            {/* Receiving Now (Editable Quantity + Weight) */}
            <td className="px-4 py-4 bg-green-50">
              <div className="space-y-2">
                {/* Quantity Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={item.receivedQuantity}
                    onChange={(e) => {
                      const qty = Number(e.target.value) || 0;
                      const updatedItems = [...formData.items];
                      updatedItems[index].receivedQuantity = qty;
                      
                      // Auto-calculate weight based on quantity
                      if (item.orderedQuantity > 0 && item.orderedWeight > 0) {
                        const weightPerUnit = item.orderedWeight / item.orderedQuantity;
                        updatedItems[index].receivedWeight = qty * weightPerUnit;
                        
                        // Update pending
                        updatedItems[index].pendingQuantity = item.orderedQuantity - item.previouslyReceived - qty;
                        updatedItems[index].pendingWeight = item.orderedWeight - item.previousWeight - (qty * weightPerUnit);
                      }
                      
                      setFormData(prev => ({ ...prev, items: updatedItems }));
                    }}
                    className={`w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors[`items.${index}.receivedQuantity`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min="0"
                    max={item.pendingQuantity}
                    step="1"
                  />
                  <span className="text-sm text-gray-600">{item.unit}</span>
                </div>
                
                {/* Weight Input (Editable) */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={item.receivedWeight || 0}
                    onChange={(e) => {
                      const weight = Number(e.target.value) || 0;
                      const updatedItems = [...formData.items];
                      updatedItems[index].receivedWeight = weight;
                      
                      // Update pending weight
                      updatedItems[index].pendingWeight = item.orderedWeight - item.previousWeight - weight;
                      
                      setFormData(prev => ({ ...prev, items: updatedItems }));
                    }}
                    className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    min="0"
                    step="0.01"
                  />
                  <span className="text-xs text-gray-600">kg</span>
                </div>
                
                {errors[`items.${index}.receivedQuantity`] && (
                  <p className="text-red-500 text-xs">{errors[`items.${index}.receivedQuantity`]}</p>
                )}
              </div>
            </td>
            
            {/* Pending */}
            <td className="px-4 py-4 bg-orange-50">
              <div className="text-sm font-medium text-orange-700">
                {item.pendingQuantity || 0} {item.unit}
              </div>
              <div className="text-xs text-orange-600">
                {item.pendingWeight > 0 ? `${item.pendingWeight.toFixed(2)} kg` : '0 kg'}
              </div>
            </td>
            
            {/* Progress Bar */}
            <td className="px-4 py-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full transition-all ${
                    completionPercentage === 100 ? 'bg-green-600' : 
                    completionPercentage > 0 ? 'bg-blue-600' : 'bg-gray-400'
                  }`}
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <div className="text-xs text-center text-gray-600 mt-1">
                {completionPercentage}%
              </div>
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
</div>
