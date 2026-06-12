import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatNumber } from '../MetricCard';

interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface PieChartComponentProps {
  data: PieChartData[];
  title?: string;
  height?: number;
  dataKey?: string;
  nameKey?: string;
  innerRadius?: number;
  outerRadius?: number;
}

const DEFAULT_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#84CC16'];

export default function PieChartComponent({
  data,
  title,
  height = 300,
  dataKey = 'value',
  nameKey = 'name',
  innerRadius = 60,
  outerRadius = 100,
}: PieChartComponentProps) {
  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100">
      {title && <h3 className="text-base font-semibold text-gray-800 mb-4">{title}</h3>}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              dataKey={dataKey}
              nameKey={nameKey}
              paddingAngle={2}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [formatNumber(value), name]}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
