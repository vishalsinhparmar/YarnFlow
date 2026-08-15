import { useMemo, useState } from 'react';
import { Search, Check } from 'lucide-react';

export default function FieldPanel({ definition, selectedFields, onToggle }) {
  const [search, setSearch] = useState('');

  const grouped = useMemo(() => {
    const map = {};
    for (const field of definition?.fields || []) {
      if (!field.exportable && !field.filterable) continue;
      if (search && !field.label.toLowerCase().includes(search.toLowerCase())) continue;
      map[field.group] = map[field.group] || [];
      map[field.group].push(field);
    }
    return map;
  }, [definition, search]);

  const allKeys = useMemo(() => definition?.fields?.filter(f => f.exportable || f.filterable).map(f => f.key) || [], [definition]);
  const allSelected = allKeys.length > 0 && allKeys.every(k => selectedFields.includes(k));

  const toggleAll = () => {
    if (allSelected) {
      for (const k of allKeys) onToggle(k);
    } else {
      for (const k of allKeys) {
        if (!selectedFields.includes(k)) onToggle(k);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-orange-200 p-4 shadow-sm">
      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
        📋 Fields
      </h3>
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search fields..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
        />
      </div>

      {allKeys.length > 0 && (
        <button
          onClick={toggleAll}
          className="text-xs text-orange-600 hover:text-orange-700 font-bold mb-3 block"
        >
          {allSelected ? '☐ Deselect all' : '☑ Select all'}
        </button>
      )}

      <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-2">
        {Object.entries(grouped).map(([group, fields]) => (
          <div key={group}>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 text-orange-700">{group}</p>
            <div className="space-y-2">
              {fields.map(field => (
                <label
                  key={field.key}
                  className="flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-orange-50 cursor-pointer text-sm transition-colors"
                  title={field.label}
                >
                  <span className={`w-4 h-4 flex items-center justify-center rounded border flex-shrink-0 mt-0.5 ${selectedFields.includes(field.key) ? 'bg-orange-500 border-orange-500' : 'border-gray-300 bg-white'}`}>
                    {selectedFields.includes(field.key) && <Check className="w-3 h-3 text-white" />}
                  </span>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selectedFields.includes(field.key)}
                    onChange={() => onToggle(field.key)}
                  />
                  <span className="text-gray-700 break-words">{field.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        {Object.keys(grouped).length === 0 && (
          <p className="text-sm text-gray-400">No fields match your search.</p>
        )}
      </div>
    </div>
  );
}
