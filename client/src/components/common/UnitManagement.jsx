import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Loader2, Package, AlertCircle, CheckCircle } from 'lucide-react';
import { unitAPI } from '../../services/masterDataAPI';
import toast from 'react-hot-toast';

const UnitManagement = ({ onClose, onUnitAdded }) => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [newUnitName, setNewUnitName] = useState('');
  const [error, setError] = useState('');

  // Fetch units on mount
  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const response = await unitAPI.getAll();
      if (response.success) {
        setUnits(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching units:', error);
      toast.error('Failed to load units');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUnit = async () => {
    if (!newUnitName.trim()) {
      setError('Unit name is required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const response = await unitAPI.create({ name: newUnitName.trim() });
      
      if (response.success) {
        toast.success('Unit added successfully');
        setNewUnitName('');
        fetchUnits();
        if (onUnitAdded) onUnitAdded(response.data);
      } else {
        setError(response.message || 'Failed to add unit');
        toast.error(response.message || 'Failed to add unit');
      }
    } catch (error) {
      console.error('Error adding unit:', error);
      const errorMsg = error.message || 'Failed to add unit';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUnit = async (id, name) => {
    if (!name.trim()) {
      toast.error('Unit name is required');
      return;
    }

    try {
      setSaving(true);
      const response = await unitAPI.update(id, { name: name.trim() });
      
      if (response.success) {
        toast.success('Unit updated successfully');
        setEditingUnit(null);
        fetchUnits();
        if (onUnitAdded) onUnitAdded(response.data);
      } else {
        toast.error(response.message || 'Failed to update unit');
      }
    } catch (error) {
      console.error('Error updating unit:', error);
      toast.error(error.message || 'Failed to update unit');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUnit = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?\n\nNote: This may affect existing purchase orders using this unit.`)) {
      return;
    }

    try {
      setSaving(true);
      const response = await unitAPI.delete(id);
      
      if (response.success) {
        toast.success('Unit deleted successfully');
        fetchUnits();
      } else {
        toast.error(response.message || 'Failed to delete unit');
      }
    } catch (error) {
      console.error('Error deleting unit:', error);
      toast.error(error.message || 'Failed to delete unit');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !saving) {
      handleAddUnit();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Manage Units</h2>
              <p className="text-orange-100 text-sm">Add, edit, or remove measurement units</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add New Unit Section */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-orange-50 to-amber-50">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Add New Unit
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newUnitName}
              onChange={(e) => {
                setNewUnitName(e.target.value);
                setError('');
              }}
              onKeyPress={handleKeyPress}
              placeholder="Enter unit name (e.g., Bags, Rolls, Kg)"
              className={`flex-1 px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={saving}
            />
            <button
              onClick={handleAddUnit}
              disabled={saving || !newUnitName.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Unit
                </>
              )}
            </button>
          </div>
          {error && (
            <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        {/* Units List */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Existing Units ({units.length})
          </h3>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-orange-600 animate-spin mb-3" />
              <p className="text-gray-600">Loading units...</p>
            </div>
          ) : units.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">No units found</p>
              <p className="text-sm text-gray-400">Add your first unit above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {units.map((unit) => (
                <div
                  key={unit._id}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-sm transition-all group"
                >
                  {editingUnit === unit._id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        defaultValue={unit.name}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateUnit(unit._id, e.target.value);
                          } else if (e.key === 'Escape') {
                            setEditingUnit(null);
                          }
                        }}
                        className="flex-1 px-3 py-1.5 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        autoFocus
                        disabled={saving}
                      />
                      <button
                        onClick={(e) => {
                          const input = e.target.parentElement.querySelector('input');
                          handleUpdateUnit(unit._id, input.value);
                        }}
                        disabled={saving}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingUnit(null)}
                        disabled={saving}
                        className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Package className="w-4 h-4 text-orange-600" />
                        </div>
                        <span className="font-medium text-gray-900">{unit.name}</span>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingUnit(unit._id)}
                          disabled={saving}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Edit unit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUnit(unit._id, unit.name)}
                          disabled={saving}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete unit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnitManagement;
