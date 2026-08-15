import { useState, useEffect } from 'react';
import { useReportBuilder } from './useReportBuilder';
import FieldPanel from './FieldPanel';
import ColumnSelector from './ColumnSelector';
import FilterBuilder from './FilterBuilder';
import SortBuilder from './SortBuilder';
import PreviewPanel from './PreviewPanel';
import DateRangeSelector from './DateRangeSelector';
import reportsAPI from '../../services/reportsAPI';
import { BarChart3, ChevronDown, Loader2, AlertCircle, RotateCcw, Save } from 'lucide-react';

export default function ReportBuilder() {
  const rb = useReportBuilder();
  const [exportError, setExportError] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const handleLoadConfig = async (e) => {
      const { reportId } = e.detail;
      if (reportId) {
        await rb.loadSavedReportById(reportId);
      }
    };

    const handleEditConfig = async (e) => {
      const { reportId } = e.detail;
      if (reportId) {
        await rb.loadSavedReportById(reportId);
      }
    };

    window.addEventListener('loadReportConfig', handleLoadConfig);
    window.addEventListener('editReportConfig', handleEditConfig);

    return () => {
      window.removeEventListener('loadReportConfig', handleLoadConfig);
      window.removeEventListener('editReportConfig', handleEditConfig);
    };
  }, [rb]);

  const handleSaveTemplate = async () => {
    if (!saveName.trim()) {
      setSaveError('Please enter a template name');
      return;
    }
    if (!rb.selectedReportKey) {
      setSaveError('Please select a report module first');
      return;
    }

    setSaving(true);
    setSaveError('');
    try {
      await rb.saveReport(saveName);
      setSaveName('');
      setShowSaveModal(false);
    } catch (err) {
      setSaveError(err.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExportError('');
    try {
      const selectedReport = rb.reports.find(r => r.key === rb.selectedReportKey);
      const reportName = selectedReport?.name || rb.selectedReportKey;
      const dateRangeStr = `${new Date(rb.dateRange.startDate).toLocaleDateString('en-IN')} to ${new Date(rb.dateRange.endDate).toLocaleDateString('en-IN')}`;
      const filename = `${rb.selectedReportKey}_Report_${Date.now()}.xlsx`;
      
      // Call export API to get the file blob
      const blob = await reportsAPI.export(rb.selectedReportKey, rb.buildPayload(), filename);
      
      if (!blob) {
        throw new Error('No file data returned from export');
      }
      
      // Convert blob to base64 for storage
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result.split(',')[1]; // Remove data:application/... prefix
          
          if (!base64Data) {
            throw new Error('Failed to convert file to base64');
          }
          
          // Save to backend with file data
          const result = await reportsAPI.createDownload({
            reportName,
            reportKey: rb.selectedReportKey,
            dateRange: dateRangeStr,
            filename,
            fileData: base64Data
          });
          
          console.log('Download saved:', result);
          
          // Notify Downloads tab to refresh
          window.dispatchEvent(new CustomEvent('downloadCreated', { detail: result }));
        } catch (err) {
          console.error('Error saving download:', err);
          setExportError(`Export successful but failed to save download record: ${err.message}`);
        }
      };
      reader.onerror = () => {
        setExportError('Failed to read file data');
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      setExportError(err.message || 'Export failed');
    }
  };

  const selectedReport = rb.reports.find(r => r.key === rb.selectedReportKey);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-orange-500" /> Reports
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Build dynamic reports with custom fields, filters, sorting and Excel export.
        </p>
      </div>

      {(rb.reportsError || exportError) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {rb.reportsError || exportError}
        </div>
      )}

      {/* Report selector */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200 p-5 shadow-sm">
        <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-orange-600" />
          Select Report Module
        </label>
        <div className="relative">
          <select
            value={rb.selectedReportKey}
            onChange={(e) => {
              rb.setSelectedReportKey(e.target.value);
              rb.setCurrentSavedReportId(null);
            }}
            disabled={rb.reportsLoading}
            className="w-full appearance-none border-2 border-orange-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none bg-white disabled:opacity-60 cursor-pointer hover:border-orange-400 transition-colors"
          >
            <option value="">📋 Choose a report...</option>
            {rb.reports.map(report => (
              <option key={report.key} value={report.key}>{report.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-3.5 w-5 h-5 text-orange-600 pointer-events-none font-bold" />
          {rb.reportsLoading && <Loader2 className="absolute right-12 top-3.5 w-4 h-4 text-orange-500 animate-spin" />}
        </div>
        {selectedReport?.description && (
          <p className="text-sm text-gray-700 mt-3 p-2 bg-white rounded-lg border border-orange-200">{selectedReport.description}</p>
        )}
        {!rb.selectedReportKey && (
          <p className="text-xs text-gray-600 mt-3 italic">👆 Select a report module to get started</p>
        )}
      </div>

      {/* Save Template Button */}
      {rb.selectedReportKey && !rb.definitionLoading && (
        <div className="flex gap-2">
          <button
            onClick={() => {
              // Pre-fill name if editing
              if (rb.currentSavedReportId) {
                const currentReport = rb.savedReports.find(r => r._id === rb.currentSavedReportId);
                setSaveName(currentReport?.name || '');
              }
              setShowSaveModal(true);
            }}
            disabled={rb.selectedFields.length === 0}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold text-sm hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            💾 {rb.currentSavedReportId ? 'Update Template' : 'Save Template'}
          </button>
          <p className="text-xs text-gray-500 flex items-center">
            {rb.currentSavedReportId 
              ? '✏️ Editing existing template - changes will update it' 
              : 'Save your current report configuration as a template for future use'}
          </p>
        </div>
      )}

      {/* Save Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {rb.currentSavedReportId ? 'Update Report Template' : 'Save Report Template'}
            </h2>
            
            {saveError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                {saveError}
              </div>
            )}

            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Enter template name..."
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 mb-4 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
              autoFocus
            />

            <div className="flex gap-2">
              <button
                onClick={handleSaveTemplate}
                disabled={saving || !saveName.trim()}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold text-sm hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : '💾'}
                Save
              </button>
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setSaveName('');
                  setSaveError('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {rb.definitionLoading && (
        <div className="py-8 text-center text-gray-400">
          <Loader2 className="w-8 h-8 mx-auto animate-spin mb-2" />
          <p className="text-sm">Loading report definition...</p>
        </div>
      )}

      {rb.definition && !rb.definitionLoading && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Left sidebar: fields, date range, then saved reports and downloads at bottom */}
          <div className="xl:col-span-3 space-y-5 flex flex-col">
            <DateRangeSelector
              value={rb.dateRange}
              onChange={rb.setDateRange}
            />
            <FieldPanel
              definition={rb.definition}
              selectedFields={rb.selectedFields}
              onToggle={rb.toggleField}
            />
            <ColumnSelector
              selectedFieldDefs={rb.selectedFieldDefs}
              onRemove={rb.toggleField}
              onMove={rb.moveField}
            />
            
          </div>

          {/* Right main: filters, sort, preview */}
          <div className="xl:col-span-9 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <FilterBuilder
                definition={rb.definition}
                filters={rb.filters}
                onChange={rb.setFilters}
              />
              <SortBuilder
                definition={rb.definition}
                sort={rb.sort}
                onChange={rb.setSort}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={rb.clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear filters
              </button>
            </div>

            <PreviewPanel
              preview={rb.preview}
              selectedFieldDefs={rb.selectedFieldDefs}
              onPageChange={(page) => rb.runPreview(page)}
              onPreview={() => rb.runPreview(1)}
              onExport={handleExport}
              exporting={rb.exporting}
            />
          </div>
        </div>
      )}
    </div>
  );
}
