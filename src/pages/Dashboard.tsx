import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, GripVertical, X, Settings, Trash2, BarChart2, PieChart, TrendingUp, Users, Activity, FileText } from 'lucide-react';
import DateRangePicker from '@/components/DateRangePicker';
import MetricCard, { formatNumber } from '@/components/MetricCard';
import TrendChart from '@/components/charts/TrendChart';
import PieChartComponent from '@/components/charts/PieChartComponent';
import BarChartComponent from '@/components/charts/BarChartComponent';
import { useDateRangeStore } from '@/store';
import { api, analyticsApi } from '@/services/api';

interface Widget {
  id: number;
  widget_type: string;
  title: string;
  config?: any;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
}

const widgetTypes = [
  { type: 'metric_cards', label: '指标卡片', icon: Activity },
  { type: 'trend_chart', label: '趋势图', icon: TrendingUp },
  { type: 'platform_pie', label: '平台分布', icon: PieChart },
  { type: 'content_type_pie', label: '内容类型', icon: BarChart2 },
  { type: 'top_posts', label: '热门作品', icon: FileText },
  { type: 'account_ranking', label: '账号排行', icon: Users },
  { type: 'channel_distribution', label: '渠道分布', icon: PieChart },
];

function SortableWidget({ widget, children, onRemove }: { widget: Widget; children: React.ReactNode; onRemove: (id: number) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          >
            <GripVertical size={16} />
          </button>
          <span className="text-sm font-medium text-gray-700">{widget.title}</span>
        </div>
        <button
          onClick={() => onRemove(widget.id)}
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { startDate, endDate } = useDateRangeStore();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [dashboardId, setDashboardId] = useState<number | null>(null);
  const [overview, setOverview] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [platformData, setPlatformData] = useState<any[]>([]);
  const [contentTypeData, setContentTypeData] = useState<any[]>([]);
  const [topPosts, setTopPosts] = useState<any[]>([]);
  const [channelData, setChannelData] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadDashboard();
    loadData();
  }, [startDate, endDate]);

  const loadDashboard = async () => {
    try {
      const res = await api.getDashboards();
      if (res.data && res.data.length > 0) {
        const defaultDashboard = res.data.find((d: any) => d.is_default) || res.data[0];
        setDashboardId(defaultDashboard.id);

        const widgetsRes = await api.getDashboardWidgets(defaultDashboard.id);
        setWidgets(widgetsRes.data || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  };

  const loadData = async () => {
    try {
      const [overviewRes, trendRes, platformRes, contentTypeRes, topPostsRes, channelRes, accountsRes] = await Promise.all([
        api.getOverview(),
        analyticsApi.getTrend({ start_date: startDate, end_date: endDate, type: 'overall' }),
        analyticsApi.getPlatformDistribution({ start_date: startDate, end_date: endDate }),
        analyticsApi.getContentTypeDistribution({ start_date: startDate, end_date: endDate }),
        api.getTopPosts({ limit: 10, sort_by: 'play_count' }),
        analyticsApi.getChannelDistribution({ start_date: startDate, end_date: endDate }),
        api.getAccounts({ pageSize: 10, sort_by: 'followers' }),
      ]);

      setOverview(overviewRes.data);
      setTrendData(trendRes.data || []);
      setPlatformData((platformRes.data || []).map((p: any) => ({ name: p.platform_display_name, value: p.play_count })));
      setContentTypeData((contentTypeRes.data || []).map((c: any) => ({ name: getContentTypeLabel(c.content_type), value: c.play_count })));
      setTopPosts(topPostsRes.data || []);
      setChannelData((channelRes.data || []).slice(0, 10).map((c: any) => ({ name: c.channel, value: c.play_count })));
      setAccounts(accountsRes.data.list || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const getContentTypeLabel = (type: string) => {
    const map: Record<string, string> = { video: '视频', image: '图文', article: '文章', live: '直播' };
    return map[type] || type;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        const updatedItems = newItems.map((item, index) => ({
          ...item,
          position_y: Math.floor(index / 2),
          position_x: index % 2 === 0 ? 0 : 6,
        }));

        if (dashboardId) {
          api.updateWidgetsBatch(dashboardId, updatedItems.map((w) => ({
            id: w.id,
            position_x: w.position_x,
            position_y: w.position_y,
            width: w.width,
            height: w.height,
          }))).catch(console.error);
        }

        return updatedItems;
      });
    }
  };

  const addWidget = async (widgetType: string) => {
    if (!dashboardId) return;

    const widgetInfo = widgetTypes.find((w) => w.type === widgetType);
    if (!widgetInfo) return;

    try {
      const res = await api.addWidget(dashboardId, {
        widget_type: widgetType,
        title: widgetInfo.label,
        position_y: Math.floor(widgets.length / 2),
        position_x: widgets.length % 2 === 0 ? 0 : 6,
        width: 6,
        height: 4,
      });

      setWidgets([...widgets, res.data]);
      setShowWidgetPicker(false);
    } catch (error) {
      console.error('Failed to add widget:', error);
    }
  };

  const removeWidget = async (widgetId: number) => {
    if (!dashboardId) return;

    try {
      await api.deleteWidget(dashboardId, widgetId);
      setWidgets(widgets.filter((w) => w.id !== widgetId));
    } catch (error) {
      console.error('Failed to remove widget:', error);
    }
  };

  const renderWidgetContent = (widget: Widget) => {
    switch (widget.widget_type) {
      case 'metric_cards':
        return (
          <div className="grid grid-cols-2 gap-3">
            {overview && (
              <>
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <p className="text-lg font-bold text-blue-600">{formatNumber(overview.metrics.total_plays)}</p>
                  <p className="text-xs text-gray-500">总播放</p>
                </div>
                <div className="text-center p-2 bg-red-50 rounded-lg">
                  <p className="text-lg font-bold text-red-600">{formatNumber(overview.metrics.total_likes)}</p>
                  <p className="text-xs text-gray-500">总点赞</p>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded-lg">
                  <p className="text-lg font-bold text-purple-600">{formatNumber(overview.metrics.total_comments)}</p>
                  <p className="text-xs text-gray-500">总评论</p>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <p className="text-lg font-bold text-green-600">{formatNumber(overview.metrics.total_followers)}</p>
                  <p className="text-xs text-gray-500">总粉丝</p>
                </div>
              </>
            )}
          </div>
        );

      case 'trend_chart':
        return (
          <div style={{ height: 200 }}>
            <TrendChart
              data={trendData}
              metrics={['play_count', 'like_count']}
              type="line"
              height={200}
            />
          </div>
        );

      case 'platform_pie':
        return (
          <div style={{ height: 200 }}>
            <PieChartComponent data={platformData} height={200} />
          </div>
        );

      case 'content_type_pie':
        return (
          <div style={{ height: 200 }}>
            <PieChartComponent data={contentTypeData} height={200} />
          </div>
        );

      case 'top_posts':
        return (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {topPosts.slice(0, 5).map((post, index) => (
              <div key={post.id} className="flex items-center gap-2 text-sm">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs text-white ${
                  index === 0 ? 'bg-red-500' : index === 1 ? 'bg-orange-500' : 'bg-gray-400'
                }`}>
                  {index + 1}
                </span>
                <span className="flex-1 truncate">{post.title}</span>
                <span className="text-blue-600 font-medium">{formatNumber(post.play_count)}</span>
              </div>
            ))}
          </div>
        );

      case 'account_ranking':
        return (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {accounts.slice(0, 5).map((account, index) => (
              <div key={account.id} className="flex items-center gap-2 text-sm">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs text-white ${
                  index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-gray-300'
                }`}>
                  {index + 1}
                </span>
                <span className="flex-1 truncate">{account.nickname}</span>
                <span className="text-green-600 font-medium">{formatNumber(account.followers_count)}</span>
              </div>
            ))}
          </div>
        );

      case 'channel_distribution':
        return (
          <div style={{ height: 200 }}>
            <PieChartComponent data={channelData} height={200} />
          </div>
        );

      default:
        return <div className="text-center text-gray-400 py-8">暂无数据</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-800">自定义看板</h2>
          <button
            onClick={() => setShowWidgetPicker(!showWidgetPicker)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <Plus size={14} />
            添加组件
          </button>
        </div>
        <DateRangePicker />
      </div>

      {showWidgetPicker && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="font-medium text-gray-800 mb-3">选择要添加的组件</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {widgetTypes.map((widget) => {
              const Icon = widget.icon;
              return (
                <button
                  key={widget.type}
                  onClick={() => addWidget(widget.type)}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <Icon size={20} />
                  </div>
                  <span className="text-sm text-gray-700">{widget.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {widgets.map((widget) => (
              <SortableWidget key={widget.id} widget={widget} onRemove={removeWidget}>
                {renderWidgetContent(widget)}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {widgets.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Settings size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">暂无组件，点击上方按钮添加</p>
          <button
            onClick={() => setShowWidgetPicker(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            添加组件
          </button>
        </div>
      )}
    </div>
  );
}
