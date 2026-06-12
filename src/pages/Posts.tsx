import { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, Eye, ThumbsUp, MessageCircle, Share2, TrendingUp, BarChart3 } from 'lucide-react';
import DateRangePicker from '@/components/DateRangePicker';
import TrendChart from '@/components/charts/TrendChart';
import { useDateRangeStore, useFilterStore } from '@/store';
import { api, analyticsApi } from '@/services/api';
import { formatNumber } from '@/components/MetricCard';
import PieChartComponent from '@/components/charts/PieChartComponent';

interface Post {
  id: number;
  title: string;
  content_type: string;
  platform_name: string;
  platform_display_name: string;
  platform_icon: string;
  publish_time: string;
  play_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  channel: string;
  nickname: string;
  hot_score: number;
}

export default function PostsPage() {
  const { startDate, endDate } = useDateRangeStore();
  const { contentType, channel, setContentType, setChannel } = useFilterStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('publish_time');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [contentTypeData, setContentTypeData] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadPosts();
    loadTrendData();
    loadContentTypeData();
  }, [startDate, endDate, page, pageSize, keyword, sortBy, sortOrder, contentType, channel]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await api.getPosts({
        start_date: startDate,
        end_date: endDate,
        page,
        pageSize,
        keyword: keyword || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        content_type: contentType || undefined,
        channel: channel || undefined,
      });
      setPosts(res.data.list);
      setTotal(res.data.total);
    } catch (error) {
      console.error('Failed to load posts:', error);
    }
    setLoading(false);
  };

  const loadTrendData = async () => {
    try {
      const res = await analyticsApi.getTrend({
        start_date: startDate,
        end_date: endDate,
        type: 'overall',
      });
      setTrendData(res.data || []);
    } catch (error) {
      console.error('Failed to load trend data:', error);
    }
  };

  const loadContentTypeData = async () => {
    try {
      const res = await analyticsApi.getContentTypeDistribution({
        start_date: startDate,
        end_date: endDate,
      });
      setContentTypeData(
        (res.data || []).map((c: any) => ({
          name: getContentTypeLabel(c.content_type),
          value: c.play_count,
        }))
      );
    } catch (error) {
      console.error('Failed to load content type data:', error);
    }
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

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索作品标题..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Filter size={16} />
            筛选
            <ChevronDown size={16} className={showFilters ? 'rotate-180' : ''} />
          </button>
        </div>
        <DateRangePicker />
      </div>

      {showFilters && (
        <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">内容类型</label>
              <div className="flex gap-2">
                {['video', 'image', 'article'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setContentType(contentType === type ? null : type)}
                    className={`px-3 py-1.5 text-sm rounded-md border ${
                      contentType === type
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {getContentTypeLabel(type)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">排序方式</label>
              <select
                value={`${sortBy}_${sortOrder}`}
                onChange={(e) => {
                  const [by, order] = e.target.value.split('_');
                  setSortBy(by);
                  setSortOrder(order);
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md"
              >
                <option value="publish_time_DESC">发布时间降序</option>
                <option value="publish_time_ASC">发布时间升序</option>
                <option value="play_count_DESC">播放量降序</option>
                <option value="like_count_DESC">点赞量降序</option>
                <option value="comment_count_DESC">评论量降序</option>
                <option value="share_count_DESC">分享量降序</option>
                <option value="hot_score_DESC">热度降序</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendChart
            data={trendData}
            title="作品数据趋势"
            metrics={['play_count', 'like_count', 'comment_count', 'share_count']}
            type="area"
            height={280}
          />
        </div>
        <PieChartComponent
          data={contentTypeData}
          title="内容类型分布"
          height={280}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-800">作品列表</h3>
          <span className="text-sm text-gray-500">共 {total} 条</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  作品
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  平台
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  类型
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  播放
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  点赞
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  评论
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  分享
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  热度
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-gray-500">
                    暂无数据
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr
                    key={post.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedPost(post)}
                  >
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-800 truncate max-w-xs">{post.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {post.nickname} · {new Date(post.publish_time).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm">
                        {post.platform_icon} {post.platform_display_name}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                          post.content_type === 'video'
                            ? 'bg-blue-50 text-blue-600'
                            : post.content_type === 'image'
                            ? 'bg-green-50 text-green-600'
                            : 'bg-purple-50 text-purple-600'
                        }`}
                      >
                        {getContentTypeLabel(post.content_type)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-gray-700">
                      {formatNumber(post.play_count)}
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-gray-700">
                      {formatNumber(post.like_count)}
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-gray-700">
                      {formatNumber(post.comment_count)}
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-gray-700">
                      {formatNumber(post.share_count)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-medium text-orange-500">
                        {post.hot_score?.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              第 {page} / {totalPages} 页
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedPost && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">{selectedPost.title}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedPost.platform_icon} {selectedPost.platform_display_name} · {selectedPost.nickname}
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <Eye size={20} className="mx-auto text-blue-500 mb-1" />
                  <p className="text-xl font-bold text-blue-600">{formatNumber(selectedPost.play_count)}</p>
                  <p className="text-xs text-blue-500">播放量</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <ThumbsUp size={20} className="mx-auto text-red-500 mb-1" />
                  <p className="text-xl font-bold text-red-600">{formatNumber(selectedPost.like_count)}</p>
                  <p className="text-xs text-red-500">点赞量</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <MessageCircle size={20} className="mx-auto text-purple-500 mb-1" />
                  <p className="text-xl font-bold text-purple-600">{formatNumber(selectedPost.comment_count)}</p>
                  <p className="text-xs text-purple-500">评论量</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <Share2 size={20} className="mx-auto text-green-500 mb-1" />
                  <p className="text-xl font-bold text-green-600">{formatNumber(selectedPost.share_count)}</p>
                  <p className="text-xs text-green-500">分享量</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">发布时间：</span>{new Date(selectedPost.publish_time).toLocaleString()}</p>
                <p><span className="text-gray-500">内容类型：</span>{getContentTypeLabel(selectedPost.content_type)}</p>
                {selectedPost.channel && <p><span className="text-gray-500">频道：</span>{selectedPost.channel}</p>}
                <p><span className="text-gray-500">热度值：</span><span className="text-orange-500 font-medium">{selectedPost.hot_score?.toFixed(2)}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
