import { useState, useEffect } from 'react';
import { Trash2, Play, Edit2, Loader2, AlertCircle } from 'lucide-react';
import reportsAPI from '../../services/reportsAPI';

export default function AllSavedReports() {
  const [savedReports, setSavedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    loadSavedReports();
  }, []);

  const loadSavedReports = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await reportsAPI.getSavedReports();
      setSavedReports(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load saved reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this saved report?')) return;
    
    setDeleting(id);
    try {
      await reportsAPI.deleteSavedReport(id);
      setSavedReports(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete report');
    } finally {
      setDeleting(null);
    }
  };

  const handleRun = (report) => {
    // Load the report configuration and switch to Build Report tab
    // This will be handled by parent component or context
    window.dispatchEvent(new CustomEvent('loadSavedReport', { 
      detail: { reportId: report._id, reportKey: report.reportKey }
    }));
  };

  const handleEdit = (report) => {
    // Load the report for editing in the Build Report tab
    window.dispatchEvent(new CustomEvent('editSavedReport', { 
      detail: { reportId: report._id, reportKey: report.reportKey }
    }));
  };

  // Pagination
  const totalPages = Math.ceil(savedReports.length / pageSize);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const paginatedReports = savedReports.slice(startIdx, endIdx);

  if (loading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-orange-500 mb-2" />
        <p className="text-gray-600">Loading saved reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {savedReports.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-2">No saved reports yet</p>
          <p className="text-sm text-gray-500">Go to "Build Report" tab to create and save a report</p>
        </div>
      ) : (
        <>
          {/* Reports Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Report Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Module</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Created By</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Created Date</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedReports.map(report => (
                  <tr key={report._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{report.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                        {report.reportKey}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{report.createdBy || 'System'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(report.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRun(report)}
                          title="Run this report"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(report)}
                          title="Edit this report"
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(report._id)}
                          disabled={deleting === report._id}
                          title="Delete this report"
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {deleting === report._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-4">
            {/* Left: Info and Page Size */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold">{startIdx + 1}</span> to <span className="font-semibold">{Math.min(endIdx, savedReports.length)}</span> of <span className="font-semibold">{savedReports.length}</span> reports
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Per page:</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Right: Pagination Buttons */}
            {totalPages > 1 && (
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="First page"
                >
                  ⟨⟨
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous page"
                >
                  ⟨
                </button>
                
                {/* Page Numbers - Show max 5 pages */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const startPage = Math.max(1, currentPage - 2);
                    const page = startPage + i;
                    if (page > totalPages) return null;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-orange-500 text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next page"
                >
                  ⟩
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Last page"
                >
                  ⟩⟩
                </button>

                <span className="text-sm text-gray-600 ml-2">
                  Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
