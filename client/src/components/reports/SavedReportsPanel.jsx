import { useState } from 'react';
import { Save, Loader2, X, Trash2, FolderOpen } from 'lucide-react';

export default function SavedReportsPanel({
  reports,
  loading,
  selectedReportKey,
  onLoad,
  onSave,
  onDelete,
  disabled
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a report name');
      return;
    }
    if (!selectedReportKey) {
      setError('Please select a report first');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(name.trim());
      setName('');
      setIsOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-orange-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2 text-base">
          <Save className="w-5 h-5 text-orange-600" /> Saved Reports
        </h3>
        <button
          onClick={() => setIsOpen(o => !o)}
          disabled={disabled}
          className="text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 rounded-lg transition-colors"
          title={disabled ? 'Select a report module first' : 'Save current configuration'}
        >
          {isOpen ? '✕ Cancel' : '+ Save current'}
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSave} className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter report name..."
              className="w-full border-2 border-orange-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-bold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <span>💾</span> Save Report
              </button>
              <button
                type="button"
                onClick={() => { setName(''); setIsOpen(false); }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300 transition-colors"
              >
                ✕ Cancel
              </button>
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">{error}</p>}
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-4 text-center text-sm text-gray-400">
          <Loader2 className="w-5 h-5 mx-auto animate-spin mb-1" /> Loading...
        </div>
      ) : reports.length === 0 ? (
        <p className="text-sm text-gray-400 py-2">No saved reports yet.</p>
      ) : (
        <div className="space-y-1 max-h-[16rem] overflow-y-auto">
          {reports.map(report => (
            <div
              key={report._id}
              className={`flex items-center justify-between gap-2 px-3 py-3 rounded-lg text-sm cursor-pointer transition-all ${report.reportKey === selectedReportKey ? 'bg-orange-100 border-2 border-orange-500 shadow-md' : 'bg-gray-50 border border-gray-200 hover:bg-orange-50 hover:border-orange-300'}`}
            >
              <button
                onClick={() => onLoad(report)}
                className="flex-1 text-left flex items-center gap-2 min-w-0 font-medium"
              >
                <FolderOpen className={`w-4 h-4 flex-shrink-0 ${report.reportKey === selectedReportKey ? 'text-orange-600' : 'text-gray-500'}`} />
                <span className={`truncate ${report.reportKey === selectedReportKey ? 'text-orange-900' : 'text-gray-700'}`} title={report.name}>{report.name}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(report._id);
                }}
                className="p-1.5 rounded hover:bg-red-100 text-red-500 hover:text-red-700 flex-shrink-0 transition-colors"
                title="Delete saved report"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
