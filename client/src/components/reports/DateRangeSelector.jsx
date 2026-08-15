import { useState, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

const getPeriodDates = (period) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(today);

  let startDate = new Date(today);

  switch (period) {
    case 'today':
      startDate = new Date(today);
      break;
    case 'yesterday':
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 1);
      endDate.setDate(endDate.getDate() - 1);
      break;
    case 'this_week':
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - today.getDay());
      break;
    case 'this_month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case 'last_month':
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      endDate.setDate(0);
      break;
    case 'last_7_days':
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'last_30_days':
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 30);
      break;
    default:
      break;
  }

  return { startDate, endDate };
};

const formatDate = (date) => date.toISOString().split('T')[0];

const periodLabels = {
  today: 'Today',
  yesterday: 'Yesterday',
  this_week: 'This Week',
  this_month: 'This Month',
  last_month: 'Last Month',
  last_7_days: 'Last 7 Days',
  last_30_days: 'Last 30 Days',
  custom: 'Custom Date Range'
};

export default function DateRangeSelector({ value, onChange }) {
  const [period, setPeriod] = useState(value?.period || 'last_month');
  const [customStart, setCustomStart] = useState(value?.startDate || '');
  const [customEnd, setCustomEnd] = useState(value?.endDate || '');

  useEffect(() => {
    if (period === 'custom') {
      if (customStart && customEnd) {
        onChange({ period: 'custom', startDate: customStart, endDate: customEnd });
      }
    } else {
      const { startDate, endDate } = getPeriodDates(period);
      onChange({ period, startDate: formatDate(startDate), endDate: formatDate(endDate) });
    }
  }, [period, customStart, customEnd, onChange]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      setCustomStart('');
      setCustomEnd('');
    }
  };

  const { startDate, endDate } = period === 'custom' 
    ? { startDate: customStart, endDate: customEnd }
    : getPeriodDates(period);

  const displayRange = startDate && endDate 
    ? `${new Date(startDate).toLocaleDateString('en-IN')} to ${new Date(endDate).toLocaleDateString('en-IN')}`
    : 'Select date range';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-orange-500" />
        <h3 className="font-semibold text-gray-900">Report Period</h3>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(periodLabels).slice(0, -1).map(([key, label]) => (
            <button
              key={key}
              onClick={() => handlePeriodChange(key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === key
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-3">
          <button
            onClick={() => handlePeriodChange('custom')}
            className={`w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors ${
              period === 'custom'
                ? 'bg-orange-50 border border-orange-200'
                : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            {periodLabels.custom}
          </button>

          {period === 'custom' && (
            <div className="mt-3 space-y-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
              />
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
              />
            </div>
          )}
        </div>

        <div className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
          <p className="text-xs text-orange-700 font-medium">Applied Range:</p>
          <p className="text-sm text-orange-900 font-semibold mt-1">{displayRange}</p>
        </div>
      </div>
    </div>
  );
}
