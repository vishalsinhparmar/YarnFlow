import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

export default function SortBuilder({ definition, sort, onChange }) {
  const sortableFields = (definition?.fields || []).filter(f => f.sortable);

  const addSort = () => {
    const first = sortableFields[0];
    onChange([...sort, { field: first?.key || '', direction: 'asc' }]);
  };

  const update = (index, patch) => {
    onChange(sort.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const remove = (index) => {
    onChange(sort.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Sort By</h3>
        <button
          onClick={addSort}
          disabled={sort.length >= 5 || sortableFields.length === 0}
          className="text-xs font-medium text-orange-600 hover:text-orange-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add sort
        </button>
      </div>

      {sortableFields.length === 0 ? (
        <p className="text-sm text-gray-400">No sortable fields available.</p>
      ) : sort.length === 0 ? (
        <p className="text-sm text-gray-400">No sorting applied. Click "Add sort" to sort results.</p>
      ) : (
        <div className="space-y-2">
          {sort.map((s, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <select
                    value={s.field}
                    onChange={(e) => update(index, { field: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                  >
                    <option value="">Select field...</option>
                    {sortableFields.map(f => (
                      <option key={f.key} value={f.key}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => update(index, { direction: s.direction === 'asc' ? 'desc' : 'asc' })}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white flex items-center gap-1.5 text-sm font-medium whitespace-nowrap"
                  title={s.direction === 'asc' ? 'Click to sort descending' : 'Click to sort ascending'}
                >
                  {s.direction === 'asc' ? (
                    <>
                      <ArrowUp className="w-3.5 h-3.5" /> Asc
                    </>
                  ) : (
                    <>
                      <ArrowDown className="w-3.5 h-3.5" /> Desc
                    </>
                  )}
                </button>
                <button
                  onClick={() => remove(index)}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700"
                  title="Remove this sort"
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
