import { X, ChevronUp, ChevronDown } from 'lucide-react';

export default function ColumnSelector({ selectedFieldDefs, onRemove, onMove }) {
  if (selectedFieldDefs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 min-h-[8rem]">
        <h3 className="font-semibold text-gray-900 mb-2">Selected Columns</h3>
        <p className="text-sm text-gray-400">Select fields to include in the report.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Selected Columns ({selectedFieldDefs.length})</h3>
      <div className="space-y-1.5 max-h-[20rem] overflow-y-auto">
        {selectedFieldDefs.map((field, index) => (
          <div
            key={field.key}
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100"
          >
            <span className="text-sm text-gray-800 truncate">{field.label}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => onMove(index, index - 1)}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronUp className="w-4 h-4 text-gray-600" />
              </button>
              <button
                type="button"
                disabled={index === selectedFieldDefs.length - 1}
                onClick={() => onMove(index, index + 1)}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>
              <button
                type="button"
                onClick={() => onRemove(field.key)}
                className="p-1 rounded hover:bg-red-100"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
