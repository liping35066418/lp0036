import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  onClick?: () => void;
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
  orange: 'bg-orange-50 text-orange-600',
  red: 'bg-red-50 text-red-600',
};

const iconBgMap = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  purple: 'bg-purple-100 text-purple-600',
  orange: 'bg-orange-100 text-orange-600',
  red: 'bg-red-100 text-red-600',
};

export function formatNumber(num: number): string {
  if (num >= 100000000) {
    return (num / 100000000).toFixed(1) + '亿';
  }
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toLocaleString();
}

export default function MetricCard({
  title,
  value,
  unit,
  change,
  changeLabel = '环比',
  icon,
  color = 'blue',
  onClick,
}: MetricCardProps) {
  const displayValue = typeof value === 'number' ? formatNumber(value) : value;

  return (
    <div
      className={cn(
        'bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">
            {displayValue}
            {unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
          </p>
        </div>
        {icon && (
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconBgMap[color])}>
            {icon}
          </div>
        )}
      </div>

      {change !== undefined && (
        <div className="mt-3 flex items-center gap-1 text-sm">
          {change > 0 ? (
            <TrendingUp size={14} className="text-green-500" />
          ) : change < 0 ? (
            <TrendingDown size={14} className="text-red-500" />
          ) : (
            <Minus size={14} className="text-gray-400" />
          )}
          <span
            className={cn(
              change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-gray-400'
            )}
          >
            {change > 0 ? '+' : ''}
            {change.toFixed(1)}%
          </span>
          <span className="text-gray-400">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}
