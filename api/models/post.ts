import { db } from '../db/database.js';

export interface Post {
  id: number;
  account_id: number;
  platform_id: number;
  platform_post_id: string;
  title: string;
  content: string;
  cover_image: string;
  content_type: string;
  publish_time: string;
  duration: number;
  tags: string;
  channel: string;
  play_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  collect_count: number;
  conversion_count: number;
  conversion_amount: number;
  follower_increase: number;
  hot_score: number;
  status: string;
  created_at: string;
  updated_at: string;
  platform_name?: string;
  platform_display_name?: string;
  platform_icon?: string;
  username?: string;
  nickname?: string;
  avatar?: string;
}

export interface PostQueryParams {
  platform_id?: number;
  account_id?: number;
  content_type?: string;
  channel?: string;
  start_date?: string;
  end_date?: string;
  keyword?: string;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  pageSize?: number;
}

export function getPosts(params: PostQueryParams = {}) {
  const {
    platform_id,
    account_id,
    content_type,
    channel,
    start_date,
    end_date,
    keyword,
    sort_by = 'publish_time',
    sort_order = 'DESC',
    page = 1,
    pageSize = 20,
  } = params;

  let whereClause = 'WHERE 1=1';
  const countParams: any[] = [];
  const queryParams: any[] = [];

  if (platform_id) {
    whereClause += ' AND p.platform_id = ?';
    countParams.push(platform_id);
    queryParams.push(platform_id);
  }
  if (account_id) {
    whereClause += ' AND p.account_id = ?';
    countParams.push(account_id);
    queryParams.push(account_id);
  }
  if (content_type) {
    whereClause += ' AND p.content_type = ?';
    countParams.push(content_type);
    queryParams.push(content_type);
  }
  if (channel) {
    whereClause += ' AND p.channel = ?';
    countParams.push(channel);
    queryParams.push(channel);
  }
  if (start_date) {
    whereClause += ' AND p.publish_time >= ?';
    countParams.push(start_date);
    queryParams.push(start_date);
  }
  if (end_date) {
    whereClause += ' AND p.publish_time <= ?';
    countParams.push(end_date + ' 23:59:59');
    queryParams.push(end_date + ' 23:59:59');
  }
  if (keyword) {
    whereClause += ' AND (p.title LIKE ? OR p.content LIKE ?)';
    countParams.push(`%${keyword}%`, `%${keyword}%`);
    queryParams.push(`%${keyword}%`, `%${keyword}%`);
  }

  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM posts p ${whereClause}`);
  const totalResult = countStmt.get(...countParams) as { total: number };

  const offset = (page - 1) * pageSize;
  queryParams.push(pageSize, offset);

  const validSortFields = ['publish_time', 'play_count', 'like_count', 'comment_count', 'share_count', 'hot_score', 'conversion_count'];
  const sortField = validSortFields.includes(sort_by) ? `p.${sort_by}` : 'p.publish_time';
  const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const stmt = db.prepare(`
    SELECT p.*, pl.name as platform_name, pl.display_name as platform_display_name, pl.icon as platform_icon,
           a.username, a.nickname, a.avatar
    FROM posts p
    LEFT JOIN platforms pl ON p.platform_id = pl.id
    LEFT JOIN accounts a ON p.account_id = a.id
    ${whereClause}
    ORDER BY ${sortField} ${order}
    LIMIT ? OFFSET ?
  `);

  const posts = stmt.all(...queryParams) as Post[];

  return {
    list: posts,
    total: totalResult.total,
    page,
    pageSize,
  };
}

export function getPostById(id: number): Post | undefined {
  const stmt = db.prepare(`
    SELECT p.*, pl.name as platform_name, pl.display_name as platform_display_name, pl.icon as platform_icon,
           a.username, a.nickname, a.avatar
    FROM posts p
    LEFT JOIN platforms pl ON p.platform_id = pl.id
    LEFT JOIN accounts a ON p.account_id = a.id
    WHERE p.id = ?
  `);
  return stmt.get(id) as Post | undefined;
}

export function createPost(data: Partial<Post>) {
  const stmt = db.prepare(`
    INSERT INTO posts (
      account_id, platform_id, platform_post_id, title, content, cover_image,
      content_type, publish_time, duration, tags, channel,
      play_count, like_count, comment_count, share_count, collect_count,
      conversion_count, conversion_amount, follower_increase, hot_score, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.account_id,
    data.platform_id,
    data.platform_post_id,
    data.title || '',
    data.content || '',
    data.cover_image || '',
    data.content_type || 'video',
    data.publish_time || new Date().toISOString(),
    data.duration || 0,
    data.tags || '',
    data.channel || '',
    data.play_count || 0,
    data.like_count || 0,
    data.comment_count || 0,
    data.share_count || 0,
    data.collect_count || 0,
    data.conversion_count || 0,
    data.conversion_amount || 0,
    data.follower_increase || 0,
    data.hot_score || 0,
    data.status || 'published'
  );
  return getPostById(result.lastInsertRowid as number);
}

export function updatePost(id: number, data: Partial<Post>) {
  const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at');
  if (fields.length === 0) return getPostById(id);

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => (data as any)[f]);
  values.push(id);

  const stmt = db.prepare(`UPDATE posts SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
  stmt.run(...values);
  return getPostById(id);
}

export function getTopPosts(platformId?: number, limit = 10, sortBy = 'play_count') {
  const params: any[] = [];
  let whereClause = '';

  if (platformId) {
    whereClause = 'WHERE p.platform_id = ?';
    params.push(platformId);
  }

  const validSortFields = ['play_count', 'like_count', 'comment_count', 'share_count', 'hot_score', 'conversion_count'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'play_count';

  params.push(limit);

  const stmt = db.prepare(`
    SELECT p.*, pl.name as platform_name, pl.display_name as platform_display_name, pl.icon as platform_icon,
           a.username, a.nickname, a.avatar
    FROM posts p
    LEFT JOIN platforms pl ON p.platform_id = pl.id
    LEFT JOIN accounts a ON p.account_id = a.id
    ${whereClause}
    ORDER BY p.${sortField} DESC
    LIMIT ?
  `);

  return stmt.all(...params) as Post[];
}

export function getPostStatsByDateRange(accountId: number, startDate: string, endDate: string) {
  const stmt = db.prepare(`
    SELECT
      DATE(publish_time) as date,
      COUNT(*) as post_count,
      SUM(play_count) as total_plays,
      SUM(like_count) as total_likes,
      SUM(comment_count) as total_comments,
      SUM(share_count) as total_shares,
      SUM(conversion_count) as total_conversions,
      SUM(conversion_amount) as total_conversion_amount
    FROM posts
    WHERE account_id = ? AND publish_time >= ? AND publish_time <= ?
    GROUP BY DATE(publish_time)
    ORDER BY date ASC
  `);
  return stmt.all(accountId, startDate, endDate + ' 23:59:59');
}

export function getContentTypeDistribution(accountId?: number, platformId?: number) {
  const params: any[] = [];
  let whereClause = 'WHERE 1=1';

  if (accountId) {
    whereClause += ' AND account_id = ?';
    params.push(accountId);
  }
  if (platformId) {
    whereClause += ' AND platform_id = ?';
    params.push(platformId);
  }

  const stmt = db.prepare(`
    SELECT
      content_type,
      COUNT(*) as count,
      SUM(play_count) as total_plays,
      SUM(like_count) as total_likes
    FROM posts
    ${whereClause}
    GROUP BY content_type
    ORDER BY count DESC
  `);
  return stmt.all(...params);
}
