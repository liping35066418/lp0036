import { useDateRangeStore } from '@/store';
import { Calendar, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { format, subDays, subWeeks, subMonths } from 'date-fns';

const presets = [
  { label: '今日', days: 0 },
  { label: '近7天', days: 7 },
  { label: '近30天', days: 30 },
  { label: '近90天', days: 90 },
];

export default function DateRangePicker() {
  const { startDate, endDate, setDateRange, setPreset } = useDateRangeStore();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm text-gray-700"
      >
        <Calendar size={16} />
        <span>
          {startDate} 至 {endDate}
        </span>
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-72">
          <div className="p-3 border-b border-gray-100">
            <div className="text-sm font-medium text-gray-700 mb-2">快捷选择</div>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    setPreset(preset.days);
                    setIsOpen(false);
                  }}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-blue-100 hover:text-blue-600 rounded-md transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <div className="p-3">
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">开始日期</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setDateRange(e.target.value, endDate)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">结束日期</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setDateRange(startDate, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
