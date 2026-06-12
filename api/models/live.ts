import { db } from '../db/database.js';

export interface LiveRoom {
  id: number;
  account_id: number;
  platform_id: number;
  platform_live_id: string;
  title: string;
  cover_image: string;
  start_time: string;
  end_time: string;
  duration: number;
  status: string;
  max_viewers: number;
  total_viewers: number;
  new_followers: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  gift_count: number;
  gift_amount: number;
  product_count: number;
  sales_amount: number;
  created_at: string;
  updated_at: string;
  platform_name?: string;
  platform_display_name?: string;
  platform_icon?: string;
  username?: string;
  nickname?: string;
  avatar?: string;
}

export function getLiveRooms(params: {
  platform_id?: number;
  account_id?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  pageSize?: number;
  sort_by?: string;
  sort_order?: string;
} = {}) {
  const {
    platform_id,
    account_id,
    status,
    start_date,
    end_date,
    page = 1,
    pageSize = 20,
    sort_by = 'start_time',
    sort_order = 'DESC',
  } = params;

  let whereClause = 'WHERE 1=1';
  const countParams: any[] = [];
  const queryParams: any[] = [];

  if (platform_id) {
    whereClause += ' AND lr.platform_id = ?';
    countParams.push(platform_id);
    queryParams.push(platform_id);
  }
  if (account_id) {
    whereClause += ' AND lr.account_id = ?';
    countParams.push(account_id);
    queryParams.push(account_id);
  }
  if (status) {
    whereClause += ' AND lr.status = ?';
    countParams.push(status);
    queryParams.push(status);
  }
  if (start_date) {
    whereClause += ' AND lr.start_time >= ?';
    countParams.push(start_date);
    queryParams.push(start_date);
  }
  if (end_date) {
    whereClause += ' AND lr.start_time <= ?';
    countParams.push(end_date + ' 23:59:59');
    queryParams.push(end_date + ' 23:59:59');
  }

  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM live_rooms lr ${whereClause}`);
  const totalResult = countStmt.get(...countParams) as { total: number };

  const offset = (page - 1) * pageSize;
  queryParams.push(pageSize, offset);

  const validSortFields = ['start_time', 'max_viewers', 'total_viewers', 'sales_amount', 'gift_amount', 'duration'];
  const sortField = validSortFields.includes(sort_by) ? `lr.${sort_by}` : 'lr.start_time';
  const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const stmt = db.prepare(`
    SELECT lr.*, pl.name as platform_name, pl.display_name as platform_display_name, pl.icon as platform_icon,
           a.username, a.nickname, a.avatar
    FROM live_rooms lr
    LEFT JOIN platforms pl ON lr.platform_id = pl.id
    LEFT JOIN accounts a ON lr.account_id = a.id
    ${whereClause}
    ORDER BY ${sortField} ${order}
    LIMIT ? OFFSET ?
  `);

  const liveRooms = stmt.all(...queryParams) as LiveRoom[];

  return {
    list: liveRooms,
    total: totalResult.total,
    page,
    pageSize,
  };
}

export function getLiveRoomById(id: number): LiveRoom | undefined {
  const stmt = db.prepare(`
    SELECT lr.*, pl.name as platform_name, pl.display_name as platform_display_name, pl.icon as platform_icon,
           a.username, a.nickname, a.avatar
    FROM live_rooms lr
    LEFT JOIN platforms pl ON lr.platform_id = pl.id
    LEFT JOIN accounts a ON lr.account_id = a.id
    WHERE lr.id = ?
  `);
  return stmt.get(id) as LiveRoom | undefined;
}

export function createLiveRoom(data: Partial<LiveRoom>) {
  const stmt = db.prepare(`
    INSERT INTO live_rooms (
      account_id, platform_id, platform_live_id, title, cover_image,
      start_time, end_time, duration, status,
      max_viewers, total_viewers, new_followers,
      like_count, comment_count, share_count,
      gift_count, gift_amount, product_count, sales_amount
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.account_id,
    data.platform_id,
    data.platform_live_id,
    data.title || '',
    data.cover_image || '',
    data.start_time || new Date().toISOString(),
    data.end_time || null,
    data.duration || 0,
    data.status || 'living',
    data.max_viewers || 0,
    data.total_viewers || 0,
    data.new_followers || 0,
    data.like_count || 0,
    data.comment_count || 0,
    data.share_count || 0,
    data.gift_count || 0,
    data.gift_amount || 0,
    data.product_count || 0,
    data.sales_amount || 0
  );
  return getLiveRoomById(result.lastInsertRowid as number);
}

export function updateLiveRoom(id: number, data: Partial<LiveRoom>) {
  const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at');
  if (fields.length === 0) return getLiveRoomById(id);

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => (data as any)[f]);
  values.push(id);

  const stmt = db.prepare(`UPDATE live_rooms SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
  stmt.run(...values);
  return getLiveRoomById(id);
}
