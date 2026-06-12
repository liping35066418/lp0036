import { Router, type Request, type Response } from 'express';
import { db } from '../db/database.js';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cron from 'node-cron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const reportsDir = path.join(__dirname, '../../data/reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

router.get('/', (req: Request, res: Response) => {
  const { status, type, page } = req.query;
  const pageSize = req.query.page_size || req.query.pageSize;

  try {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    if (type) {
      whereClause += ' AND report_type = ?';
      params.push(type);
    }

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM reports ${whereClause}`);
    const totalResult = countStmt.get(...params) as { total: number };

    const pageNum = page ? Number(page) : 1;
    const size = pageSize ? Number(pageSize) : 20;
    const offset = (pageNum - 1) * size;
    params.push(size, offset);

    const stmt = db.prepare(`
      SELECT * FROM reports
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    const reports = stmt.all(...params);

    res.json({
      success: true,
      data: {
        list: reports,
        total: totalResult.total,
        page: pageNum,
        pageSize: size,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const stmt = db.prepare('SELECT * FROM reports WHERE id = ?');
    const report = stmt.get(Number(id));

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
      });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/generate', async (req: Request, res: Response) => {
  const { name, report_type, params } = req.body;

  try {
    const insertStmt = db.prepare(`
      INSERT INTO reports (name, report_type, status, params)
      VALUES (?, ?, 'pending', ?)
    `);
    const result = insertStmt.run(
      name || `报表_${Date.now()}`,
      report_type || 'summary',
      params ? JSON.stringify(params) : null
    );

    const reportId = result.lastInsertRowid as number;

    setImmediate(() => {
      generateReport(reportId, report_type || 'summary', params || {});
    });

    res.status(201).json({
      success: true,
      message: 'Report generation started',
      data: {
        id: reportId,
        status: 'pending',
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/:id/download', (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const stmt = db.prepare('SELECT * FROM reports WHERE id = ?');
    const report: any = stmt.get(Number(id));

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
      });
    }

    if (report.status !== 'completed' || !report.file_path) {
      return res.status(400).json({
        success: false,
        error: 'Report is not ready yet',
      });
    }

    const filePath = path.resolve(report.file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Report file not found',
      });
    }

    res.download(filePath, report.name + '.xlsx', (err) => {
      if (err) {
        console.error('Download error:', err);
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/batch/generate', async (req: Request, res: Response) => {
  const { reports } = req.body;

  if (!Array.isArray(reports) || reports.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Please provide reports array',
    });
  }

  try {
    const reportIds: number[] = [];

    const insertMany = db.transaction(() => {
      for (const report of reports) {
        const stmt = db.prepare(`
          INSERT INTO reports (name, report_type, status, params)
          VALUES (?, ?, 'pending', ?)
        `);
        const result = stmt.run(
          report.name || `报表_${Date.now()}`,
          report.report_type || 'summary',
          report.params ? JSON.stringify(report.params) : null
        );
        reportIds.push(result.lastInsertRowid as number);
      }
    });

    insertMany();

    reportIds.forEach((id, index) => {
      setImmediate(() => {
        generateReport(id, reports[index].report_type || 'summary', reports[index].params || {});
      });
    });

    res.status(201).json({
      success: true,
      message: 'Batch report generation started',
      data: {
        report_ids: reportIds,
        count: reportIds.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/schedule', (req: Request, res: Response) => {
  const { name, report_type, params, schedule, cron_expression } = req.body;

  try {
    const scheduledAt = schedule ? new Date(schedule).toISOString() : null;

    const stmt = db.prepare(`
      INSERT INTO reports (name, report_type, status, params, scheduled_at)
      VALUES (?, ?, 'scheduled', ?, ?)
    `);
    const result = stmt.run(
      name || `定时报表_${Date.now()}`,
      report_type || 'summary',
      params ? JSON.stringify(params) : null,
      scheduledAt
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        status: 'scheduled',
        scheduled_at: scheduledAt,
        cron_expression: cron_expression || null,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

async function generateReport(reportId: number, reportType: string, params: any) {
  try {
    const updateStmt = db.prepare("UPDATE reports SET status = 'processing', started_at = CURRENT_TIMESTAMP WHERE id = ?");
    updateStmt.run(reportId);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MediaScope Analytics';
    workbook.created = new Date();

    if (reportType === 'summary') {
      await generateSummaryReport(workbook, params);
    } else if (reportType === 'account') {
      await generateAccountReport(workbook, params);
    } else if (reportType === 'posts') {
      await generatePostsReport(workbook, params);
    } else if (reportType === 'platform') {
      await generatePlatformReport(workbook, params);
    } else {
      await generateSummaryReport(workbook, params);
    }

    const fileName = `report_${reportId}_${Date.now()}.xlsx`;
    const filePath = path.join(reportsDir, fileName);

    await workbook.xlsx.writeFile(filePath);

    const completeStmt = db.prepare(`
      UPDATE reports
      SET status = 'completed', file_path = ?, completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    completeStmt.run(filePath, reportId);

    console.log(`Report ${reportId} generated successfully: ${filePath}`);
  } catch (error: any) {
    console.error(`Report generation failed for ${reportId}:`, error);
    const errorStmt = db.prepare("UPDATE reports SET status = 'failed', error_message = ? WHERE id = ?");
    errorStmt.run(error.message, reportId);
  }
}

async function generateSummaryReport(workbook: ExcelJS.Workbook, params: any) {
  const worksheet = workbook.addWorksheet('数据概览');

  worksheet.columns = [
    { header: '指标', key: 'metric', width: 20 },
    { header: '数值', key: 'value', width: 20 },
    { header: '单位', key: 'unit', width: 10 },
  ];

  const data = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM accounts) as total_accounts,
      (SELECT COUNT(*) FROM posts) as total_posts,
      (SELECT SUM(play_count) FROM posts) as total_plays,
      (SELECT SUM(like_count) FROM posts) as total_likes,
      (SELECT SUM(comment_count) FROM posts) as total_comments,
      (SELECT SUM(share_count) FROM posts) as total_shares,
      (SELECT SUM(followers_count) FROM accounts) as total_followers
  `).get() as any;

  worksheet.addRow({ metric: '账号总数', value: data.total_accounts, unit: '个' });
  worksheet.addRow({ metric: '作品总数', value: data.total_posts, unit: '个' });
  worksheet.addRow({ metric: '总播放量', value: data.total_plays, unit: '次' });
  worksheet.addRow({ metric: '总点赞量', value: data.total_likes, unit: '次' });
  worksheet.addRow({ metric: '总评论量', value: data.total_comments, unit: '条' });
  worksheet.addRow({ metric: '总分享量', value: data.total_shares, unit: '次' });
  worksheet.addRow({ metric: '总粉丝数', value: data.total_followers, unit: '人' });

  const platformSheet = workbook.addWorksheet('平台分布');
  platformSheet.columns = [
    { header: '平台', key: 'platform', width: 15 },
    { header: '账号数', key: 'accounts', width: 12 },
    { header: '作品数', key: 'posts', width: 12 },
    { header: '总播放', key: 'plays', width: 15 },
    { header: '总点赞', key: 'likes', width: 15 },
  ];

  const platforms = db.prepare(`
    SELECT
      p.display_name as platform,
      (SELECT COUNT(*) FROM accounts a WHERE a.platform_id = p.id) as accounts,
      (SELECT COUNT(*) FROM posts po WHERE po.platform_id = p.id) as posts,
      (SELECT COALESCE(SUM(play_count), 0) FROM posts po WHERE po.platform_id = p.id) as plays,
      (SELECT COALESCE(SUM(like_count), 0) FROM posts po WHERE po.platform_id = p.id) as likes
    FROM platforms p
    ORDER BY plays DESC
  `).all();

  platforms.forEach((p: any) => platformSheet.addRow(p));
}

async function generateAccountReport(workbook: ExcelJS.Workbook, params: any) {
  const worksheet = workbook.addWorksheet('账号数据');

  worksheet.columns = [
    { header: '平台', key: 'platform_display_name', width: 12 },
    { header: '用户名', key: 'username', width: 20 },
    { header: '昵称', key: 'nickname', width: 20 },
    { header: '粉丝数', key: 'followers_count', width: 15 },
    { header: '总播放', key: 'total_plays', width: 15 },
    { header: '总点赞', key: 'total_likes', width: 15 },
  ];

  const accounts = db.prepare(`
    SELECT a.*, p.display_name as platform_display_name
    FROM accounts a
    LEFT JOIN platforms p ON a.platform_id = p.id
    ORDER BY a.followers_count DESC
    LIMIT 100
  `).all();

  accounts.forEach((a: any) => worksheet.addRow(a));
}

async function generatePostsReport(workbook: ExcelJS.Workbook, params: any) {
  const worksheet = workbook.addWorksheet('作品数据');

  worksheet.columns = [
    { header: '标题', key: 'title', width: 30 },
    { header: '内容类型', key: 'content_type', width: 10 },
    { header: '平台', key: 'platform_display_name', width: 12 },
    { header: '发布时间', key: 'publish_time', width: 20 },
    { header: '播放量', key: 'play_count', width: 12 },
    { header: '点赞量', key: 'like_count', width: 12 },
    { header: '评论量', key: 'comment_count', width: 12 },
    { header: '分享量', key: 'share_count', width: 12 },
  ];

  const posts = db.prepare(`
    SELECT p.*, pl.display_name as platform_display_name
    FROM posts p
    LEFT JOIN platforms pl ON p.platform_id = pl.id
    ORDER BY p.play_count DESC
    LIMIT 500
  `).all();

  posts.forEach((p: any) => worksheet.addRow(p));
}

async function generatePlatformReport(workbook: ExcelJS.Workbook, params: any) {
  const worksheet = workbook.addWorksheet('平台对比');

  worksheet.columns = [
    { header: '平台', key: 'platform_display_name', width: 15 },
    { header: '账号数', key: 'account_count', width: 10 },
    { header: '作品数', key: 'post_count', width: 10 },
    { header: '总粉丝', key: 'total_followers', width: 15 },
    { header: '总播放', key: 'total_plays', width: 15 },
    { header: '总点赞', key: 'total_likes', width: 15 },
    { header: '平均播放', key: 'avg_plays', width: 15 },
  ];

  const platforms = db.prepare(`
    SELECT
      p.display_name as platform_display_name,
      COUNT(DISTINCT a.id) as account_count,
      COUNT(DISTINCT po.id) as post_count,
      COALESCE(SUM(a.followers_count), 0) as total_followers,
      COALESCE(SUM(po.play_count), 0) as total_plays,
      COALESCE(SUM(po.like_count), 0) as total_likes,
      CASE WHEN COUNT(DISTINCT po.id) > 0
        THEN COALESCE(SUM(po.play_count), 0) / COUNT(DISTINCT po.id)
        ELSE 0
      END as avg_plays
    FROM platforms p
    LEFT JOIN accounts a ON a.platform_id = p.id
    LEFT JOIN posts po ON po.platform_id = p.id
    GROUP BY p.id
    ORDER BY total_plays DESC
  `).all();

  platforms.forEach((p: any) => worksheet.addRow(p));
}

export function initScheduledReports() {
  cron.schedule('0 0 * * *', () => {
    console.log('Running daily scheduled reports...');

    const stmt = db.prepare(`
      INSERT INTO reports (name, report_type, status, params, scheduled_at)
      VALUES (?, ?, 'pending', ?, CURRENT_TIMESTAMP)
    `);
    const result = stmt.run(
      `日报_${new Date().toISOString().split('T')[0]}`,
      'summary',
      JSON.stringify({ period: 'daily' })
    );

    setImmediate(() => {
      generateReport(result.lastInsertRowid as number, 'summary', { period: 'daily' });
    });
  });

  console.log('Scheduled reports initialized');
}

export default router;
