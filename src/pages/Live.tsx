import { useState, useEffect } from 'react';
import { Radio, Users, Heart, MessageCircle, Gift, ShoppingBag, TrendingUp } from 'lucide-react';
import DateRangePicker from '@/components/DateRangePicker';
import MetricCard, { formatNumber } from '@/components/MetricCard';
import BarChartComponent from '@/components/charts/BarChartComponent';
import { useDateRangeStore } from '@/store';
import { api } from '@/services/api';

interface LiveRoom {
  id: number;
  title: string;
  platform_name: string;
  platform_display_name: string;
  platform_icon: string;
  nickname: string;
  avatar: string;
  start_time: string;
  end_time: string;
  duration: number;
  status: string;
  max_viewers: number;
  total_viewers: number;
  new_followers: number;
  like_count: number;
  comment_count: number;
  gift_count: number;
  gift_amount: number;
  product_count: number;
  sales_amount: number;
}

export default function LivePage() {
  const { startDate, endDate } = useDateRangeStore();
  const [liveRooms, setLiveRooms] = useState<LiveRoom[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_lives: 0,
    total_viewers: 0,
    total_sales: 0,
    total_gifts: 0,
    living_count: 0,
  });

  useEffect(() => {
    loadLiveRooms();
  }, [startDate, endDate, page, pageSize]);

  const loadLiveRooms = async () => {
    setLoading(true);
    try {
      const res = await api.getLiveRooms({
        start_date: startDate,
        end_date: endDate,
        page,
        pageSize,
        sort_by: 'start_time',
        sort_order: 'DESC',
      });
      setLiveRooms(res.data.list);
      setTotal(res.data.total);

      const allRes = await api.getLiveRooms({
        start_date: startDate,
        end_date: endDate,
        pageSize: 1000,
      });

      const allLives = allRes.data.list;
      setStats({
        total_lives: allRes.data.total,
        total_viewers: allLives.reduce((sum: number, l: LiveRoom) => sum + l.total_viewers, 0),
        total_sales: allLives.reduce((sum: number, l: LiveRoom) => sum + l.sales_amount, 0),
        total_gifts: allLives.reduce((sum: number, l: LiveRoom) => sum + l.gift_amount, 0),
        living_count: allLives.filter((l: LiveRoom) => l.status === 'living').length,
      });
    } catch (error) {
      console.error('Failed to load live rooms:', error);
    }
    setLoading(false);
  };

  const totalPages = Math.ceil(total / pageSize);

  const topSalesData = liveRooms
    .slice(0, 10)
    .map((room) => ({
      name: room.title.slice(0, 10) + '...',
      销售额: room.sales_amount,
      观看人数: room.total_viewers,
    }));

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <DateRangePicker />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="直播总数"
          value={stats.total_lives}
          unit="场"
          icon={<Radio size={20} />}
          color="red"
        />
        <MetricCard
          title="正在直播"
          value={stats.living_count}
          unit="场"
          icon={<TrendingUp size={20} />}
          color="green"
        />
        <MetricCard
          title="总观看人次"
          value={stats.total_viewers}
          unit="次"
          icon={<Users size={20} />}
          color="blue"
        />
        <MetricCard
          title="总销售额"
          value={stats.total_sales}
          unit="元"
          icon={<ShoppingBag size={20} />}
          color="orange"
        />
        <MetricCard
          title="礼物收入"
          value={stats.total_gifts}
          unit="元"
          icon={<Gift size={20} />}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartComponent
          data={topSalesData}
          dataKey="name"
          categories={[
            { key: '销售额', label: '销售额', color: '#F59E0B' },
            { key: '观看人数', label: '观看人数', color: '#3B82F6' },
          ]}
          title="直播销售额排行"
          layout="vertical"
          height={350}
        />
        <BarChartComponent
          data={topSalesData.slice(0, 5)}
          dataKey="name"
          categories={[{ key: '观看人数', label: '观看人数', color: '#10B981' }]}
          title="直播观看排行"
          layout="vertical"
          height={350}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">直播列表</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">直播间</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">平台</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">峰值人数</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">总观看</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">新增粉丝</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">销售额</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">时长</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-gray-500">加载中...</td>
                </tr>
              ) : liveRooms.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-gray-500">暂无数据</td>
                </tr>
              ) : (
                liveRooms.map((room) => (
                  <tr key={room.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white">
                          <Radio size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 truncate max-w-xs">{room.title}</p>
                          <p className="text-xs text-gray-500">{room.nickname}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      {room.platform_icon} {room.platform_display_name}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                          room.status === 'living'
                            ? 'bg-green-50 text-green-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {room.status === 'living' ? '直播中' : '已结束'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-gray-700">
                      {formatNumber(room.max_viewers)}
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-gray-700">
                      {formatNumber(room.total_viewers)}
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-green-600">
                      +{formatNumber(room.new_followers)}
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-medium text-orange-600">
                      ¥{formatNumber(room.sales_amount)}
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-gray-500">
                      {room.duration} 分钟
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">第 {page} / {totalPages} 页</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
