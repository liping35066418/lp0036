import { db } from '../db/database.js';
import dayjs from 'dayjs';

export interface MetricSummary {
  play_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  collect_count: number;
  conversion_count: number;
  conversion_amount: number;
  follower_increase: number;
  post_count: number;
  avg_play_count: number;
  avg_like_count: number;
  interaction_rate: number;
  play_rate: number;
}

export interface TrendDataPoint {
  date: string;
  play_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  follower_increase: number;
  conversion_count: number;
  conversion_amount: number;
}

export interface CompareResult {
  current: MetricSummary;
  previous: MetricSummary;
  growth_rates: {
    play_count: number;
    like_count: number;
    comment_count: number;
    share_count: number;
    conversion_count: number;
    conversion_amount: number;
    follower_increase: number;
  };
}

function calcInteractionRate(plays: number, likes: number, comments: number, shares: number): number {
  if (plays === 0) return 0;
  return (likes + comments + shares) / plays;
}

function calcPlayRate(followers: number, plays: number): number {
  if (followers === 0) return 0;
  return plays / followers;
}

export function getAccountMetricsSummary(
  accountId: number,
  startDate: string,
  endDate: string
): MetricSummary {
  const stmt = db.prepare(`
    SELECT
      COALESCE(SUM(play_increment), 0) as play_count,
      COALESCE(SUM(like_increment), 0) as like_count,
      COALESCE(SUM(comment_increment), 0) as comment_count,
      COALESCE(SUM(share_increment), 0) as share_count,
      COALESCE(SUM(collect_increment), 0) as collect_count,
      COALESCE(SUM(conversion_increment), 0) as conversion_count,
      COALESCE(SUM(conversion_amount_increment), 0) as conversion_amount,
      COALESCE(SUM(follower_increase), 0) as follower_increase
    FROM post_metrics_daily
    WHERE account_id = ? AND stat_date >= ? AND stat_date <= ?
  `);

  const result: any = stmt.get(accountId, startDate, endDate);

  const postCountStmt = db.prepare(`
    SELECT COUNT(DISTINCT post_id) as post_count
    FROM post_metrics_daily
    WHERE account_id = ? AND stat_date >= ? AND stat_date <= ?
  `);
  const postCountResult = postCountStmt.get(accountId, startDate, endDate) as { post_count: number };

  const followersStmt = db.prepare('SELECT followers_count FROM accounts WHERE id = ?');
  const followersResult = followersStmt.get(accountId) as { followers_count: number } | undefined;
  const followersCount = followersResult?.followers_count || 0;

  const postCount = postCountResult.post_count || 0;

  return {
    play_count: result.play_count || 0,
    like_count: result.like_count || 0,
    comment_count: result.comment_count || 0,
    share_count: result.share_count || 0,
    collect_count: result.collect_count || 0,
    conversion_count: result.conversion_count || 0,
    conversion_amount: result.conversion_amount || 0,
    follower_increase: result.follower_increase || 0,
    post_count: postCount,
    avg_play_count: postCount > 0 ? (result.play_count || 0) / postCount : 0,
    avg_like_count: postCount > 0 ? (result.like_count || 0) / postCount : 0,
    interaction_rate: calcInteractionRate(
      result.play_count || 0,
      result.like_count || 0,
      result.comment_count || 0,
      result.share_count || 0
    ),
    play_rate: calcPlayRate(followersCount, result.play_count || 0),
  };
}

export function getPlatformMetricsSummary(
  platformId: number,
  startDate: string,
  endDate: string
): MetricSummary {
  const stmt = db.prepare(`
    SELECT
      COALESCE(SUM(play_increment), 0) as play_count,
      COALESCE(SUM(like_increment), 0) as like_count,
      COALESCE(SUM(comment_increment), 0) as comment_count,
      COALESCE(SUM(share_increment), 0) as share_count,
      COALESCE(SUM(collect_increment), 0) as collect_count,
      COALESCE(SUM(conversion_increment), 0) as conversion_count,
      COALESCE(SUM(conversion_amount_increment), 0) as conversion_amount,
      COALESCE(SUM(follower_increase), 0) as follower_increase,
      COUNT(DISTINCT post_id) as post_count
    FROM post_metrics_daily
    WHERE platform_id = ? AND stat_date >= ? AND stat_date <= ?
  `);

  const result: any = stmt.get(platformId, startDate, endDate);

  const followersStmt = db.prepare(`
    SELECT SUM(followers_count) as total_followers
    FROM accounts
    WHERE platform_id = ?
  `);
  const followersResult = followersStmt.get(platformId) as { total_followers: number } | undefined;
  const totalFollowers = followersResult?.total_followers || 0;

  const postCount = result.post_count || 0;

  return {
    play_count: result.play_count || 0,
    like_count: result.like_count || 0,
    comment_count: result.comment_count || 0,
    share_count: result.share_count || 0,
    collect_count: result.collect_count || 0,
    conversion_count: result.conversion_count || 0,
    conversion_amount: result.conversion_amount || 0,
    follower_increase: result.follower_increase || 0,
    post_count: postCount,
    avg_play_count: postCount > 0 ? (result.play_count || 0) / postCount : 0,
    avg_like_count: postCount > 0 ? (result.like_count || 0) / postCount : 0,
    interaction_rate: calcInteractionRate(
      result.play_count || 0,
      result.like_count || 0,
      result.comment_count || 0,
      result.share_count || 0
    ),
    play_rate: calcPlayRate(totalFollowers, result.play_count || 0),
  };
}

export function getOverallMetricsSummary(startDate: string, endDate: string): MetricSummary {
  const stmt = db.prepare(`
    SELECT
      COALESCE(SUM(play_increment), 0) as play_count,
      COALESCE(SUM(like_increment), 0) as like_count,
      COALESCE(SUM(comment_increment), 0) as comment_count,
      COALESCE(SUM(share_increment), 0) as share_count,
      COALESCE(SUM(collect_increment), 0) as collect_count,
      COALESCE(SUM(conversion_increment), 0) as conversion_count,
      COALESCE(SUM(conversion_amount_increment), 0) as conversion_amount,
      COALESCE(SUM(follower_increase), 0) as follower_increase,
      COUNT(DISTINCT post_id) as post_count
    FROM post_metrics_daily
    WHERE stat_date >= ? AND stat_date <= ?
  `);

  const result: any = stmt.get(startDate, endDate);

  const followersStmt = db.prepare('SELECT SUM(followers_count) as total_followers FROM accounts');
  const followersResult = followersStmt.get() as { total_followers: number } | undefined;
  const totalFollowers = followersResult?.total_followers || 0;

  const postCount = result.post_count || 0;

  return {
    play_count: result.play_count || 0,
    like_count: result.like_count || 0,
    comment_count: result.comment_count || 0,
    share_count: result.share_count || 0,
    collect_count: result.collect_count || 0,
    conversion_count: result.conversion_count || 0,
    conversion_amount: result.conversion_amount || 0,
    follower_increase: result.follower_increase || 0,
    post_count: postCount,
    avg_play_count: postCount > 0 ? (result.play_count || 0) / postCount : 0,
    avg_like_count: postCount > 0 ? (result.like_count || 0) / postCount : 0,
    interaction_rate: calcInteractionRate(
      result.play_count || 0,
      result.like_count || 0,
      result.comment_count || 0,
      result.share_count || 0
    ),
    play_rate: calcPlayRate(totalFollowers, result.play_count || 0),
  };
}

export function getAccountTrendData(
  accountId: number,
  startDate: string,
  endDate: string
): TrendDataPoint[] {
  const stmt = db.prepare(`
    SELECT
      stat_date as date,
      COALESCE(SUM(play_increment), 0) as play_count,
      COALESCE(SUM(like_increment), 0) as like_count,
      COALESCE(SUM(comment_increment), 0) as comment_count,
      COALESCE(SUM(share_increment), 0) as share_count,
      COALESCE(SUM(follower_increase), 0) as follower_increase,
      COALESCE(SUM(conversion_increment), 0) as conversion_count,
      COALESCE(SUM(conversion_amount_increment), 0) as conversion_amount
    FROM post_metrics_daily
    WHERE account_id = ? AND stat_date >= ? AND stat_date <= ?
    GROUP BY stat_date
    ORDER BY stat_date ASC
  `);
  return stmt.all(accountId, startDate, endDate) as TrendDataPoint[];
}

export function getPlatformTrendData(
  platformId: number,
  startDate: string,
  endDate: string
): TrendDataPoint[] {
  const stmt = db.prepare(`
    SELECT
      stat_date as date,
      COALESCE(SUM(play_increment), 0) as play_count,
      COALESCE(SUM(like_increment), 0) as like_count,
      COALESCE(SUM(comment_increment), 0) as comment_count,
      COALESCE(SUM(share_increment), 0) as share_count,
      COALESCE(SUM(follower_increase), 0) as follower_increase,
      COALESCE(SUM(conversion_increment), 0) as conversion_count,
      COALESCE(SUM(conversion_amount_increment), 0) as conversion_amount
    FROM post_metrics_daily
    WHERE platform_id = ? AND stat_date >= ? AND stat_date <= ?
    GROUP BY stat_date
    ORDER BY stat_date ASC
  `);
  return stmt.all(platformId, startDate, endDate) as TrendDataPoint[];
}

export function getOverallTrendData(startDate: string, endDate: string): TrendDataPoint[] {
  const stmt = db.prepare(`
    SELECT
      stat_date as date,
      COALESCE(SUM(play_increment), 0) as play_count,
      COALESCE(SUM(like_increment), 0) as like_count,
      COALESCE(SUM(comment_increment), 0) as comment_count,
      COALESCE(SUM(share_increment), 0) as share_count,
      COALESCE(SUM(follower_increase), 0) as follower_increase,
      COALESCE(SUM(conversion_increment), 0) as conversion_count,
      COALESCE(SUM(conversion_amount_increment), 0) as conversion_amount
    FROM post_metrics_daily
    WHERE stat_date >= ? AND stat_date <= ?
    GROUP BY stat_date
    ORDER BY stat_date ASC
  `);
  return stmt.all(startDate, endDate) as TrendDataPoint[];
}

function getPreviousPeriod(startDate: string, endDate: string): { start: string; end: string } {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const diffDays = end.diff(start, 'day') + 1;
  const prevEnd = start.subtract(1, 'day');
  const prevStart = prevEnd.subtract(diffDays - 1, 'day');
  return {
    start: prevStart.format('YYYY-MM-DD'),
    end: prevEnd.format('YYYY-MM-DD'),
  };
}

export function getYoYData(
  type: 'account' | 'platform' | 'overall',
  id: number | null,
  startDate: string,
  endDate: string
): CompareResult {
  const prevPeriod = getPreviousPeriod(startDate, endDate);

  let current: MetricSummary;
  let previous: MetricSummary;

  if (type === 'account' && id) {
    current = getAccountMetricsSummary(id, startDate, endDate);
    previous = getAccountMetricsSummary(id, prevPeriod.start, prevPeriod.end);
  } else if (type === 'platform' && id) {
    current = getPlatformMetricsSummary(id, startDate, endDate);
    previous = getPlatformMetricsSummary(id, prevPeriod.start, prevPeriod.end);
  } else {
    current = getOverallMetricsSummary(startDate, endDate);
    previous = getOverallMetricsSummary(prevPeriod.start, prevPeriod.end);
  }

  const calcGrowth = (curr: number, prev: number): number => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  return {
    current,
    previous,
    growth_rates: {
      play_count: calcGrowth(current.play_count, previous.play_count),
      like_count: calcGrowth(current.like_count, previous.like_count),
      comment_count: calcGrowth(current.comment_count, previous.comment_count),
      share_count: calcGrowth(current.share_count, previous.share_count),
      conversion_count: calcGrowth(current.conversion_count, previous.conversion_count),
      conversion_amount: calcGrowth(current.conversion_amount, previous.conversion_amount),
      follower_increase: calcGrowth(current.follower_increase, previous.follower_increase),
    },
  };
}

export function getMoMData(
  type: 'account' | 'platform' | 'overall',
  id: number | null,
  startDate: string,
  endDate: string
): CompareResult {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const prevStart = start.subtract(1, 'month').format('YYYY-MM-DD');
  const prevEnd = end.subtract(1, 'month').format('YYYY-MM-DD');

  let current: MetricSummary;
  let previous: MetricSummary;

  if (type === 'account' && id) {
    current = getAccountMetricsSummary(id, startDate, endDate);
    previous = getAccountMetricsSummary(id, prevStart, prevEnd);
  } else if (type === 'platform' && id) {
    current = getPlatformMetricsSummary(id, startDate, endDate);
    previous = getPlatformMetricsSummary(id, prevStart, prevEnd);
  } else {
    current = getOverallMetricsSummary(startDate, endDate);
    previous = getOverallMetricsSummary(prevStart, prevEnd);
  }

  const calcGrowth = (curr: number, prev: number): number => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  return {
    current,
    previous,
    growth_rates: {
      play_count: calcGrowth(current.play_count, previous.play_count),
      like_count: calcGrowth(current.like_count, previous.like_count),
      comment_count: calcGrowth(current.comment_count, previous.comment_count),
      share_count: calcGrowth(current.share_count, previous.share_count),
      conversion_count: calcGrowth(current.conversion_count, previous.conversion_count),
      conversion_amount: calcGrowth(current.conversion_amount, previous.conversion_amount),
      follower_increase: calcGrowth(current.follower_increase, previous.follower_increase),
    },
  };
}

export function calculateHotScore(
  playCount: number,
  likeCount: number,
  commentCount: number,
  shareCount: number,
  publishDays: number,
  followersCount: number
): number {
  const playWeight = 0.3;
  const likeWeight = 0.25;
  const commentWeight = 0.25;
  const shareWeight = 0.2;

  const normalizedPlays = followersCount > 0 ? playCount / followersCount : playCount / 1000;
  const normalizedLikes = playCount > 0 ? likeCount / playCount : 0;
  const normalizedComments = playCount > 0 ? commentCount / playCount : 0;
  const normalizedShares = playCount > 0 ? shareCount / playCount : 0;

  const baseScore =
    normalizedPlays * playWeight * 1000 +
    normalizedLikes * likeWeight * 100 +
    normalizedComments * commentWeight * 100 +
    normalizedShares * shareWeight * 100;

  const decayFactor = Math.exp(-0.05 * publishDays);

  return baseScore * decayFactor;
}

export function compareAccounts(accountIds: number[], startDate: string, endDate: string) {
  const results = accountIds.map(id => {
    const metrics = getAccountMetricsSummary(id, startDate, endDate);
    const accountStmt = db.prepare('SELECT * FROM accounts WHERE id = ?');
    const account: any = accountStmt.get(id);
    const platformStmt = db.prepare('SELECT * FROM platforms WHERE id = ?');
    const platform: any = platformStmt.get(account?.platform_id);

    return {
      account_id: id,
      username: account?.username,
      nickname: account?.nickname,
      avatar: account?.avatar,
      platform_name: platform?.name,
      platform_display_name: platform?.display_name,
      platform_icon: platform?.icon,
      followers_count: account?.followers_count || 0,
      ...metrics,
    };
  });

  return results;
}

export function getPlatformDistribution(startDate: string, endDate: string) {
  const stmt = db.prepare(`
    SELECT
      p.id as platform_id,
      p.name as platform_name,
      p.display_name as platform_display_name,
      p.icon as platform_icon,
      COALESCE(SUM(pm.play_increment), 0) as play_count,
      COALESCE(SUM(pm.like_increment), 0) as like_count,
      COALESCE(SUM(pm.comment_increment), 0) as comment_count,
      COALESCE(SUM(pm.share_increment), 0) as share_count,
      COUNT(DISTINCT pm.post_id) as post_count,
      COUNT(DISTINCT a.id) as account_count
    FROM platforms p
    LEFT JOIN accounts a ON a.platform_id = p.id
    LEFT JOIN post_metrics_daily pm ON pm.platform_id = p.id AND pm.stat_date >= ? AND pm.stat_date <= ?
    GROUP BY p.id
    ORDER BY play_count DESC
  `);
  return stmt.all(startDate, endDate);
}

export function getContentTypeDistribution(
  startDate: string,
  endDate: string,
  platformId?: number,
  accountId?: number
) {
  let whereClause = 'WHERE p.id = pm.post_id AND pm.stat_date >= ? AND pm.stat_date <= ?';
  const params: any[] = [startDate, endDate];

  if (platformId) {
    whereClause += ' AND p.platform_id = ?';
    params.push(platformId);
  }
  if (accountId) {
    whereClause += ' AND p.account_id = ?';
    params.push(accountId);
  }

  const stmt = db.prepare(`
    SELECT
      p.content_type,
      COUNT(DISTINCT p.id) as post_count,
      COALESCE(SUM(pm.play_increment), 0) as play_count,
      COALESCE(SUM(pm.like_increment), 0) as like_count,
      COALESCE(SUM(pm.comment_increment), 0) as comment_count,
      COALESCE(SUM(pm.share_increment), 0) as share_count
    FROM posts p, post_metrics_daily pm
    ${whereClause}
    GROUP BY p.content_type
    ORDER BY play_count DESC
  `);
  return stmt.all(...params);
}

export function getChannelDistribution(
  startDate: string,
  endDate: string,
  platformId?: number,
  accountId?: number
) {
  let whereClause = "WHERE p.id = pm.post_id AND pm.stat_date >= ? AND pm.stat_date <= ? AND p.channel != ''";
  const params: any[] = [startDate, endDate];

  if (platformId) {
    whereClause += ' AND p.platform_id = ?';
    params.push(platformId);
  }
  if (accountId) {
    whereClause += ' AND p.account_id = ?';
    params.push(accountId);
  }

  const stmt = db.prepare(`
    SELECT
      p.channel,
      COUNT(DISTINCT p.id) as post_count,
      COALESCE(SUM(pm.play_increment), 0) as play_count,
      COALESCE(SUM(pm.like_increment), 0) as like_count,
      COALESCE(SUM(pm.comment_increment), 0) as comment_count
    FROM posts p, post_metrics_daily pm
    ${whereClause}
    GROUP BY p.channel
    ORDER BY play_count DESC
    LIMIT 20
  `);
  return stmt.all(...params);
}
