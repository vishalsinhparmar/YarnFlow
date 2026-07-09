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
  const [confirmDelete, setConfirmDelete] = useState(null);

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

  const openCreate = () => { setForm(emptyForm); setEditing(null); setModal('create'); setError(''); };
  const openEdit   = (loc) => { setForm({ name: loc.name, code: loc.code, type: loc.type, address: loc.address || '', isActive: loc.isActive }); setEditing(loc); setModal('edit'); setError(''); };
  const closeModal = () => { setModal(null); setEditing(null); setError(''); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) { setError('Name and code are required'); return; }
    setSaving(true); setError('');
    try {
      if (modal === 'create') {
        await warehouseAPI.create(form);
      } else {
        await warehouseAPI.update(editing._id, form);
      }
      closeModal();
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (loc) => {
    try {
      await warehouseAPI.update(loc._id, { isActive: !loc.isActive });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await warehouseAPI.remove(id);
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
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
                <tr key={loc._id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{loc.name}</td>
                  <td className="px-5 py-3.5 font-mono text-xs bg-gray-50 text-gray-700">{loc.code}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badgeColor(loc.type)}`}>{loc.type}</span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 max-w-xs truncate">{loc.address || '—'}</td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => handleToggle(loc)} title={loc.isActive ? 'Disable' : 'Enable'}>
                      {loc.isActive
                        ? <ToggleRight className="w-5 h-5 text-green-500" />
                        : <ToggleLeft  className="w-5 h-5 text-gray-400" />}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(loc)} className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setConfirmDelete(loc)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">{modal === 'create' ? 'Add Location' : 'Edit Location'}</h2>
              <button onClick={closeModal}><X className="w-5 h-5 text-gray-400 hover:text-gray-700" /></button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                    value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="e.g. Main Godown" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Code *</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none uppercase"
                    value={form.code} onChange={e => setForm(p => ({...p, code: e.target.value.toUpperCase()}))} placeholder="e.g. MAIN-GDN" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                  value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                  value={form.address} onChange={e => setForm(p => ({...p, address: e.target.value}))} placeholder="Optional address" />
              </div>
              {modal === 'edit' && (
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({...p, isActive: e.target.checked}))} className="rounded" />
                  Active
                </label>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 pb-5">
              <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {modal === 'create' ? 'Add Location' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Location?</h3>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete <strong>{confirmDelete.name}</strong>? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete._id)} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
