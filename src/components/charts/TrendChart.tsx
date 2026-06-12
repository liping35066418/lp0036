import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';
import { formatNumber } from '../MetricCard';

interface TrendChartProps {
  data: any[];
  metrics?: string[];
  colors?: string[];
  title?: string;
  height?: number;
  type?: 'line' | 'area' | 'bar';
}

const defaultMetrics = [
  { key: 'play_count', label: '播放量', color: '#3B82F6' },
  { key: 'like_count', label: '点赞量', color: '#10B981' },
  { key: 'comment_count', label: '评论量', color: '#8B5CF6' },
  { key: 'share_count', label: '分享量', color: '#F59E0B' },
  { key: 'follower_increase', label: '涨粉数', color: '#EF4444' },
  { key: 'conversion_count', label: '转化数', color: '#06B6D4' },
];

export default function TrendChart({
  data,
  metrics,
  title,
  height = 320,
  type = 'line',
}: TrendChartProps) {
  const displayMetrics = metrics
    ? defaultMetrics.filter((m) => metrics.includes(m.key))
    : defaultMetrics.slice(0, 4);

  const ChartComponent = type === 'area' ? AreaChart : type === 'bar' ? BarChart : LineChart;

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100">
      {title && <h3 className="text-base font-semibold text-gray-800 mb-4">{title}</h3>}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
              tickFormatter={(value) => formatNumber(value)}
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
            {displayMetrics.map((metric, index) =>
              type === 'area' ? (
                <Area
                  key={metric.key}
                  type="monotone"
                  dataKey={metric.key}
                  name={metric.label}
                  stroke={metric.color}
                  fill={metric.color}
                  fillOpacity={index === 0 ? 0.2 : 0.1}
                  strokeWidth={2}
                />
              ) : type === 'bar' ? (
                <Bar
                  key={metric.key}
                  dataKey={metric.key}
                  name={metric.label}
                  fill={metric.color}
                  radius={[4, 4, 0, 0]}
                />
              ) : (
                <Line
                  key={metric.key}
                  type="monotone"
                  dataKey={metric.key}
                  name={metric.label}
                  stroke={metric.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              )
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
