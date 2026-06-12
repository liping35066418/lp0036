const API_BASE = '/api';
const ANALYTICS_BASE = '/api/analytics';

async function request<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

export const api = {
  getOverview: () => request(`${API_BASE}/stats/overview`),

  getAccounts: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return request(`${API_BASE}/accounts${query ? `?${query}` : ''}`);
  },
  getAccount: (id: number) => request(`${API_BASE}/accounts/${id}`),
  createAccount: (data: any) => request(`${API_BASE}/accounts`, { method: 'POST', body: JSON.stringify(data) }),
  updateAccount: (id: number, data: any) => request(`${API_BASE}/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getPosts: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return request(`${API_BASE}/posts${query ? `?${query}` : ''}`);
  },
  getPost: (id: number) => request(`${API_BASE}/posts/${id}`),
  getTopPosts: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return request(`${API_BASE}/posts/top${query ? `?${query}` : ''}`);
  },
  getPostStats: (params: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return request(`${API_BASE}/posts/stats/by-date${query ? `?${query}` : ''}`);
  },
  getContentTypeDistribution: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return request(`${API_BASE}/posts/content-type-distribution${query ? `?${query}` : ''}`);
  },

  getLiveRooms: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return request(`${API_BASE}/live${query ? `?${query}` : ''}`);
  },
  getLiveRoom: (id: number) => request(`${API_BASE}/live/${id}`),

  getPlatforms: () => request(`${API_BASE}/platforms`),
  getPlatformStats: (id: number, params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return request(`${API_BASE}/platforms/${id}/stats${query ? `?${query}` : ''}`);
  },

  getDashboards: () => request(`${API_BASE}/dashboards`),
  getDashboard: (id: number) => request(`${API_BASE}/dashboards/${id}`),
  createDashboard: (data: any) => request(`${API_BASE}/dashboards`, { method: 'POST', body: JSON.stringify(data) }),
  updateDashboard: (id: number, data: any) => request(`${API_BASE}/dashboards/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDashboard: (id: number) => request(`${API_BASE}/dashboards/${id}`, { method: 'DELETE' }),
  getDashboardWidgets: (id: number) => request(`${API_BASE}/dashboards/${id}/widgets`),
  addWidget: (dashboardId: number, data: any) =>
    request(`${API_BASE}/dashboards/${dashboardId}/widgets`, { method: 'POST', body: JSON.stringify(data) }),
  updateWidget: (dashboardId: number, widgetId: number, data: any) =>
    request(`${API_BASE}/dashboards/${dashboardId}/widgets/${widgetId}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateWidgetsBatch: (dashboardId: number, widgets: any[]) =>
    request(`${API_BASE}/dashboards/${dashboardId}/widgets/batch/update`, { method: 'PUT', body: JSON.stringify({ widgets }) }),
  deleteWidget: (dashboardId: number, widgetId: number) =>
    request(`${API_BASE}/dashboards/${dashboardId}/widgets/${widgetId}`, { method: 'DELETE' }),

  getReports: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return request(`${API_BASE}/reports${query ? `?${query}` : ''}`);
  },
  getReport: (id: number) => request(`${API_BASE}/reports/${id}`),
  generateReport: (data: any) =>
    request(`${API_BASE}/reports/generate`, { method: 'POST', body: JSON.stringify(data) }),
  batchGenerateReports: (reports: any[]) =>
    request(`${API_BASE}/reports/batch/generate`, { method: 'POST', body: JSON.stringify({ reports }) }),
  scheduleReport: (data: any) =>
    request(`${API_BASE}/reports/schedule`, { method: 'POST', body: JSON.stringify(data) }),
  downloadReport: (id: number) => `${API_BASE}/reports/${id}/download`,
};

export const analyticsApi = {
  getSummary: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return request(`${ANALYTICS_BASE}/summary${query ? `?${query}` : ''}`);
  },
  getTrend: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return request(`${ANALYTICS_BASE}/trend${query ? `?${query}` : ''}`);
  },
  getYoY: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return request(`${ANALYTICS_BASE}/yoy${query ? `?${query}` : ''}`);
  },
  getMoM: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return request(`${ANALYTICS_BASE}/mom${query ? `?${query}` : ''}`);
  },
  compareAccounts: (accountIds: number[], params?: any) => {
    const query = new URLSearchParams({
      account_ids: accountIds.join(','),
      ...params,
    }).toString();
    return request(`${ANALYTICS_BASE}/compare/accounts${query ? `?${query}` : ''}`);
  },
  getPlatformDistribution: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return request(`${ANALYTICS_BASE}/distribution/platform${query ? `?${query}` : ''}`);
  },
  getContentTypeDistribution: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return request(`${ANALYTICS_BASE}/distribution/content-type${query ? `?${query}` : ''}`);
  },
  getChannelDistribution: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return request(`${ANALYTICS_BASE}/distribution/channel${query ? `?${query}` : ''}`);
  },
};

export default api;
