import { useState } from 'react';
import {
  LayoutDashboard, BarChart3, Users, Video, Radio, FileBarChart, Settings, ChevronLeft, ChevronRight, PieChart, TrendingUp,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const menuItems = [
  { path: '/', label: '数据概览', icon: LayoutDashboard },
  { path: '/dashboard', label: '自定义看板', icon: FileBarChart },
  { path: '/posts', label: '作品分析', icon: Video },
  { path: '/accounts', label: '账号对比', icon: Users },
  { path: '/live', label: '直播分析', icon: Radio },
  { path: '/platforms', label: '平台分布', icon: PieChart },
  { path: '/trending', label: '趋势分析', icon: TrendingUp },
  { path: '/reports', label: '报表中心', icon: BarChart3 },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-50">
      <aside
        className={cn(
          'bg-slate-900 text-white flex flex-col transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-lg font-bold">
                M
              </div>
              <span className="font-bold text-lg">MediaScope</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-lg font-bold mx-auto">
              M
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white border-l-4 border-blue-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="h-12 flex items-center justify-center border-t border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800">
              {menuItems.find((item) => item.path === location.pathname)?.label || '数据概览'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
              <Settings size={20} />
            </button>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
