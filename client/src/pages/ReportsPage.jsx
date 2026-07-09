import { useState } from 'react';
import { BarChart3, Download, Loader2, Package, ClipboardCheck, ShoppingCart, FileText, Truck, Database, Calendar } from 'lucide-react';
import reportsAPI from '../services/reportsAPI';

const REPORTS = [
  {
    key: 'inventory',
    label: 'Inventory Stock',
    description: 'All inventory lots with stock in/out, balance weight per product, sub-product, category and warehouse.',
    icon: Package,
    color: 'from-purple-500 to-indigo-500',
    bgLight: 'bg-purple-50',
    textColor: 'text-purple-700',
    hasDateFilter: true,
    dateField: 'Created Date'
  },
  {
    key: 'grn',
    label: 'Goods Receipt Notes',
    description: 'All GRNs with supplier, PO reference, items received, quantities, weights and warehouse.',
    icon: ClipboardCheck,
    color: 'from-teal-500 to-green-500',
    bgLight: 'bg-teal-50',
    textColor: 'text-teal-700',
    hasDateFilter: true,
    dateField: 'Receipt Date'
  },
  {
    key: 'purchaseOrders',
    label: 'Purchase Orders',
    description: 'All POs with supplier, items, ordered/received quantities, rates and amounts.',
    icon: ShoppingCart,
    color: 'from-orange-500 to-amber-500',
    bgLight: 'bg-orange-50',
    textColor: 'text-orange-700',
    hasDateFilter: true,
    dateField: 'Order Date'
  },
  {
    key: 'salesOrders',
    label: 'Sales Orders',
    description: 'All SOs with customer, items, ordered/dispatched quantities, rates and amounts.',
    icon: FileText,
    color: 'from-blue-500 to-cyan-500',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-700',
    hasDateFilter: true,
    dateField: 'Order Date'
  },
  {
    key: 'salesChallans',
    label: 'Sales Challans',
    description: 'All challans with customer, SO reference, dispatched items, quantities, weights and warehouse.',
    icon: Truck,
    color: 'from-rose-500 to-pink-500',
    bgLight: 'bg-rose-50',
    textColor: 'text-rose-700',
    hasDateFilter: true,
    dateField: 'Challan Date'
  },
  {
    key: 'masterData',
    label: 'Master Data',
    description: 'Categories, Products, Customers and Suppliers in one workbook with 4 sheets.',
    icon: Database,
    color: 'from-gray-600 to-slate-600',
    bgLight: 'bg-gray-50',
    textColor: 'text-gray-700',
    hasDateFilter: false,
    dateField: null
  }
];

export default function ReportsPage() {
  const [downloading, setDownloading] = useState({});
  const [error, setError]             = useState('');
  const [dates, setDates]             = useState({});

  const handleDownload = async (report) => {
    setError('');
    setDownloading(p => ({ ...p, [report.key]: true }));
    try {
      const params = {};
      if (report.hasDateFilter) {
        if (dates[`${report.key}_from`]) params.from = dates[`${report.key}_from`];
        if (dates[`${report.key}_to`])   params.to   = dates[`${report.key}_to`];
      }
      await reportsAPI[report.key](params);
    } catch (e) {
      setError(`Failed to download ${report.label}: ${e.message}`);
    } finally {
      setDownloading(p => ({ ...p, [report.key]: false }));
    }
  };

  const setDate = (key, field, val) => {
    setDates(p => ({ ...p, [`${key}_${field}`]: val }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-orange-500" /> Reports
        </h1>
        <p className="text-sm text-gray-500 mt-1">Download Excel reports with optional date range filters</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {REPORTS.map(report => {
          const Icon = report.icon;
          const isLoading = downloading[report.key];
          return (
            <div key={report.key} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              {/* Card Header */}
              <div className={`bg-gradient-to-r ${report.color} px-5 py-4 flex items-center gap-3`}>
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">{report.label}</h3>
                  <p className="text-white/70 text-xs mt-0.5">Excel (.xlsx)</p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col gap-4">
                <p className="text-sm text-gray-500 leading-relaxed">{report.description}</p>

                {/* Date Filter */}
                {report.hasDateFilter && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Filter by {report.dateField}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">From</label>
                        <input
                          type="date"
                          className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                          value={dates[`${report.key}_from`] || ''}
                          onChange={e => setDate(report.key, 'from', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">To</label>
                        <input
                          type="date"
                          className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                          value={dates[`${report.key}_to`] || ''}
                          onChange={e => setDate(report.key, 'to', e.target.value)}
                        />
                      </div>
                    </div>
                    {(dates[`${report.key}_from`] || dates[`${report.key}_to`]) && (
                      <button
                        onClick={() => setDates(p => { const n = {...p}; delete n[`${report.key}_from`]; delete n[`${report.key}_to`]; return n; })}
                        className="text-xs text-gray-400 hover:text-gray-600 underline"
                      >
                        Clear filter
                      </button>
                    )}
                  </div>
                )}

                {/* Download Button */}
                <button
                  onClick={() => handleDownload(report)}
                  disabled={isLoading}
                  className={`mt-auto w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r ${report.color} text-white hover:shadow-md hover:scale-[1.01] active:scale-[0.99]`}
                >
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                    : <><Download className="w-4 h-4" /> Download Excel</>}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
