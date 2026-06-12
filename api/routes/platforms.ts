import { Router, type Request, type Response } from 'express';
import { db } from '../db/database.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  try {
    const stmt = db.prepare('SELECT * FROM platforms ORDER BY id ASC');
    const platforms = stmt.all();

    res.json({
      success: true,
      data: platforms,
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
    const stmt = db.prepare('SELECT * FROM platforms WHERE id = ?');
    const platform = stmt.get(Number(id));

    if (!platform) {
      return res.status(404).json({
        success: false,
        error: 'Platform not found',
      });
    }

    res.json({
      success: true,
      data: platform,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/:id/stats', (req: Request, res: Response) => {
  const { id } = req.params;
  const { start_date, end_date } = req.query;

  const today = new Date().toISOString().split('T')[0];
  const defaultStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  try {
    const platformId = Number(id);
    const startDate = (start_date as string) || defaultStart;
    const endDate = (end_date as string) || today;

    const accountCountStmt = db.prepare('SELECT COUNT(*) as count FROM accounts WHERE platform_id = ?');
    const accountCount = accountCountStmt.get(platformId) as { count: number };

    const postCountStmt = db.prepare('SELECT COUNT(*) as count FROM posts WHERE platform_id = ?');
    const postCount = postCountStmt.get(platformId) as { count: number };

    const statsStmt = db.prepare(`
      SELECT
        COALESCE(SUM(play_increment), 0) as total_plays,
        COALESCE(SUM(like_increment), 0) as total_likes,
        COALESCE(SUM(comment_increment), 0) as total_comments,
        COALESCE(SUM(share_increment), 0) as total_shares,
        COALESCE(SUM(follower_increase), 0) as follower_increase
      FROM post_metrics_daily
      WHERE platform_id = ? AND stat_date >= ? AND stat_date <= ?
    `);
    const stats = statsStmt.get(platformId, startDate, endDate);

    res.json({
      success: true,
      data: {
        total_accounts: accountCount.count,
        total_posts: postCount.count,
        ...stats,
      },
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

export default router;
