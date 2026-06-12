import { useState, useEffect } from 'react';
import { Play, ThumbsUp, MessageCircle, Share2, Users, TrendingUp, BarChart2, Target } from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import TrendChart from '@/components/charts/TrendChart';
import PieChartComponent from '@/components/charts/PieChartComponent';
import DateRangePicker from '@/components/DateRangePicker';
import { useDateRangeStore } from '@/store';
import { api, analyticsApi } from '@/services/api';
import { formatNumber } from '@/components/MetricCard';

interface OverviewData {
  overview: {
    total_accounts: number;
    total_posts: number;
    total_platforms: number;
    living_rooms: number;
  };
  metrics: {
    total_plays: number;
    total_likes: number;
    total_comments: number;
    total_shares: number;
    total_followers: number;
  };
}

interface TopPost {
  id: number;
  title: string;
  cover_image: string;
  platform_name: string;
  platform_display_name: string;
  platform_icon: string;
  play_count: number;
  like_count: number;
  hot_score: number;
  nickname: string;
}

export default function Home() {
  const { startDate, endDate } = useDateRangeStore();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [platformData, setPlatformData] = useState<any[]>([]);
  const [contentTypeData, setContentTypeData] = useState<any[]>([]);
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [channelData, setChannelData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewRes, trendRes, platformRes, contentTypeRes, topPostsRes, channelRes] = await Promise.all([
        api.getOverview(),
        analyticsApi.getTrend({ start_date: startDate, end_date: endDate, type: 'overall' }),
        analyticsApi.getPlatformDistribution({ start_date: startDate, end_date: endDate }),
        analyticsApi.getContentTypeDistribution({ start_date: startDate, end_date: endDate }),
        api.getTopPosts({ limit: 10, sort_by: 'play_count' }),
        analyticsApi.getChannelDistribution({ start_date: startDate, end_date: endDate }),
      ]);

      setOverview(overviewRes.data);
      setTrendData(trendRes.data || []);
      setPlatformData((platformRes.data || []).map((p: any) => ({
        name: p.platform_display_name,
        value: p.play_count,
      })));
      setContentTypeData((contentTypeRes.data || []).map((c: any) => ({
        name: getContentTypeLabel(c.content_type),
        value: c.play_count,
      })));
      setTopPosts(topPostsRes.data || []);
      setChannelData((channelRes.data || []).slice(0, 10).map((c: any) => ({
        name: c.channel,
        value: c.play_count,
      })));
    } catch (error) {
      console.error('Failed to load overview data:', error);
    }
    setLoading(false);
  };

  const getContentTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      video: '视频',
      image: '图文',
      article: '文章',
      live: '直播',
    };
    return map[type] || type;
  };

  if (loading || !overview) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <DateRangePicker />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="总播放量"
          value={overview.metrics.total_plays}
          unit="次"
          change={12.5}
          icon={<Play size={20} />}
          color="blue"
        />
        <MetricCard
          title="总点赞量"
          value={overview.metrics.total_likes}
          unit="次"
          change={8.3}
          icon={<ThumbsUp size={20} />}
          color="red"
        />
        <MetricCard
          title="总评论量"
          value={overview.metrics.total_comments}
          unit="条"
          change={5.7}
          icon={<MessageCircle size={20} />}
          color="purple"
        />
        <MetricCard
          title="总粉丝数"
          value={overview.metrics.total_followers}
          unit="人"
          change={-2.1}
          icon={<Users size={20} />}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="账号总数"
          value={overview.overview.total_accounts}
          unit="个"
          icon={<Users size={20} />}
          color="blue"
        />
        <MetricCard
          title="作品总数"
          value={overview.overview.total_posts}
          unit="个"
          icon={<BarChart2 size={20} />}
          color="green"
        />
        <MetricCard
          title="平台数"
          value={overview.overview.total_platforms}
          unit="个"
          icon={<Target size={20} />}
          color="purple"
        />
        <MetricCard
          title="正在直播"
          value={overview.overview.living_rooms}
          unit="场"
          icon={<TrendingUp size={20} />}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendChart
            data={trendData}
            title="数据趋势"
            metrics={['play_count', 'like_count', 'comment_count', 'share_count']}
            type="line"
            height={320}
          />
        </div>
        <PieChartComponent
          data={platformData}
          title="平台播放量分布"
          height={320}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PieChartComponent
          data={contentTypeData}
          title="内容类型分布"
          height={320}
        />
        <PieChartComponent
          data={channelData}
          title="流量渠道分布"
          height={320}
        />
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <h3 className="text-base font-semibold text-gray-800 mb-4">热门作品排行</h3>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {topPosts.map((post, index) => (
              <div
                key={post.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    index === 0
                      ? 'bg-red-500'
                      : index === 1
                      ? 'bg-orange-500'
                      : index === 2
                      ? 'bg-yellow-500'
                      : 'bg-gray-300'
                  }`}
                >
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{post.title}</p>
                  <p className="text-xs text-gray-500">
                    {post.platform_icon} {post.platform_display_name} · {post.nickname}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-blue-600">{formatNumber(post.play_count)}</p>
                  <p className="text-xs text-gray-500">播放</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
