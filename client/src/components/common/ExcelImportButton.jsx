import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FileSpreadsheet, Download, Upload, ChevronDown, CheckCircle, XCircle, Loader2, X } from 'lucide-react';
import { importMasterData } from '../../services/masterDataAPI';

/**
 * ExcelImportButton
 * Props:
 *  - type: 'customers' | 'suppliers' | 'products' | 'categories'
 *  - onImportSuccess: () => void  — called after a successful import to refresh list
 *  - accentColor: tailwind color name prefix e.g. 'blue' | 'purple' | 'green' | 'orange'
 *  - sampleData: array of objects — rows for the sample Excel
 *  - sampleHeaders: string[] — ordered column headers for the sample (must match sampleData keys)
 */
const ExcelImportButton = ({ type, onImportSuccess, accentColor = 'blue', sampleHeaders = [], sampleData = [], fullWidth = false }) => {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });

  const updateMenuPosition = useCallback(() => {
    if (!buttonRef.current || !menuRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const workspaceRect = document.querySelector('[data-erp-main]')?.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportMargin = 12;
    const gap = 8;
    const minLeft = Math.max(workspaceRect?.left ?? 0, 0) + viewportMargin;
    const maxRight = Math.min(workspaceRect?.right ?? window.innerWidth, window.innerWidth) - viewportMargin;
    const minTop = Math.max(workspaceRect?.top ?? 0, 0) + viewportMargin;
    const maxBottom = Math.min(workspaceRect?.bottom ?? window.innerHeight, window.innerHeight) - viewportMargin;

    let left = buttonRect.right - menuRect.width;
    if (left < minLeft) left = buttonRect.left;
    left = Math.min(Math.max(left, minLeft), Math.max(minLeft, maxRight - menuRect.width));

    let top = buttonRect.bottom + gap;
    if (top + menuRect.height > maxBottom) top = buttonRect.top - menuRect.height - gap;
    top = Math.min(Math.max(top, minTop), Math.max(minTop, maxBottom - menuRect.height));

    setMenuPosition({ left, top });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      const clickedTrigger = dropdownRef.current?.contains(e.target);
      const clickedMenu = menuRef.current?.contains(e.target);
      if (!clickedTrigger && !clickedMenu) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useLayoutEffect(() => {
    if (!open) return undefined;

    updateMenuPosition();
    const handleViewportChange = () => updateMenuPosition();
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    document.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, updateMenuPosition]);

  const colorMap = {
    blue:   { btn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',   text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    purple: { btn: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500', text: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
    green:  { btn: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',  text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
    orange: { btn: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500', text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  };
  const c = colorMap[accentColor] || colorMap.blue;

  // Download sample Excel file using SheetJS from CDN (or inline a simple CSV)
  const handleDownloadSample = () => {
    // Build CSV content from sampleHeaders and sampleData
    const rows = [sampleHeaders.join(',')];
    sampleData.forEach(row => {
      rows.push(sampleHeaders.map(h => {
        const val = row[h] ?? '';
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      }).join(','));
    });
    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_sample_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  // Upload and import file
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setOpen(false);
    setImporting(true);
    setResult(null);

    try {
      const res = await importMasterData(type, file);
      setResult({ success: true, data: res.data });
      onImportSuccess?.();
    } catch (err) {
      setResult({ success: false, message: err.message || 'Import failed' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Result Toast */}
      {result && createPortal((
        <div
          role={result.success ? 'status' : 'alert'}
          className={`fixed left-4 right-4 top-20 z-[35] flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg sm:left-auto sm:w-full sm:max-w-sm ${
          result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}
        >
          {result.success ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            {result.success ? (
              <div>
                <p className="text-sm font-semibold text-green-800">Import Successful</p>
                <p className="text-xs text-green-700 mt-0.5">
                  {result.data.inserted} added · {result.data.updated} updated · {result.data.skipped} skipped
                </p>
                {result.data.errors?.length > 0 && (
                  <p className="text-xs text-orange-600 mt-0.5">{result.data.errors.length} row(s) had errors</p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-red-800">Import Failed</p>
                <p className="text-xs text-red-700 mt-0.5">{result.message}</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setResult(null)}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            aria-label="Dismiss import result"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ), document.body)}

      {/* Excel Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        disabled={importing}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`${fullWidth ? 'w-full justify-center' : ''} inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 transition-all ${c.btn} disabled:opacity-60`}
      >
        {importing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-4 h-4" />
        )}
        {importing ? 'Importing...' : 'Excel'}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {open && createPortal((
        <div
          ref={menuRef}
          role="menu"
          aria-label="Excel actions"
          className="fixed z-[70] w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
          style={{ left: menuPosition.left, top: menuPosition.top }}
        >
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Excel Actions</p>
          </div>

          {/* Download Sample */}
          <button
            type="button"
            role="menuitem"
            onClick={handleDownloadSample}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <Download className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-800">Download Sample</p>
              <p className="text-xs text-gray-400">CSV template with headers</p>
            </div>
          </button>

          {/* Upload / Import */}
          <button
            type="button"
            role="menuitem"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${c.bg}`}>
              <Upload className={`w-4 h-4 ${c.text}`} />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-800">Upload to Import</p>
              <p className="text-xs text-gray-400">.xlsx or .csv file</p>
            </div>
          </button>
        </div>
      ), document.body)}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default ExcelImportButton;
