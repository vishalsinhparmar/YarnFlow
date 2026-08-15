import { useState, useEffect, useRef } from 'react';
import { BarChart3, Save, Download } from 'lucide-react';
import ReportBuilder from './ReportBuilder';
import AllSavedReports from './AllSavedReports';
import AllReportDownloads from './AllReportDownloads';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('build');
  const reportBuilderRef = useRef(null);

  useEffect(() => {
    // Listen for events from Saved Reports tab
    const handleLoadReport = (e) => {
      setActiveTab('build');
      // Dispatch event to ReportBuilder to load the report
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('loadReportConfig', { 
          detail: e.detail 
        }));
      }, 100);
    };

    const handleEditReport = (e) => {
      setActiveTab('build');
      // Dispatch event to ReportBuilder to load for editing
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('editReportConfig', { 
          detail: e.detail 
        }));
      }, 100);
    };

    window.addEventListener('loadSavedReport', handleLoadReport);
    window.addEventListener('editSavedReport', handleEditReport);

    return () => {
      window.removeEventListener('loadSavedReport', handleLoadReport);
      window.removeEventListener('editSavedReport', handleEditReport);
    };
  }, []);

  const tabs = [
    { id: 'build', label: 'Build Report', icon: BarChart3 },
    { id: 'saved', label: 'Saved Reports', icon: Save },
    { id: 'downloads', label: 'Downloads', icon: Download }
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-orange-500" /> Reports
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Build dynamic reports, manage saved reports, and access downloads from all modules.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600 bg-orange-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'build' && <ReportBuilder />}
        {activeTab === 'saved' && <AllSavedReports />}
        {activeTab === 'downloads' && <AllReportDownloads />}
      </div>
    </div>
  );
}
