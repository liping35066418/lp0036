import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatNumber } from '../MetricCard';

interface BarChartComponentProps {
  data: any[];
  dataKey?: string;
  categories?: { key: string; label: string; color?: string }[];
  title?: string;
  height?: number;
  layout?: 'vertical' | 'horizontal';
}

const DEFAULT_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

export default function BarChartComponent({
  data,
  dataKey = 'name',
  categories,
  title,
  height = 320,
  layout = 'horizontal',
}: BarChartComponentProps) {
  const chartCategories = categories || [
    { key: 'value', label: '数值', color: DEFAULT_COLORS[0] },
  ];

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100">
      {title && <h3 className="text-base font-semibold text-gray-800 mb-4">{title}</h3>}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout={layout}
            margin={{ top: 10, right: 30, left: layout === 'vertical' ? 80 : 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis
              type={layout === 'vertical' ? 'number' : 'category'}
              dataKey={layout === 'vertical' ? undefined : dataKey}
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
              tickFormatter={(value) => formatNumber(value)}
            />
            <YAxis
              type={layout === 'vertical' ? 'category' : 'number'}
              dataKey={layout === 'vertical' ? dataKey : undefined}
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
              width={layout === 'vertical' ? 80 : undefined}
              tickFormatter={(value) =>
                layout === 'vertical' ? value : formatNumber(value)
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value: number, name: string) => [formatNumber(value), name]}
            />
            <Legend
              wrapperStyle={{ paddingTop: '10px' }}
              iconType="circle"
              iconSize={8}
            />
            {chartCategories.map((cat, index) => (
              <Bar
                key={cat.key}
                dataKey={cat.key}
                name={cat.label}
                fill={cat.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
