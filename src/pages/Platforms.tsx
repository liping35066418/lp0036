import { useState, useEffect } from 'react';
import DateRangePicker from '@/components/DateRangePicker';
import MetricCard, { formatNumber } from '@/components/MetricCard';
import PieChartComponent from '@/components/charts/PieChartComponent';
import BarChartComponent from '@/components/charts/BarChartComponent';
import TrendChart from '@/components/charts/TrendChart';
import { useDateRangeStore } from '@/store';
import { api, analyticsApi } from '@/services/api';
import { Users, Video, Play, ThumbsUp, MessageCircle, Share2 } from 'lucide-react';

interface PlatformData {
  platform_id: number;
  platform_name: string;
  platform_display_name: string;
  platform_icon: string;
  play_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  post_count: number;
  account_count: number;
}

export default function PlatformsPage() {
  const { startDate, endDate } = useDateRangeStore();
  const [platformData, setPlatformData] = useState<PlatformData[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<number | null>(null);
  const [platformTrend, setPlatformTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlatformData();
  }, [startDate, endDate]);

  useEffect(() => {
    if (selectedPlatform) {
      loadPlatformTrend();
    } else {
      setPlatformTrend([]);
    }
  }, [selectedPlatform, startDate, endDate]);

  const loadPlatformData = async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getPlatformDistribution({
        start_date: startDate,
        end_date: endDate,
      });
      setPlatformData(res.data || []);

      if (res.data && res.data.length > 0 && !selectedPlatform) {
        setSelectedPlatform(res.data[0].platform_id);
      }
    } catch (error) {
      console.error('Failed to load platform data:', error);
    }
    setLoading(false);
  };

  const loadPlatformTrend = async () => {
    try {
      const res = await analyticsApi.getTrend({
        start_date: startDate,
        end_date: endDate,
        type: 'platform',
        id: selectedPlatform,
      });
      setPlatformTrend(res.data || []);
    } catch (error) {
      console.error('Failed to load platform trend:', error);
    }
  };

  const pieData = platformData.map((p) => ({
    name: p.platform_display_name,
    value: p.play_count,
  }));

  const barData = platformData.map((p) => ({
    name: p.platform_display_name,
    播放量: p.play_count,
    点赞量: p.like_count,
    评论量: p.comment_count,
  }));

  const selectedPlatformData = platformData.find((p) => p.platform_id === selectedPlatform);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <DateRangePicker />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {platformData.map((platform) => (
          <div
            key={platform.platform_id}
            onClick={() => setSelectedPlatform(platform.platform_id)}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedPlatform === platform.platform_id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-2xl mb-2">{platform.platform_icon}</div>
            <p className="text-sm font-medium text-gray-800">{platform.platform_display_name}</p>
            <p className="text-lg font-bold text-blue-600 mt-1">
              {formatNumber(platform.play_count)}
            </p>
            <p className="text-xs text-gray-500">总播放</p>
          </div>
        ))}
      </div>

      {selectedPlatformData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="账号数"
            value={selectedPlatformData.account_count}
            unit="个"
            icon={<Users size={20} />}
            color="blue"
          />
          <MetricCard
            title="作品数"
            value={selectedPlatformData.post_count}
            unit="个"
            icon={<Video size={20} />}
            color="green"
          />
          <MetricCard
            title="总点赞"
            value={selectedPlatformData.like_count}
            unit="次"
            icon={<ThumbsUp size={20} />}
            color="red"
          />
          <MetricCard
            title="总评论"
            value={selectedPlatformData.comment_count}
            unit="条"
            icon={<MessageCircle size={20} />}
            color="purple"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChartComponent
          data={pieData}
          title="各平台播放量占比"
          height={320}
        />
        <BarChartComponent
          data={barData}
          dataKey="name"
          categories={[
            { key: '播放量', label: '播放量', color: '#3B82F6' },
            { key: '点赞量', label: '点赞量', color: '#10B981' },
            { key: '评论量', label: '评论量', color: '#8B5CF6' },
          ]}
          title="各平台指标对比"
          height={320}
        />
      </div>

      {selectedPlatform && platformTrend.length > 0 && (
        <TrendChart
          data={platformTrend}
          title={`${selectedPlatformData?.platform_display_name} 数据趋势`}
          metrics={['play_count', 'like_count', 'comment_count', 'share_count']}
          type="area"
          height={320}
        />
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">平台详情</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">平台</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">账号数</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">作品数</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">播放量</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">点赞量</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">评论量</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">分享量</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {platformData.map((platform) => (
                <tr
                  key={platform.platform_id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedPlatform(platform.platform_id)}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{platform.platform_icon}</span>
                      <span className="text-sm font-medium text-gray-800">{platform.platform_display_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right text-sm text-gray-700">
                    {formatNumber(platform.account_count)}
                  </td>
                  <td className="px-5 py-4 text-right text-sm text-gray-700">
                    {formatNumber(platform.post_count)}
                  </td>
                  <td className="px-5 py-4 text-right text-sm font-medium text-blue-600">
                    {formatNumber(platform.play_count)}
                  </td>
                  <td className="px-5 py-4 text-right text-sm text-gray-700">
                    {formatNumber(platform.like_count)}
                  </td>
                  <td className="px-5 py-4 text-right text-sm text-gray-700">
                    {formatNumber(platform.comment_count)}
                  </td>
                  <td className="px-5 py-4 text-right text-sm text-gray-700">
                    {formatNumber(platform.share_count)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
