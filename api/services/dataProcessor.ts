import { db } from '../db/database.js';
import dayjs from 'dayjs';

export interface CleanResult {
  total_records: number;
  cleaned_records: number;
  invalid_records: number;
  issues: string[];
}

export interface FillResult {
  total_missing: number;
  filled_records: number;
  method: string;
}

export function cleanPostsData(): CleanResult {
  const issues: string[] = [];
  let cleanedCount = 0;
  let invalidCount = 0;

  const totalStmt = db.prepare('SELECT COUNT(*) as count FROM posts');
  const totalResult = totalStmt.get() as { count: number };

  const nullTitles = db.prepare(`
    SELECT COUNT(*) as count FROM posts
    WHERE title IS NULL OR title = ''
  `).get() as { count: number };

  if (nullTitles.count > 0) {
    issues.push(`${nullTitles.count} 条作品标题为空`);
    const updateStmt = db.prepare(`
      UPDATE posts SET title = '未命名作品'
      WHERE title IS NULL OR title = ''
    `);
    const result = updateStmt.run();
    cleanedCount += result.changes;
  }

  const negativePlays = db.prepare(`
    SELECT COUNT(*) as count FROM posts
    WHERE play_count < 0
  `).get() as { count: number };

  if (negativePlays.count > 0) {
    issues.push(`${negativePlays.count} 条作品播放量为负数`);
    const updateStmt = db.prepare('UPDATE posts SET play_count = 0 WHERE play_count < 0');
    const result = updateStmt.run();
    cleanedCount += result.changes;
  }

  const negativeLikes = db.prepare(`
    SELECT COUNT(*) as count FROM posts
    WHERE like_count < 0
  `).get() as { count: number };

  if (negativeLikes.count > 0) {
    issues.push(`${negativeLikes.count} 条作品点赞量为负数`);
    const updateStmt = db.prepare('UPDATE posts SET like_count = 0 WHERE like_count < 0');
    const result = updateStmt.run();
    cleanedCount += result.changes;
  }

  const invalidContentType = db.prepare(`
    SELECT COUNT(*) as count FROM posts
    WHERE content_type NOT IN ('video', 'image', 'article', 'live')
  `).get() as { count: number };

  if (invalidContentType.count > 0) {
    issues.push(`${invalidContentType.count} 条作品内容类型无效`);
    const updateStmt = db.prepare(`
      UPDATE posts SET content_type = 'video'
      WHERE content_type NOT IN ('video', 'image', 'article', 'live')
    `);
    const result = updateStmt.run();
    cleanedCount += result.changes;
  }

  const nullPublishTime = db.prepare(`
    SELECT COUNT(*) as count FROM posts
    WHERE publish_time IS NULL OR publish_time = ''
  `).get() as { count: number };

  if (nullPublishTime.count > 0) {
    issues.push(`${nullPublishTime.count} 条作品发布时间为空，已设为创建时间`);
    const updateStmt = db.prepare(`
      UPDATE posts SET publish_time = created_at
      WHERE publish_time IS NULL OR publish_time = ''
    `);
    const result = updateStmt.run();
    cleanedCount += result.changes;
  }

  return {
    total_records: totalResult.count,
    cleaned_records: cleanedCount,
    invalid_records: invalidCount,
    issues,
  };
}

export function cleanAccountData(): CleanResult {
  const issues: string[] = [];
  let cleanedCount = 0;

  const totalStmt = db.prepare('SELECT COUNT(*) as count FROM accounts');
  const totalResult = totalStmt.get() as { count: number };

  const nullUsernames = db.prepare(`
    SELECT COUNT(*) as count FROM accounts
    WHERE username IS NULL OR username = ''
  `).get() as { count: number };

  if (nullUsernames.count > 0) {
    issues.push(`${nullUsernames.count} 个账号用户名为空`);
  }

  const negativeFollowers = db.prepare(`
    SELECT COUNT(*) as count FROM accounts
    WHERE followers_count < 0
  `).get() as { count: number };

  if (negativeFollowers.count > 0) {
    issues.push(`${negativeFollowers.count} 个账号粉丝数为负数`);
    const updateStmt = db.prepare('UPDATE accounts SET followers_count = 0 WHERE followers_count < 0');
    const result = updateStmt.run();
    cleanedCount += result.changes;
  }

  const duplicateAccounts = db.prepare(`
    SELECT platform_id, platform_account_id, COUNT(*) as cnt
    FROM accounts
    GROUP BY platform_id, platform_account_id
    HAVING cnt > 1
  `).all() as any[];

  if (duplicateAccounts.length > 0) {
    issues.push(`${duplicateAccounts.length} 组重复账号`);
  }

  return {
    total_records: totalResult.count,
    cleaned_records: cleanedCount,
    invalid_records: 0,
    issues,
  };
}

export function fillMissingDailyMetrics(
  startDate: string,
  endDate: string,
  method: 'linear' | 'average' | 'zero' = 'linear'
): FillResult {
  const postIds = db.prepare(`
    SELECT DISTINCT post_id FROM post_metrics_daily
    WHERE stat_date >= ? AND stat_date <= ?
  `).all(startDate, endDate).map((row: any) => row.post_id);

  let filledCount = 0;
  let totalMissing = 0;

  const dates: string[] = [];
  let currentDate = dayjs(startDate);
  const end = dayjs(endDate);
  while (currentDate.isBefore(end) || currentDate.isSame(end, 'day')) {
    dates.push(currentDate.format('YYYY-MM-DD'));
    currentDate = currentDate.add(1, 'day');
  }

  for (const postId of postIds) {
    const postInfo = db.prepare(`
      SELECT account_id, platform_id, play_count, like_count, comment_count, share_count
      FROM posts WHERE id = ?
    `).get(postId) as any;

    if (!postInfo) continue;

    const existingMetrics = db.prepare(`
      SELECT stat_date, play_count, like_count, comment_count, share_count,
             play_increment, like_increment, comment_increment, share_increment
      FROM post_metrics_daily
      WHERE post_id = ? AND stat_date >= ? AND stat_date <= ?
      ORDER BY stat_date ASC
    `).all(postId, startDate, endDate) as any[];

    const metricMap = new Map<string, any>();
    existingMetrics.forEach(m => metricMap.set(m.stat_date, m));

    const missingDates: string[] = [];
    for (const date of dates) {
      if (!metricMap.has(date)) {
        missingDates.push(date);
        totalMissing++;
      }
    }

    if (missingDates.length === 0) continue;

    for (const missingDate of missingDates) {
      let playCount = 0;
      let likeCount = 0;
      let commentCount = 0;
      let shareCount = 0;
      let playIncrement = 0;
      let likeIncrement = 0;
      let commentIncrement = 0;
      let shareIncrement = 0;

      if (method === 'zero') {
        const prevDate = dayjs(missingDate).subtract(1, 'day').format('YYYY-MM-DD');
        const prevMetric = metricMap.get(prevDate);
        if (prevMetric) {
          playCount = prevMetric.play_count;
          likeCount = prevMetric.like_count;
          commentCount = prevMetric.comment_count;
          shareCount = prevMetric.share_count;
        }
      } else if (method === 'average') {
        if (existingMetrics.length > 0) {
          const avgPlayInc = existingMetrics.reduce((sum, m) => sum + m.play_increment, 0) / existingMetrics.length;
          const avgLikeInc = existingMetrics.reduce((sum, m) => sum + m.like_increment, 0) / existingMetrics.length;
          const avgCommentInc = existingMetrics.reduce((sum, m) => sum + m.comment_increment, 0) / existingMetrics.length;
          const avgShareInc = existingMetrics.reduce((sum, m) => sum + m.share_increment, 0) / existingMetrics.length;

          playIncrement = Math.floor(avgPlayInc);
          likeIncrement = Math.floor(avgLikeInc);
          commentIncrement = Math.floor(avgCommentInc);
          shareIncrement = Math.floor(avgShareInc);

          const prevDate = dayjs(missingDate).subtract(1, 'day').format('YYYY-MM-DD');
          const prevMetric = metricMap.get(prevDate);
          if (prevMetric) {
            playCount = prevMetric.play_count + playIncrement;
            likeCount = prevMetric.like_count + likeIncrement;
            commentCount = prevMetric.comment_count + commentIncrement;
            shareCount = prevMetric.share_count + shareIncrement;
          } else {
            playCount = playIncrement;
            likeCount = likeIncrement;
            commentCount = commentIncrement;
            shareCount = shareIncrement;
          }
        }
      } else if (method === 'linear') {
        let prevDate: string | null = null;
        let nextDate: string | null = null;

        for (let i = dates.indexOf(missingDate) - 1; i >= 0; i--) {
          if (metricMap.has(dates[i])) {
            prevDate = dates[i];
            break;
          }
        }

        for (let i = dates.indexOf(missingDate) + 1; i < dates.length; i++) {
          if (metricMap.has(dates[i])) {
            nextDate = dates[i];
            break;
          }
        }

        if (prevDate && nextDate) {
          const prevMetric = metricMap.get(prevDate);
          const nextMetric = metricMap.get(nextDate);
          const daysDiff = dayjs(nextDate).diff(dayjs(prevDate), 'day');
          const dayOffset = dayjs(missingDate).diff(dayjs(prevDate), 'day');

          const playDelta = (nextMetric.play_count - prevMetric.play_count) / daysDiff;
          const likeDelta = (nextMetric.like_count - prevMetric.like_count) / daysDiff;
          const commentDelta = (nextMetric.comment_count - prevMetric.comment_count) / daysDiff;
          const shareDelta = (nextMetric.share_count - prevMetric.share_count) / daysDiff;

          playCount = Math.floor(prevMetric.play_count + playDelta * dayOffset);
          likeCount = Math.floor(prevMetric.like_count + likeDelta * dayOffset);
          commentCount = Math.floor(prevMetric.comment_count + commentDelta * dayOffset);
          shareCount = Math.floor(prevMetric.share_count + shareDelta * dayOffset);

          playIncrement = playCount - prevMetric.play_count;
          likeIncrement = likeCount - prevMetric.like_count;
          commentIncrement = commentCount - prevMetric.comment_count;
          shareIncrement = shareCount - prevMetric.share_count;
        } else if (prevDate) {
          const prevMetric = metricMap.get(prevDate);
          playCount = prevMetric.play_count;
          likeCount = prevMetric.like_count;
          commentCount = prevMetric.comment_count;
          shareCount = prevMetric.share_count;
        } else if (nextDate) {
          const nextMetric = metricMap.get(nextDate);
          playCount = nextMetric.play_count;
          likeCount = nextMetric.like_count;
          commentCount = nextMetric.comment_count;
          shareCount = nextMetric.share_count;
        }
      }

      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO post_metrics_daily (
          post_id, account_id, platform_id, stat_date,
          play_count, play_increment,
          like_count, like_increment,
          comment_count, comment_increment,
          share_count, share_increment,
          collect_count, collect_increment,
          conversion_count, conversion_increment,
          conversion_amount, conversion_amount_increment,
          follower_increase
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertStmt.run(
        postId,
        postInfo.account_id,
        postInfo.platform_id,
        missingDate,
        playCount,
        playIncrement,
        likeCount,
        likeIncrement,
        commentCount,
        commentIncrement,
        shareCount,
        shareIncrement,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      );

      filledCount++;
    }
  }

  return {
    total_missing: totalMissing,
    filled_records: filledCount,
    method,
  };
}

export function deduplicateRecords(): CleanResult {
  let removedCount = 0;

  const postTotalStmt = db.prepare('SELECT COUNT(*) as count FROM posts');
  const postTotal = postTotalStmt.get() as { count: number };

  const duplicatePosts = db.prepare(`
    SELECT platform_id, platform_post_id, MIN(id) as min_id, COUNT(*) as cnt
    FROM posts
    GROUP BY platform_id, platform_post_id
    HAVING cnt > 1
  `).all() as any[];

  if (duplicatePosts.length > 0) {
    for (const dup of duplicatePosts) {
      const deleteStmt = db.prepare(`
        DELETE FROM posts
        WHERE platform_id = ? AND platform_post_id = ? AND id != ?
      `);
      const result = deleteStmt.run(dup.platform_id, dup.platform_post_id, dup.min_id);
      removedCount += result.changes;
    }
  }

  return {
    total_records: postTotal.count,
    cleaned_records: removedCount,
    invalid_records: 0,
    issues: duplicatePosts.length > 0 ? [`${duplicatePosts.length} 组重复作品数据已去重`] : [],
  };
}

export function normalizePlatformData(platformId: number): CleanResult {
  let normalizedCount = 0;

  const postTotalStmt = db.prepare('SELECT COUNT(*) as count FROM posts WHERE platform_id = ?');
  const totalResult = postTotalStmt.get(platformId) as { count: number };

  const issues: string[] = [];

  const invalidTags = db.prepare(`
    SELECT COUNT(*) as count FROM posts
    WHERE platform_id = ? AND (tags IS NULL OR tags = '')
  `).get(platformId) as { count: number };

  if (invalidTags.count > 0) {
    issues.push(`${invalidTags.count} 条作品缺少标签`);
  }

  return {
    total_records: totalResult.count,
    cleaned_records: normalizedCount,
    invalid_records: 0,
    issues,
  };
}

export function optimizeForLargeData() {
  const optimizations: string[] = [];

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_post_metrics_composite
    ON post_metrics_daily(account_id, stat_date, play_increment);

    CREATE INDEX IF NOT EXISTS idx_posts_publish_hot
    ON posts(publish_time DESC, hot_score DESC);

    CREATE INDEX IF NOT EXISTS idx_account_metrics_composite
    ON account_metrics_daily(account_id, stat_date);
  `);

  optimizations.push('已创建复合索引优化查询');

  db.pragma('cache_size = -20000');
  db.pragma('temp_store = MEMORY');
  db.pragma('mmap_size = 268435456');

  optimizations.push('已启用内存优化配置');

  return {
    success: true,
    optimizations,
  };
}

export default {
  cleanPostsData,
  cleanAccountData,
  fillMissingDailyMetrics,
  deduplicateRecords,
  normalizePlatformData,
  optimizeForLargeData,
};
