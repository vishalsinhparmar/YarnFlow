import { Loader2, Table2, AlertCircle, Download, Eye } from 'lucide-react';
import Pagination from '../common/Pagination';

export default function PreviewPanel({
  preview,
  selectedFieldDefs,
  onPageChange,
  onPreview,
  onExport,
  onExportPDF,
  exporting,
  exportingPDF
}) {
  const { data, total, page, limit, loading, error } = preview;
  const totalPages = Math.ceil(total / limit) || 1;

  const formatCell = (row, field) => {
    const val = row[field.key];
    if (val === null || val === undefined) return '—';
    if (field.type === 'date' || field.formatter === 'date') {
      return val ? new Date(val).toLocaleDateString('en-IN') : '—';
    }
    if (field.formatter === 'datetime') {
      return val ? new Date(val).toLocaleString('en-IN') : '—';
    }
    if (field.type === 'boolean' || field.formatter === 'boolean') {
      return val === true ? 'Yes' : val === false ? 'No' : '—';
    }
    if (field.formatter === 'percent') {
      return `${val}%`;
    }
    return String(val);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Preview</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onPreview}
            disabled={loading || selectedFieldDefs.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-orange-50 text-orange-700 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
            Preview
          </button>
          <button
            onClick={onExport}
            disabled={exporting || loading || selectedFieldDefs.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Excel
          </button>
          <button
            onClick={onExportPDF}
            disabled={exportingPDF || loading || selectedFieldDefs.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="m-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {selectedFieldDefs.length === 0 && !error && (
        <div className="p-8 text-center text-gray-400">
          <Table2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Select at least one field to preview the report.</p>
        </div>
      )}

      {selectedFieldDefs.length > 0 && data.length === 0 && !loading && !error && (
        <div className="p-8 text-center text-gray-400">
          <Table2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No results match the current filters.</p>
        </div>
      )}

      {loading && (
        <div className="p-8 text-center text-gray-400">
          <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
          <p className="text-sm">Loading preview...</p>
        </div>
      )}

      {!loading && data.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {selectedFieldDefs.map(field => (
                    <th
                      key={field.key}
                      className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap"
                    >
                      {field.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {selectedFieldDefs.map(field => (
                      <td
                        key={field.key}
                        className="px-4 py-2 text-gray-700 whitespace-nowrap max-w-xs truncate"
                        title={formatCell(row, field)}
                      >
                        {formatCell(row, field)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 px-4 py-3">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={limit}
              onPageChange={onPageChange}
            />
          </div>
        </>
      )}
    </div>
  );
}
