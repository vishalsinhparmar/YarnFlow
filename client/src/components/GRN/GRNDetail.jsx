import { useState, useEffect } from 'react';
import { ClipboardList, Package, MapPin, X, Building2, Calendar, FileText, Warehouse, CheckCircle2, AlertCircle } from 'lucide-react';
import { warehouseAPI } from '../../services/warehouseAPI';

const GRNDetail = ({ grn, onClose }) => {
  const [resolvedWarehouse, setResolvedWarehouse] = useState('');
  
  useEffect(() => {
    const resolveWarehouse = async () => {
      if (!grn.warehouseLocation) return;
      try {
        const res = await warehouseAPI.getAll();
        const locations = res.data || [];
        const match = locations.find(w => w._id === grn.warehouseLocation || w.name === grn.warehouseLocation);
        setResolvedWarehouse(match ? match.name : grn.warehouseLocation);
      } catch {
        setResolvedWarehouse(grn.warehouseLocation);
      }
    };
    
    resolveWarehouse();
  }, [grn.warehouseLocation]);


  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold">{grn.grnNumber}</h2>
            </div>
            <p className="text-green-100 ml-[52px]">Created on {formatDate(grn.createdAt)}</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-xl shadow-md ${
              grn.receiptStatus === 'Complete' ? 'bg-white text-green-700' : 
              grn.receiptStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-gray-100 text-gray-800'
            }`}>
              {grn.receiptStatus || 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
            <ClipboardList className="w-3.5 h-3.5" /> GRN Number
          </label>
          <p className="text-base font-bold text-gray-900">{grn.grnNumber}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
            <FileText className="w-3.5 h-3.5" /> PO Reference
          </label>
          <p className="text-base font-bold text-gray-900">{grn.poNumber}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
            <Calendar className="w-3.5 h-3.5" /> Receipt Date
          </label>
          <p className="text-base font-bold text-gray-900">{formatDate(grn.receiptDate)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
            <Building2 className="w-3.5 h-3.5" /> Supplier
          </label>
          <p className="text-base font-bold text-gray-900">{grn.supplierDetails?.companyName || '—'}</p>
        </div>
      </div>

      {/* Items Received */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <Package className="w-5 h-5 text-green-600" />
          <h3 className="text-base font-semibold text-gray-900">Items Received</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ordered</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-green-700 uppercase tracking-wider bg-green-50">Received</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {grn.items?.map((item, index) => {
                const receivedWeight = item.receivedWeight || 0;
                const isComplete = item.receivedQuantity >= item.orderedQuantity;
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {item.subProductName ? `${item.productName} × ${item.subProductName}` : item.productName}
                      </div>
                      <div className="text-xs text-gray-400">{item.productCode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.orderedQuantity} {item.unit}</div>
                      {item.orderedWeight > 0 && <div className="text-xs text-gray-500">{item.orderedWeight} kg</div>}
                    </td>
                    <td className="px-6 py-4 bg-green-50">
                      <div className="text-sm font-bold text-green-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {item.receivedQuantity} {item.unit}
                      </div>
                      {receivedWeight > 0 && <div className="text-xs text-green-600 mt-0.5">{receivedWeight.toFixed(2)} kg</div>}
                      {item.rejectedQuantity > 0 && (
                        <div className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Rejected: {item.rejectedQuantity} {item.unit}
                        </div>
                      )}
                      {Array.isArray(item.receivedSubProductWeights) && item.receivedSubProductWeights.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.receivedSubProductWeights.map((w, wi) => (
                            <span key={wi} className="px-1.5 py-0.5 text-xs bg-green-100 text-green-800 border border-green-200 rounded">
                              {Number(w) % 1 === 0 ? Number(w) : Number(w).toFixed(2)} kg
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
                        isComplete ? 'bg-green-100 text-green-800' :
                        item.receivedQuantity > 0 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {isComplete ? 'Complete' : item.receivedQuantity > 0 ? 'Partial' : 'Not Received'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>


      {/* Warehouse & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {grn.warehouseLocation && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
              <Warehouse className="w-3.5 h-3.5" /> Warehouse Location
            </label>
            <p className="text-base font-semibold text-indigo-700">{resolvedWarehouse || grn.warehouseLocation}</p>
          </div>
        )}
        {grn.storageInstructions && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
              <MapPin className="w-3.5 h-3.5" /> Storage Notes
            </label>
            <p className="text-sm text-gray-700">{grn.storageInstructions}</p>
          </div>
        )}
        {grn.generalNotes && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm md:col-span-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
              <FileText className="w-3.5 h-3.5" /> Notes
            </label>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{grn.generalNotes}</p>
          </div>
        )}
      </div>


      {/* Actions */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Close
        </button>
      </div>
    </div>
  );
};

export default GRNDetail;
