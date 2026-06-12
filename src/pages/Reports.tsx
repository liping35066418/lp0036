import { useState, useEffect } from 'react';
import { FileBarChart, Download, Clock, CheckCircle, XCircle, Plus, Calendar, RefreshCw } from 'lucide-react';
import DateRangePicker from '@/components/DateRangePicker';
import { useDateRangeStore } from '@/store';
import { api } from '@/services/api';

interface Report {
  id: number;
  name: string;
  report_type: string;
  status: string;
  params: string | null;
  file_path: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  created_at: string;
}

const reportTypes = [
  { type: 'summary', label: '数据概览报告', description: '包含全平台核心数据指标汇总' },
  { type: 'account', label: '账号分析报告', description: '单账号或多账号数据对比分析' },
  { type: 'posts', label: '作品分析报告', description: '作品数据明细和趋势分析' },
  { type: 'platform', label: '平台对比报告', description: '各平台数据对比与分布' },
];

export default function ReportsPage() {
  const { startDate, endDate } = useDateRangeStore();
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedType, setSelectedType] = useState('summary');
  const [reportName, setReportName] = useState('');
  const [scheduledMode, setScheduledMode] = useState<'now' | 'scheduled'>('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');

  useEffect(() => {
    loadReports();
  }, [page, pageSize]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await api.getReports({ page, pageSize });
      setReports(res.data.list);
      setTotal(res.data.total);
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
    setLoading(false);
  };

  const handleGenerate = async () => {
    try {
      if (scheduledMode === 'scheduled') {
        await api.scheduleReport({
          name: reportName || `报表_${Date.now()}`,
          report_type: selectedType,
          params: { start_date: startDate, end_date: endDate },
          schedule: `${scheduleDate}T${scheduleTime}:00`,
        });
      } else {
        await api.generateReport({
          name: reportName || `报表_${Date.now()}`,
          report_type: selectedType,
          params: { start_date: startDate, end_date: endDate },
        });
      }

      setShowCreateModal(false);
      setReportName('');
      loadReports();
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  const handleBatchGenerate = async () => {
    try {
      const batchReports = reportTypes.map((type) => ({
        name: `${type.label}_${new Date().toISOString().split('T')[0]}`,
        report_type: type.type,
        params: { start_date: startDate, end_date: endDate },
      }));

      await api.batchGenerateReports(batchReports);
      loadReports();
    } catch (error) {
      console.error('Failed to batch generate reports:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'failed':
        return <XCircle size={16} className="text-red-500" />;
      case 'processing':
        return <RefreshCw size={16} className="text-blue-500 animate-spin" />;
      case 'scheduled':
        return <Clock size={16} className="text-yellow-500" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      pending: '等待中',
      processing: '生成中',
      completed: '已完成',
      failed: '失败',
      scheduled: '已定时',
    };
    return map[status] || status;
  };

  const getReportTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      summary: '数据概览报告',
      account: '账号分析报告',
      posts: '作品分析报告',
      platform: '平台对比报告',
    };
    return map[type] || type;
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus size={18} />
            生成报表
          </button>
          <button
            onClick={handleBatchGenerate}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
          >
            <FileBarChart size={18} />
            批量生成
          </button>
        </div>
        <DateRangePicker />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <FileBarChart size={16} />
            全部报表
          </div>
          <p className="text-2xl font-bold text-gray-800">{total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 text-green-500 text-sm mb-1">
            <CheckCircle size={16} />
            已完成
          </div>
          <p className="text-2xl font-bold text-green-600">
            {reports.filter((r) => r.status === 'completed').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 text-blue-500 text-sm mb-1">
            <RefreshCw size={16} />
            生成中
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {reports.filter((r) => r.status === 'processing').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 text-yellow-500 text-sm mb-1">
            <Calendar size={16} />
            已定时
          </div>
          <p className="text-2xl font-bold text-yellow-600">
            {reports.filter((r) => r.status === 'scheduled').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">报表列表</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">报表名称</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">完成时间</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-500">加载中...</td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-500">暂无报表</td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <FileBarChart size={16} className="text-blue-500" />
                        <span className="text-sm font-medium text-gray-800">{report.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {getReportTypeLabel(report.report_type)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(report.status)}
                        <span className="text-sm text-gray-600">{getStatusText(report.status)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {new Date(report.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {report.completed_at ? new Date(report.completed_at).toLocaleString() : '-'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {report.status === 'completed' && report.file_path ? (
                        <a
                          href={api.downloadReport(report.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Download size={14} />
                          下载
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
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

      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">生成报表</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">报表名称</label>
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="请输入报表名称"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">报表类型</label>
                <div className="grid grid-cols-2 gap-2">
                  {reportTypes.map((type) => (
                    <button
                      key={type.type}
                      onClick={() => setSelectedType(type.type)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedType === type.type
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-800">{type.label}</p>
                      <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">生成方式</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setScheduledMode('now')}
                    className={`flex-1 py-2 rounded-lg border ${
                      scheduledMode === 'now'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    立即生成
                  </button>
                  <button
                    onClick={() => setScheduledMode('scheduled')}
                    className={`flex-1 py-2 rounded-lg border ${
                      scheduledMode === 'scheduled'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    定时生成
                  </button>
                </div>
              </div>

              {scheduledMode === 'scheduled' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">日期</label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">时间</label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleGenerate}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {scheduledMode === 'now' ? '生成' : '设置定时'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
