import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import DateRangePicker from '@/components/DateRangePicker';
import TrendChart from '@/components/charts/TrendChart';
import MetricCard, { formatNumber } from '@/components/MetricCard';
import { useDateRangeStore } from '@/store';
import { analyticsApi } from '@/services/api';

interface CompareResult {
  current: any;
  previous: any;
  growth_rates: {
    play_count: number;
    like_count: number;
    comment_count: number;
    share_count: number;
    conversion_count: number;
    conversion_amount: number;
    follower_increase: number;
  };
}

export default function TrendingPage() {
  const { startDate, endDate } = useDateRangeStore();
  const [yoyData, setYoyData] = useState<CompareResult | null>(null);
  const [momData, setMomData] = useState<CompareResult | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [compareType, setCompareType] = useState<'yoy' | 'mom'>('yoy');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [yoyRes, momRes, trendRes] = await Promise.all([
        analyticsApi.getYoY({ start_date: startDate, end_date: endDate, type: 'overall' }),
        analyticsApi.getMoM({ start_date: startDate, end_date: endDate, type: 'overall' }),
        analyticsApi.getTrend({ start_date: startDate, end_date: endDate, type: 'overall' }),
      ]);

      setYoyData(yoyRes.data);
      setMomData(momRes.data);
      setTrendData(trendRes.data || []);
    } catch (error) {
      console.error('Failed to load trending data:', error);
    }
    setLoading(false);
  };

  const compareData = compareType === 'yoy' ? yoyData : momData;

  const GrowthIndicator = ({ value }: { value: number }) => {
    if (value > 0) {
      return (
        <span className="flex items-center gap-1 text-green-500">
          <TrendingUp size={14} />
          +{value.toFixed(2)}%
        </span>
      );
    } else if (value < 0) {
      return (
        <span className="flex items-center gap-1 text-red-500">
          <TrendingDown size={14} />
          {value.toFixed(2)}%
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-gray-400">
        <Minus size={14} />
        0%
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setCompareType('yoy')}
            className={`px-4 py-2 text-sm rounded-lg ${
              compareType === 'yoy'
                ? 'bg-blue-500 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            同比分析
          </button>
          <button
            onClick={() => setCompareType('mom')}
            className={`px-4 py-2 text-sm rounded-lg ${
              compareType === 'mom'
                ? 'bg-blue-500 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            环比分析
          </button>
        </div>
        <DateRangePicker />
      </div>

      {compareData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">播放量</p>
            <p className="text-2xl font-bold text-gray-800">
              {formatNumber(compareData.current.play_count)}
            </p>
            <div className="mt-2">
              <GrowthIndicator value={compareData.growth_rates.play_count} />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              上期: {formatNumber(compareData.previous.play_count)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">点赞量</p>
            <p className="text-2xl font-bold text-gray-800">
              {formatNumber(compareData.current.like_count)}
            </p>
            <div className="mt-2">
              <GrowthIndicator value={compareData.growth_rates.like_count} />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              上期: {formatNumber(compareData.previous.like_count)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">评论量</p>
            <p className="text-2xl font-bold text-gray-800">
              {formatNumber(compareData.current.comment_count)}
            </p>
            <div className="mt-2">
              <GrowthIndicator value={compareData.growth_rates.comment_count} />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              上期: {formatNumber(compareData.previous.comment_count)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">涨粉数</p>
            <p className="text-2xl font-bold text-gray-800">
              {formatNumber(compareData.current.follower_increase)}
            </p>
            <div className="mt-2">
              <GrowthIndicator value={compareData.growth_rates.follower_increase} />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              上期: {formatNumber(compareData.previous.follower_increase)}
            </p>
          </div>
        </div>
      )}

      <TrendChart
        data={trendData}
        title="数据趋势"
        metrics={['play_count', 'like_count', 'comment_count', 'share_count']}
        type="area"
        height={400}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart
          data={trendData}
          title="播放量与点赞量趋势"
          metrics={['play_count', 'like_count']}
          type="line"
          height={300}
        />
        <TrendChart
          data={trendData}
          title="评论与分享趋势"
          metrics={['comment_count', 'share_count']}
          type="line"
          height={300}
        />
      </div>

      {compareData && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4">
            {compareType === 'yoy' ? '同比' : '环比'}增长率详情
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">指标</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">本期</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">上期</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">增减</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">增长率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { key: 'play_count', label: '播放量' },
                  { key: 'like_count', label: '点赞量' },
                  { key: 'comment_count', label: '评论量' },
                  { key: 'share_count', label: '分享量' },
                  { key: 'conversion_count', label: '转化数' },
                  { key: 'follower_increase', label: '涨粉数' },
                ].map((item) => {
                  const current = compareData.current[item.key] || 0;
                  const previous = compareData.previous[item.key] || 0;
                  const growth = compareData.growth_rates[item.key as keyof typeof compareData.growth_rates] || 0;
                  const diff = current - previous;

                  return (
                    <tr key={item.key}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700">{item.label}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-700">
                        {formatNumber(current)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-500">
                        {formatNumber(previous)}
                      </td>
                      <td className={`px-4 py-3 text-right text-sm ${diff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {diff >= 0 ? '+' : ''}{formatNumber(diff)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <GrowthIndicator value={growth} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
