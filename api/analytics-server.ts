import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/database.js';
import { initMockData } from './services/dataGenerator.js';
import {
  getOverallMetricsSummary,
  getPlatformMetricsSummary,
  getAccountMetricsSummary,
  getOverallTrendData,
  getPlatformTrendData,
  getAccountTrendData,
  getYoYData,
  getMoMData,
  compareAccounts,
  getPlatformDistribution,
  getContentTypeDistribution,
  getChannelDistribution,
} from './services/metrics.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/analytics/health', (req, res) => {
  res.json({
    success: true,
    message: 'Analytics service is running',
    port: 8676,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/analytics/summary', (req, res) => {
  const { start_date, end_date, type, id } = req.query;

  const today = new Date();
  const defaultEnd = today.toISOString().split('T')[0];
  const defaultStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const startDate = (start_date as string) || defaultStart;
  const endDate = (end_date as string) || defaultEnd;
  const queryType = (type as string) || 'overall';

  try {
    let summary;
    if (queryType === 'platform' && id) {
      summary = getPlatformMetricsSummary(Number(id), startDate, endDate);
    } else if (queryType === 'account' && id) {
      summary = getAccountMetricsSummary(Number(id), startDate, endDate);
    } else {
      summary = getOverallMetricsSummary(startDate, endDate);
    }

    res.json({
      success: true,
      data: summary,
      start_date: startDate,
      end_date: endDate,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/analytics/trend', (req, res) => {
  const { start_date, end_date, type, id } = req.query;

  const today = new Date();
  const defaultEnd = today.toISOString().split('T')[0];
  const defaultStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const startDate = (start_date as string) || defaultStart;
  const endDate = (end_date as string) || defaultEnd;
  const queryType = (type as string) || 'overall';

  try {
    let trendData;
    if (queryType === 'platform' && id) {
      trendData = getPlatformTrendData(Number(id), startDate, endDate);
    } else if (queryType === 'account' && id) {
      trendData = getAccountTrendData(Number(id), startDate, endDate);
    } else {
      trendData = getOverallTrendData(startDate, endDate);
    }

    res.json({
      success: true,
      data: trendData,
      start_date: startDate,
      end_date: endDate,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/analytics/yoy', (req, res) => {
  const { start_date, end_date, type, id } = req.query;

  const today = new Date();
  const defaultEnd = today.toISOString().split('T')[0];
  const defaultStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const startDate = (start_date as string) || defaultStart;
  const endDate = (end_date as string) || defaultEnd;
  const queryType = (type as 'account' | 'platform' | 'overall') || 'overall';

  try {
    const result = getYoYData(queryType, id ? Number(id) : null, startDate, endDate);

    res.json({
      success: true,
      data: result,
      start_date: startDate,
      end_date: endDate,
      compare_type: 'yoy',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/analytics/mom', (req, res) => {
  const { start_date, end_date, type, id } = req.query;

  const today = new Date();
  const defaultEnd = today.toISOString().split('T')[0];
  const defaultStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const startDate = (start_date as string) || defaultStart;
  const endDate = (end_date as string) || defaultEnd;
  const queryType = (type as 'account' | 'platform' | 'overall') || 'overall';

  try {
    const result = getMoMData(queryType, id ? Number(id) : null, startDate, endDate);

    res.json({
      success: true,
      data: result,
      start_date: startDate,
      end_date: endDate,
      compare_type: 'mom',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/analytics/compare/accounts', (req, res) => {
  const { account_ids, start_date, end_date } = req.query;

  const today = new Date();
  const defaultEnd = today.toISOString().split('T')[0];
  const defaultStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const startDate = (start_date as string) || defaultStart;
  const endDate = (end_date as string) || defaultEnd;

  try {
    let accountIds: number[] = [];
    if (account_ids) {
      accountIds = (account_ids as string).split(',').map(Number).filter(Boolean);
    }

    if (accountIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide account_ids parameter',
      });
    }

    const result = compareAccounts(accountIds, startDate, endDate);

    res.json({
      success: true,
      data: result,
      start_date: startDate,
      end_date: endDate,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/analytics/distribution/platform', (req, res) => {
  const { start_date, end_date } = req.query;

  const today = new Date();
  const defaultEnd = today.toISOString().split('T')[0];
  const defaultStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const startDate = (start_date as string) || defaultStart;
  const endDate = (end_date as string) || defaultEnd;

  try {
    const result = getPlatformDistribution(startDate, endDate);

    res.json({
      success: true,
      data: result,
      start_date: startDate,
      end_date: endDate,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/analytics/distribution/content-type', (req, res) => {
  const { start_date, end_date, platform_id, account_id } = req.query;

  const today = new Date();
  const defaultEnd = today.toISOString().split('T')[0];
  const defaultStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const startDate = (start_date as string) || defaultStart;
  const endDate = (end_date as string) || defaultEnd;

  try {
    const result = getContentTypeDistribution(
      startDate,
      endDate,
      platform_id ? Number(platform_id) : undefined,
      account_id ? Number(account_id) : undefined
    );

    res.json({
      success: true,
      data: result,
      start_date: startDate,
      end_date: endDate,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/analytics/distribution/channel', (req, res) => {
  const { start_date, end_date, platform_id, account_id } = req.query;

  const today = new Date();
  const defaultEnd = today.toISOString().split('T')[0];
  const defaultStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const startDate = (start_date as string) || defaultStart;
  const endDate = (end_date as string) || defaultEnd;

  try {
    const result = getChannelDistribution(
      startDate,
      endDate,
      platform_id ? Number(platform_id) : undefined,
      account_id ? Number(account_id) : undefined
    );

    res.json({
      success: true,
      data: result,
      start_date: startDate,
      end_date: endDate,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post('/api/analytics/aggregate', (req, res) => {
  const { type, platform_id, account_id, start_date, end_date, dimensions } = req.body;

  const today = new Date();
  const defaultEnd = today.toISOString().split('T')[0];
  const defaultStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const startDate = start_date || defaultStart;
  const endDate = end_date || defaultEnd;

  res.json({
    success: true,
    message: 'Aggregation task started',
    task_id: `agg_${Date.now()}`,
    params: {
      type: type || 'overall',
      platform_id,
      account_id,
      start_date: startDate,
      end_date: endDate,
      dimensions: dimensions || ['date'],
    },
  });
});

app.post('/api/analytics/clean', (req, res) => {
  const { type, platform_id } = req.body;

  res.json({
    success: true,
    message: 'Data cleaning task started',
    task_id: `clean_${Date.now()}`,
    cleaned_records: 0,
  });
});

app.post('/api/analytics/fill-missing', (req, res) => {
  const { start_date, end_date, fill_method } = req.body;

  const today = new Date();
  const defaultEnd = today.toISOString().split('T')[0];
  const defaultStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  res.json({
    success: true,
    message: 'Missing data fill task started',
    task_id: `fill_${Date.now()}`,
    params: {
      start_date: start_date || defaultStart,
      end_date: end_date || defaultEnd,
      fill_method: fill_method || 'linear',
    },
    filled_records: 0,
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Analytics API not found',
  });
});

const PORT = 8676;

export function startAnalyticsService() {
  initDatabase();
  initMockData();

  const server = app.listen(PORT, () => {
    console.log(`Analytics service running on port ${PORT}`);
  });

  return server;
}

export default app;

if (process.argv[1]?.includes('analytics-server')) {
  startAnalyticsService();
}
