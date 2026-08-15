import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import reportsAPI from '../../services/reportsAPI';

function FilterValueInput({ field, operator, value, valueTo, onChange }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (field?.type !== 'reference' || !operator) return;
    let mounted = true;
    setLoading(true);
    reportsAPI.getLookupOptions(field._reportKey, field.key)
      .then(res => { if (mounted) setOptions(res.data || []); })
      .catch(() => { if (mounted) setOptions([]); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [field, operator]);

  // Filter options based on search text
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchText.toLowerCase())
  );

  if (!field) return null;

  const isMulti = ['in', 'notIn'].includes(operator);

  if (field.type === 'boolean') {
    return (
      <select
        value={String(value) === 'true' ? 'true' : 'false'}
        onChange={(e) => onChange({ value: e.target.value === 'true' })}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
      >
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  }

  if (field.type === 'enum') {
    if (isMulti) {
      const selected = Array.isArray(value) ? value : [];
      return (
        <select
          multiple
          value={selected}
          onChange={(e) => {
            const vals = Array.from(e.target.selectedOptions).map(o => o.value);
            onChange({ value: vals });
          }}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
        >
          {(field.allowedValues || []).map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      );
    }
    return (
      <select
        value={value || ''}
        onChange={(e) => onChange({ value: e.target.value })}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
      >
        <option value="">Select...</option>
        {(field.allowedValues || []).map(v => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>
    );
  }

  if (field.type === 'reference') {
    if (isMulti) {
      const selected = Array.isArray(value) ? value : [];
      return (
        <select
          multiple
          value={selected}
          disabled={loading}
          onChange={(e) => onChange({ value: Array.from(e.target.selectedOptions).map(o => o.value) })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
    }
    
    // Single select with search
    const selectedLabel = options.find(o => o.value === value)?.label || '';
    const displayValue = showDropdown ? searchText : selectedLabel;
    const hasMatches = filteredOptions.length > 0;
    
    return (
      <div className="relative" onBlur={() => setTimeout(() => setShowDropdown(false), 150)}>
        <div className="relative">
          <input
            type="text"
            placeholder="Type to search..."
            value={displayValue}
            onChange={(e) => {
              const text = e.target.value;
              setSearchText(text);
              // Show dropdown if there's text or if field is focused
              setShowDropdown(text.length > 0 || true);
            }}
            onFocus={() => {
              setShowDropdown(true);
              // If no search text yet, show all options
              if (!searchText) {
                setSearchText('');
              }
            }}
            disabled={loading}
            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition-colors"
          />
          {/* Show dropdown indicator */}
          {showDropdown && (
            <div className="absolute right-3 top-2.5 text-gray-400 pointer-events-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Dropdown with suggestions */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-orange-200 rounded-lg shadow-lg z-20 max-h-56 overflow-y-auto">
            {hasMatches ? (
              <>
                {filteredOptions.map((opt, idx) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange({ value: opt.value });
                      setSearchText('');
                      setShowDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                      idx === 0 ? 'bg-orange-50' : 'hover:bg-orange-50'
                    } text-gray-700 border-b border-gray-100 last:border-b-0`}
                  >
                    <div className="font-medium text-gray-900">{opt.label}</div>
                  </button>
                ))}
              </>
            ) : searchText ? (
              <div className="px-3 py-4 text-center text-sm text-gray-500">
                <p className="mb-1">❌ No matches found</p>
                <p className="text-xs text-gray-400">Try a different search term</p>
              </div>
            ) : (
              <div className="px-3 py-4 text-center text-sm text-gray-500">
                <p className="mb-1">📝 Start typing to search</p>
                <p className="text-xs text-gray-400">Available options will appear below</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (field.type === 'date') {
    if (operator === 'between') {
      return (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange({ value: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={valueTo || ''}
            onChange={(e) => onChange({ valueTo: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
          />
        </div>
      );
    }
    return (
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange({ value: e.target.value })}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
      />
    );
  }

  if (field.type === 'number') {
    if (operator === 'between') {
      return (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange({ value: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
          />
          <span className="text-gray-400">to</span>
          <input
            type="number"
            value={valueTo}
            onChange={(e) => onChange({ valueTo: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
          />
        </div>
      );
    }
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange({ value: e.target.value })}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
      />
    );
  }

  if (['in', 'notIn'].includes(operator)) {
    return (
      <input
        type="text"
        value={Array.isArray(value) ? value.join(', ') : value}
        onChange={(e) => onChange({ value: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
        placeholder="comma-separated values"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
      />
    );
  }

  return (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange({ value: e.target.value })}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
    />
  );
}

const operatorLabels = {
  eq: 'equals',
  ne: 'not equals',
  contains: 'contains',
  startsWith: 'starts with',
  gt: 'greater than',
  gte: 'greater than or equal',
  lt: 'less than',
  lte: 'less than or equal',
  between: 'between',
  in: 'in',
  notIn: 'not in',
  before: 'before',
  after: 'after'
};

export default function FilterBuilder({ definition, filters, onChange }) {
  const filterableFields = (definition?.fields || []).filter(f => f.filterable);

  const updateGroup = (groupIndex, patch) => {
    const next = { ...filters, groups: filters.groups.map((g, i) => (i === groupIndex ? { ...g, ...patch } : g)) };
    onChange(next);
  };

  const updateFilter = (groupIndex, filterIndex, patch) => {
    const next = { ...filters };
    next.groups = filters.groups.map((g, i) =>
      i === groupIndex
        ? { ...g, filters: g.filters.map((f, j) => (j === filterIndex ? { ...f, ...patch } : f)) }
        : g
    );
    onChange(next);
  };

  const addFilter = (groupIndex) => {
    const first = filterableFields[0];
    const next = { ...filters };
    next.groups = filters.groups.map((g, i) =>
      i === groupIndex
        ? { ...g, filters: [...g.filters, { field: first?.key || '', operator: first?.operators?.[0] || 'eq', value: '', valueTo: '' }] }
        : g
    );
    onChange(next);
  };

  const removeFilter = (groupIndex, filterIndex) => {
    const next = { ...filters };
    next.groups = filters.groups.map((g, i) =>
      i === groupIndex ? { ...g, filters: g.filters.filter((_, j) => j !== filterIndex) } : g
    );
    onChange(next);
  };

  const addGroup = () => {
    onChange({ ...filters, groups: [...filters.groups, { condition: 'and', filters: [] }] });
  };

  const removeGroup = (groupIndex) => {
    if (filters.groups.length <= 1) return;
    onChange({ ...filters, groups: filters.groups.filter((_, i) => i !== groupIndex) });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Conditions</h3>
        <button
          onClick={addGroup}
          className="text-xs font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add group
        </button>
      </div>

      {filters.groups.length > 1 && (
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-500 mr-2">Combine groups:</label>
          <select
            value={filters.condition}
            onChange={(e) => onChange({ ...filters, condition: e.target.value })}
            className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
          >
            <option value="and">Match all groups</option>
            <option value="or">Match any group</option>
          </select>
        </div>
      )}

      <div className="space-y-4">
        {filters.groups.map((group, groupIndex) => (
          <div key={groupIndex} className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">Group {groupIndex + 1}</span>
                <select
                  value={group.condition}
                  onChange={(e) => updateGroup(groupIndex, { condition: e.target.value })}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-orange-400 outline-none"
                >
                  <option value="and">And</option>
                  <option value="or">Or</option>
                </select>
              </div>
              {filters.groups.length > 1 && (
                <button onClick={() => removeGroup(groupIndex)} className="text-xs text-red-500 hover:text-red-700">
                  Remove group
                </button>
              )}
            </div>

            <div className="space-y-2">
              {group.filters.map((filter, filterIndex) => {
                const field = definition.fields.find(f => f.key === filter.field);
                const operators = field?.operators || ['eq'];
                return (
                  <div key={filterIndex} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start">
                    <select
                      value={filter.field}
                      onChange={(e) => updateFilter(groupIndex, filterIndex, { field: e.target.value })}
                      className="sm:col-span-3 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                    >
                      {filterableFields.map(f => (
                        <option key={f.key} value={f.key}>{f.label}</option>
                      ))}
                    </select>
                    <select
                      value={filter.operator}
                      onChange={(e) => updateFilter(groupIndex, filterIndex, { operator: e.target.value })}
                      className="sm:col-span-3 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                    >
                      {operators.map(op => (
                        <option key={op} value={op}>{operatorLabels[op] || op}</option>
                      ))}
                    </select>
                    <div className="sm:col-span-5">
                      <FilterValueInput
                        field={field ? { ...field, _reportKey: definition.key } : null}
                        operator={filter.operator}
                        value={filter.value}
                        valueTo={filter.valueTo}
                        onChange={(patch) => updateFilter(groupIndex, filterIndex, patch)}
                      />
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        onClick={() => removeFilter(groupIndex, filterIndex)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => addFilter(groupIndex)}
              className="mt-2 text-xs font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add condition
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
