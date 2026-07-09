import React, { useState, useEffect, useMemo } from 'react';
import { Check, Layers, Loader2, Plus, X } from 'lucide-react';
import { subProductAPI } from '../../services/masterDataAPI';

const SubProductSelector = ({
  productId,
  subProducts: propSubProducts = [],
  selectedSubProduct,
  selectedSubProductName,
  quantity,
  weights,
  categoryHasSubProducts,
  onSelectSubProduct,
  onWeightsChange,
  onSubProductsUpdated,
  disabled = false,
  disableSelection = false,
  allowAddNew = true,
  compact = false
}) => {
  const [localSubProducts, setLocalSubProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newSubProductName, setNewSubProductName] = useState('');

  // Sync with provided list or fetch from API if not provided
  useEffect(() => {
    if (Array.isArray(propSubProducts) && propSubProducts.length > 0) {
      setLocalSubProducts(propSubProducts);
      return;
    }
    if (!productId || !categoryHasSubProducts) {
      setLocalSubProducts([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    subProductAPI.getAll(productId)
      .then(res => {
        if (!cancelled && res.success && Array.isArray(res.data)) {
          setLocalSubProducts(res.data);
        }
      })
      .catch(err => console.error('Error fetching sub-products:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [productId, propSubProducts, categoryHasSubProducts]);

  // Normalize weights array to match quantity
  const normalizedWeights = useMemo(() => {
    const qw = Array.isArray(weights) ? weights : [];
    const qty = Math.max(0, Number(quantity) || 0);
    if (qw.length === qty) return qw.map(w => Number(w) || 0);
    const result = [];
    const totalWeight = Number(weights?.total) || 0;
    const perUnit = qty > 0 ? totalWeight / qty : 0;
    for (let i = 0; i < qty; i++) {
      result.push(i < qw.length ? (Number(qw[i]) || 0) : perUnit);
    }
    return result;
  }, [weights, quantity]);

  const totalWeight = normalizedWeights.reduce((sum, w) => sum + w, 0);

  if (!categoryHasSubProducts) return null;

  const handleWeightChange = (index, value) => {
    const updated = [...normalizedWeights];
    updated[index] = Math.max(0, Number(value) || 0);
    onWeightsChange(updated, totalWeight);
  };

  const handleAddSubProduct = async () => {
    const name = newSubProductName.trim();
    if (!name || !productId) return;
    setLoading(true);
    try {
      const res = await subProductAPI.bulkAdd(productId, [name]);
      if (res.success) {
        const created = Array.isArray(res.data) ? res.data : [];
        const newSubs = [...localSubProducts, ...created];
        setLocalSubProducts(newSubs);
        setNewSubProductName('');
        if (onSubProductsUpdated) onSubProductsUpdated(newSubs);
        // Auto-select the newly created sub-product so the user can enter weights immediately
        const newSp = created[0];
        if (newSp && !disableSelection && onSelectSubProduct) {
          onSelectSubProduct(newSp._id, newSp.name);
        }
      }
    } catch (err) {
      console.error('Failed to add sub-product:', err);
    } finally {
      setLoading(false);
    }
  };

  const isWeightsOnly = disableSelection && !allowAddNew;

  const wrapperClass = compact
    ? 'space-y-2'
    : 'p-4 bg-green-50 border border-green-200 rounded-lg space-y-4';

  const chipClass = compact
    ? 'px-2 py-1 rounded text-xs font-semibold border transition-all flex items-center gap-1'
    : 'px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all flex items-center gap-1';

  const weightInputs = selectedSubProduct && quantity > 0 ? (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={`font-semibold text-gray-700 ${compact ? 'text-xs' : 'text-sm'}`}>
          {selectedSubProductName} weights ({quantity} {quantity === 1 ? 'unit' : 'units'})
        </span>
        <span className={`font-semibold text-green-700 ${compact ? 'text-xs' : 'text-sm'}`}>
          Total: {totalWeight.toFixed(2)} kg
        </span>
      </div>
      <div className={compact ? 'flex flex-wrap gap-2' : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'}>
        {normalizedWeights.map((w, idx) => (
          <div key={idx} className={`flex items-center gap-2 bg-white border border-gray-200 ${compact ? 'px-2 py-1 rounded' : 'px-3 py-2 rounded-lg'}`}>
            <span className={`font-semibold text-gray-500 ${compact ? 'text-xs w-4' : 'text-xs w-6'}`}>#{idx + 1}</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={w || ''}
              onChange={(e) => handleWeightChange(idx, e.target.value)}
              disabled={disabled}
              className={`min-w-0 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${compact ? 'w-16 text-xs px-1 py-0.5' : 'flex-1 text-sm px-2 py-1'}`}
              placeholder="kg"
            />
            <span className="text-xs text-gray-500 font-medium">kg</span>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <div className={wrapperClass}>
      {!compact && (
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-green-600" />
          <label className="text-sm font-semibold text-gray-700">Sub Product</label>
          {loading && localSubProducts.length === 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Loader2 className="w-3 h-3 animate-spin" /> Fetching...
            </span>
          )}
        </div>
      )}

      {isWeightsOnly ? (
        <div className="space-y-2">
          {selectedSubProduct && (
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded border border-green-200">
                {selectedSubProductName}
              </span>
              <span className="text-xs text-gray-500">
                {quantity > 0 ? `${quantity} ${quantity === 1 ? 'unit' : 'units'}` : ''}
              </span>
            </div>
          )}
          {weightInputs}
        </div>
      ) : localSubProducts.length === 0 ? (
        <div className="space-y-2">
          {!compact && <p className="text-xs text-gray-500">No sub-products found for this product.</p>}
          {allowAddNew && !disableSelection && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubProductName}
                onChange={(e) => setNewSubProductName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubProduct()}
                placeholder="e.g., 5"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={disabled || loading || disableSelection}
              />
              <button
                type="button"
                onClick={handleAddSubProduct}
                disabled={disabled || loading || disableSelection || !newSubProductName.trim()}
                className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Chip grid */}
          <div className={`flex gap-2 ${compact ? 'flex-nowrap overflow-x-auto pb-1 scrollbar-thin' : 'flex-wrap'}`}>
            {localSubProducts.map(sp => {
              const spId = sp._id || sp;
              const spName = sp.name || sp;
              const isSelected = selectedSubProduct && spId.toString() === selectedSubProduct.toString();
              return (
                <button
                  key={spId}
                  type="button"
                  onClick={() => !disableSelection && onSelectSubProduct(spId, spName)}
                  disabled={disabled || disableSelection}
                  className={`${chipClass} ${
                    isSelected
                      ? 'bg-green-600 text-white border-green-600 shadow-sm'
                      : 'bg-white text-gray-700 border-green-300 hover:border-green-500 hover:bg-green-50'
                  } disabled:opacity-60`}
                >
                  {isSelected && <Check className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
                  {spName}
                </button>
              );
            })}
          </div>

          {/* Add new sub-product inline */}
          {allowAddNew && !disableSelection && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubProductName}
                onChange={(e) => setNewSubProductName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubProduct()}
                placeholder={compact ? 'Add sub-product' : 'Add another sub-product'}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={disabled || loading || disableSelection}
              />
              <button
                type="button"
                onClick={handleAddSubProduct}
                disabled={disabled || loading || disableSelection || !newSubProductName.trim()}
                className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          )}

          {weightInputs}
        </div>
      )}
    </div>
  );
};

export default SubProductSelector;
