import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, MapPin, Loader2, X, Check } from 'lucide-react';
import warehouseAPI from '../services/warehouseAPI';

const TYPES = ['Shop', 'Godown', 'Factory', 'Others'];

const emptyForm = { name: '', code: '', type: 'Godown', address: '', isActive: true };

export default function WarehouseLocationsPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [modal, setModal]         = useState(null); // null | 'create' | 'edit'
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(emptyForm);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmToggle, setConfirmToggle] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await warehouseAPI.getAll(showInactive);
      setLocations(res.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [showInactive]);

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.code.trim()) errors.code = 'Code is required';
    if (form.code.length < 2) errors.code = 'Code must be at least 2 characters';
    if (form.code.length > 20) errors.code = 'Code must be at most 20 characters';
    if (!/^[A-Z0-9\-_]+$/.test(form.code)) errors.code = 'Code must contain only uppercase letters, numbers, hyphens, and underscores';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreate = () => { setForm(emptyForm); setEditing(null); setModal('create'); setError(''); setSuccess(''); setFieldErrors({}); };
  const openEdit   = (loc) => { setForm({ name: loc.name, code: loc.code, type: loc.type, address: loc.address || '', isActive: loc.isActive }); setEditing(loc); setModal('edit'); setError(''); setSuccess(''); setFieldErrors({}); };
  const closeModal = () => { setModal(null); setEditing(null); setError(''); setSuccess(''); setFieldErrors({}); };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      if (modal === 'create') {
        await warehouseAPI.create(form);
        setSuccess('Location added successfully!');
      } else {
        await warehouseAPI.update(editing._id, form);
        setSuccess('Location updated successfully!');
      }
      setTimeout(() => {
        closeModal();
        load();
      }, 500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (loc) => {
    setConfirmToggle(loc);
  };

  const confirmToggleAction = async () => {
    try {
      await warehouseAPI.update(confirmToggle._id, { isActive: !confirmToggle.isActive });
      setSuccess(`Location ${confirmToggle.isActive ? 'disabled' : 'enabled'} successfully!`);
      setConfirmToggle(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await warehouseAPI.remove(id);
      setSuccess('Location deleted successfully!');
      setConfirmDelete(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const badgeColor = (type) => ({
    Shop:    'bg-blue-100 text-blue-700',
    Godown:  'bg-purple-100 text-purple-700',
    Factory: 'bg-orange-100 text-orange-700',
    Others:  'bg-gray-100 text-gray-600',
  }[type] || 'bg-gray-100 text-gray-600');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-orange-500" /> Warehouse Locations
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage godown and shop locations used in GRN and Challans</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="rounded" />
            Show inactive
          </label>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Location
          </button>
        </div>
      </div>

      {error && !modal && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-700 hover:text-red-900"><X className="w-4 h-4" /></button>
        </div>
      )}

      {success && !modal && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-green-700 hover:text-green-900"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          </div>
        ) : locations.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No locations found. Add your first warehouse location.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Name','Code','Type','Address','Status','Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {locations.map(loc => (
                <tr key={loc._id} className={`hover:bg-gray-50/60 transition-colors ${!loc.isActive ? 'opacity-60 bg-gray-50' : ''}`}>
                  <td className={`px-5 py-3.5 font-medium ${!loc.isActive ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{loc.name}</td>
                  <td className={`px-5 py-3.5 font-mono text-xs ${!loc.isActive ? 'bg-gray-100 text-gray-500' : 'bg-gray-50 text-gray-700'}`}>{loc.code}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badgeColor(loc.type)}`}>{loc.type}</span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 max-w-xs truncate">
                    {loc.address ? loc.address : <span className="text-gray-400 italic">Not specified</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => handleToggle(loc)} title={loc.isActive ? 'Click to disable' : 'Click to enable'} className="transition-transform hover:scale-110">
                      {loc.isActive
                        ? <ToggleRight className="w-5 h-5 text-green-500" />
                        : <ToggleLeft  className="w-5 h-5 text-gray-400" />}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(loc)} className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setConfirmDelete(loc)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed bottom-0 left-0 right-0 top-16 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 transition-[left] duration-200 sm:p-4 lg:left-[var(--sidebar-width)]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-lg font-semibold text-gray-900">{modal === 'create' ? 'Add Location' : 'Edit Location'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              {error && <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg border border-red-200">{error}</div>}
              {success && <div className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg border border-green-200">{success}</div>}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Name *</label>
                  <input 
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-colors ${fieldErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                    value={form.name} 
                    onChange={e => { setForm(p => ({...p, name: e.target.value})); setFieldErrors(p => ({...p, name: ''})); }} 
                    placeholder="e.g. Main Godown" />
                  {fieldErrors.name && <p className="text-red-600 text-xs mt-1">{fieldErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Code *</label>
                  <input 
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-colors uppercase ${fieldErrors.code ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                    value={form.code} 
                    onChange={e => { setForm(p => ({...p, code: e.target.value.toUpperCase()})); setFieldErrors(p => ({...p, code: ''})); }} 
                    placeholder="e.g. MAIN-GDN" />
                  {fieldErrors.code && <p className="text-red-600 text-xs mt-1">{fieldErrors.code}</p>}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Type</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none transition-colors"
                  value={form.type} 
                  onChange={e => setForm(p => ({...p, type: e.target.value}))}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Address</label>
                <input 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none transition-colors"
                  value={form.address} 
                  onChange={e => setForm(p => ({...p, address: e.target.value}))} 
                  placeholder="Optional address" />
              </div>
              
              {modal === 'edit' && (
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({...p, isActive: e.target.checked}))} className="rounded" />
                  <span className="font-medium">Active</span>
                </label>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-wait transition-all">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {modal === 'create' ? 'Add Location' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Confirm */}
      {confirmToggle && (
        <div className="fixed bottom-0 left-0 right-0 top-16 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 transition-[left] duration-200 sm:p-4 lg:left-[var(--sidebar-width)]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {confirmToggle.isActive ? <ToggleRight className="w-6 h-6 text-blue-600" /> : <ToggleLeft className="w-6 h-6 text-blue-600" />}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{confirmToggle.isActive ? 'Disable' : 'Enable'} Location?</h3>
            <p className="text-sm text-gray-600 mb-6">Are you sure you want to <strong>{confirmToggle.isActive ? 'disable' : 'enable'}</strong> <strong>{confirmToggle.name}</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmToggle(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={confirmToggleAction} className={`flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors ${confirmToggle.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                {confirmToggle.isActive ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed bottom-0 left-0 right-0 top-16 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 transition-[left] duration-200 sm:p-4 lg:left-[var(--sidebar-width)]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center border border-gray-200">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Location?</h3>
            <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete <strong>{confirmDelete.name}</strong>? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete._id)} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
