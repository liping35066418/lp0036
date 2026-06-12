import { useState, useEffect } from 'react';
import { Plus, X, Users, TrendingUp, TrendingDown, Minus, Play, ThumbsUp, MessageCircle, Share2 } from 'lucide-react';
import DateRangePicker from '@/components/DateRangePicker';
import MetricCard, { formatNumber } from '@/components/MetricCard';
import TrendChart from '@/components/charts/TrendChart';
import BarChartComponent from '@/components/charts/BarChartComponent';
import { useDateRangeStore } from '@/store';
import { api, analyticsApi } from '@/services/api';

interface Account {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  platform_id: number;
  platform_name: string;
  platform_display_name: string;
  platform_icon: string;
  followers_count: number;
  total_likes: number;
  total_plays: number;
  status: string;
}

interface CompareData {
  account_id: number;
  username: string;
  nickname: string;
  avatar: string;
  platform_name: string;
  platform_display_name: string;
  platform_icon: string;
  followers_count: number;
  play_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  conversion_count: number;
  conversion_amount: number;
  follower_increase: number;
  post_count: number;
  avg_play_count: number;
  avg_like_count: number;
  interaction_rate: number;
  play_rate: number;
}

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

export default function AccountsPage() {
  const { startDate, endDate } = useDateRangeStore();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const [compareData, setCompareData] = useState<CompareData[]>([]);
  const [trendDataList, setTrendDataList] = useState<{ accountId: number; nickname: string; data: any[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccounts.length > 0) {
      loadCompareData();
      loadTrendData();
    }
  }, [selectedAccounts, startDate, endDate]);

  const loadAccounts = async () => {
    try {
      const res = await api.getAccounts({ pageSize: 50 });
      setAccounts(res.data.list);

      if (res.data.list.length > 0) {
        const firstFive = res.data.list.slice(0, 3).map((a: Account) => a.id);
        setSelectedAccounts(firstFive);
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
    setLoading(false);
  };

  const loadCompareData = async () => {
    try {
      const res = await analyticsApi.compareAccounts(selectedAccounts, {
        start_date: startDate,
        end_date: endDate,
      });
      setCompareData(res.data || []);
    } catch (error) {
      console.error('Failed to load compare data:', error);
    }
  };

  const loadTrendData = async () => {
    try {
      const results = await Promise.all(
        selectedAccounts.map(async (accountId) => {
          const res = await analyticsApi.getTrend({
            start_date: startDate,
            end_date: endDate,
            type: 'account',
            id: accountId,
          });
          const account = accounts.find((a) => a.id === accountId);
          return {
            accountId,
            nickname: account?.nickname || `账号${accountId}`,
            data: res.data || [],
          };
        })
      );
      setTrendDataList(results);
    } catch (error) {
      console.error('Failed to load trend data:', error);
    }
  };

  const toggleAccount = (accountId: number) => {
    setSelectedAccounts((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]
    );
  };

  const getMetricMax = (key: keyof CompareData) => {
    if (compareData.length === 0) return 0;
    return Math.max(...compareData.map((d) => Number(d[key]) || 0));
  };

  const mergedTrendData = trendDataList.length > 0
    ? trendDataList[0].data.map((item, index) => {
        const merged: any = { date: item.date };
        trendDataList.forEach((trend, i) => {
          if (trend.data[index]) {
            merged[`play_count_${i}`] = trend.data[index].play_count;
          }
        });
        return merged;
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {selectedAccounts.slice(0, 5).map((id, index) => {
              const account = accounts.find((a) => a.id === id);
              return (
                <div
                  key={id}
                  className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                >
                  {account?.nickname?.charAt(0) || 'A'}
                </div>
              );
            })}
            {selectedAccounts.length > 5 && (
              <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
                +{selectedAccounts.length - 5}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowSelector(!showSelector)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <Plus size={14} />
            选择对比账号
          </button>
        </div>
        <DateRangePicker />
      </div>

      {showSelector && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-800">选择要对比的账号（最多6个）</h4>
            <button onClick={() => setShowSelector(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-60 overflow-y-auto">
            {accounts.map((account) => {
              const isSelected = selectedAccounts.includes(account.id);
              const colorIndex = selectedAccounts.indexOf(account.id);
              return (
                <div
                  key={account.id}
                  onClick={() => {
                    if (!isSelected && selectedAccounts.length >= 6) return;
                    toggleAccount(account.id);
                  }}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
                      style={{
                        backgroundColor: isSelected ? COLORS[colorIndex % COLORS.length] : '#D1D5DB',
                      }}
                    >
                      {account.nickname?.charAt(0) || account.username?.charAt(0) || 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{account.nickname}</p>
                      <p className="text-xs text-gray-500">
                        {account.platform_icon} {account.platform_display_name}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    粉丝: {formatNumber(account.followers_count)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {compareData.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['play_count', 'like_count', 'comment_count', 'follower_increase'].map((metric) => {
              const labels: Record<string, string> = {
                play_count: '总播放量',
                like_count: '总点赞量',
                comment_count: '总评论量',
                follower_increase: '净增粉丝',
              };
              const icons: Record<string, React.ReactNode> = {
                play_count: <Play size={20} />,
                like_count: <ThumbsUp size={20} />,
                comment_count: <MessageCircle size={20} />,
                follower_increase: <Users size={20} />,
              };
              const colors: Record<string, string> = {
                play_count: 'blue',
                like_count: 'red',
                comment_count: 'purple',
                follower_increase: 'green',
              };
              const maxVal = getMetricMax(metric as keyof CompareData);
              const topAccount = compareData.find(
                (d) => Number(d[metric as keyof CompareData]) === maxVal
              );

              return (
                <div key={metric} className="bg-white rounded-xl p-5 border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500">{labels[metric]}</span>
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        colors[metric] === 'blue'
                          ? 'bg-blue-100 text-blue-600'
                          : colors[metric] === 'red'
                          ? 'bg-red-100 text-red-600'
                          : colors[metric] === 'purple'
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-green-100 text-green-600'
                      }`}
                    >
                      {icons[metric]}
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 mb-2">
                    {formatNumber(Number(topAccount?.[metric as keyof CompareData]) || 0)}
                  </p>
                  <p className="text-xs text-gray-500">
                    最高: {topAccount?.nickname || '-'}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-base font-semibold text-gray-800 mb-4">播放量趋势对比</h3>
            <div style={{ height: 300 }}>
              {mergedTrendData.length > 0 && (
                <TrendChart
                  data={mergedTrendData}
                  metrics={trendDataList.map((_, i) => `play_count_${i}`)}
                  height={260}
                  type="line"
                />
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">详细数据对比</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      指标
                    </th>
                    {compareData.map((account, index) => (
                      <th
                        key={account.account_id}
                        className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          {account.nickname}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { key: 'play_count', label: '总播放量' },
                    { key: 'like_count', label: '总点赞量' },
                    { key: 'comment_count', label: '总评论量' },
                    { key: 'share_count', label: '总分享量' },
                    { key: 'follower_increase', label: '净增粉丝' },
                    { key: 'post_count', label: '发布作品数' },
                    { key: 'avg_play_count', label: '平均播放量' },
                    { key: 'interaction_rate', label: '互动率', format: (v: number) => `${(v * 100).toFixed(2)}%` },
                    { key: 'play_rate', label: '播放率', format: (v: number) => `${(v * 100).toFixed(2)}%` },
                    { key: 'followers_count', label: '当前粉丝数' },
                  ].map((metric) => {
                    const values = compareData.map((d) => Number(d[metric.key as keyof CompareData]) || 0);
                    const maxVal = Math.max(...values);

                    return (
                      <tr key={metric.key}>
                        <td className="px-5 py-3 text-sm font-medium text-gray-700">{metric.label}</td>
                        {compareData.map((account, index) => {
                          const value = Number(account[metric.key as keyof CompareData]) || 0;
                          const isMax = value === maxVal && maxVal > 0;
                          const displayValue = metric.format
                            ? metric.format(value)
                            : formatNumber(value);

                          return (
                            <td key={account.account_id} className="px-5 py-3 text-center">
                              <span
                                className={`text-sm ${
                                  isMax ? 'font-bold text-blue-600' : 'text-gray-700'
                                }`}
                              >
                                {displayValue}
                                {isMax && ' 🏆'}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {selectedAccounts.length === 0 && !loading && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">请选择至少一个账号进行对比分析</p>
          <button
            onClick={() => setShowSelector(true)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            选择账号
          </button>
        </div>
      )}
    </div>
  );
}
