import { useState, useEffect } from 'react';
import { Download, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import reportsAPI from '../../services/reportsAPI';

export default function AllReportDownloads() {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    loadDownloads();
    
    // Listen for new downloads created from export
    const handleDownloadCreated = () => {
      loadDownloads();
    };
    
    window.addEventListener('downloadCreated', handleDownloadCreated);
    return () => {
      window.removeEventListener('downloadCreated', handleDownloadCreated);
    };
  }, []);

  const loadDownloads = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await reportsAPI.getDownloads();
      setDownloads(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load downloads');
    } finally {
      setLoading(false);
    }
  };

  const [downloadModal, setDownloadModal] = useState(null);

  const handleDownload = (download) => {
    // Show download modal with file info
    setDownloadModal(download);
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await reportsAPI.deleteDownload(id);
      setDownloads(prev => prev.filter(d => d._id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete download');
    } finally {
      setDeleting(null);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete all downloads?')) return;
    setLoading(true);
    try {
      await reportsAPI.clearDownloads();
      setDownloads([]);
      setCurrentPage(1);
    } catch (err) {
      setError(err.message || 'Failed to clear downloads');
    } finally {
      setLoading(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(downloads.length / pageSize);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const paginatedDownloads = downloads.slice(startIdx, endIdx);

  return (
    <div className="space-y-4">
      {downloads.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-2">No downloaded reports yet</p>
          <p className="text-sm text-gray-500">Generate reports from the "Build Report" tab to see them here</p>
        </div>
      ) : (
        <>
          {/* Header with Clear All button */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              <strong>{downloads.length}</strong> report{downloads.length !== 1 ? 's' : ''} downloaded
            </div>
            <button
              onClick={handleClearAll}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Clear All
            </button>
          </div>

          {/* Downloads Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Report Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Module</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Date Range</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Generated</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedDownloads.map(download => (
                  <tr key={download._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{download.reportName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {download.reportKey || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{download.dateRange}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(download.generatedAt).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(download)}
                          title="Download this report"
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(download._id)}
                          disabled={deleting === download._id}
                          title="Delete this download"
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {deleting === download._id ? (
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
                Showing <span className="font-semibold">{startIdx + 1}</span> to <span className="font-semibold">{Math.min(endIdx, downloads.length)}</span> of <span className="font-semibold">{downloads.length}</span> downloads
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

      {/* Download Modal */}
      {downloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Download className="w-5 h-5 text-orange-600" />
              Download Report
            </h2>

            <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-500 font-semibold">REPORT NAME</p>
                <p className="text-sm font-medium text-gray-900">{downloadModal.reportName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold">FILENAME</p>
                <p className="text-sm font-medium text-gray-900 break-all">{downloadModal.filename}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold">GENERATED</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(downloadModal.generatedAt).toLocaleString('en-IN')}
                </p>
              </div>
              {downloadModal.dateRange && (
                <div>
                  <p className="text-xs text-gray-500 font-semibold">DATE RANGE</p>
                  <p className="text-sm font-medium text-gray-900">{downloadModal.dateRange}</p>
                </div>
              )}
            </div>

            {/* <div className="bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-lg text-sm mb-6">
              <p className="font-semibold mb-1">📝 Note</p>
              <p>File download functionality would be implemented with actual file storage backend.</p>
            </div> */}

            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    // Fetch the file blob from backend
                    const blob = await reportsAPI.downloadFile(downloadModal._id);
                    
                    // Create download link and trigger download
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = downloadModal.filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    
                    setDownloadModal(null);
                  } catch (err) {
                    console.error('Download error:', err);
                    setError(err.message || 'Failed to download file');
                  }
                }}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold text-sm hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={() => setDownloadModal(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
