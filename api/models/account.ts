import { db } from '../db/database.js';

export interface Account {
  id: number;
  platform_id: number;
  platform_account_id: string;
  username: string;
  nickname: string;
  avatar: string;
  description: string;
  followers_count: number;
  following_count: number;
  total_likes: number;
  total_plays: number;
  verified: number;
  status: string;
  last_sync_at: string;
  created_at: string;
  updated_at: string;
  platform_name?: string;
  platform_display_name?: string;
}

export function getAllAccounts(platformId?: number, status?: string, page = 1, pageSize = 20) {
  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (platformId) {
    whereClause += ' AND a.platform_id = ?';
    params.push(platformId);
  }
  if (status) {
    whereClause += ' AND a.status = ?';
    params.push(status);
  }

  const countStmt = db.prepare(`
    SELECT COUNT(*) as total FROM accounts a ${whereClause}
  `);
  const totalResult = countStmt.get(...params) as { total: number };

  const offset = (page - 1) * pageSize;
  params.push(pageSize, offset);

  const stmt = db.prepare(`
    SELECT a.*, p.name as platform_name, p.display_name as platform_display_name, p.icon as platform_icon
    FROM accounts a
    LEFT JOIN platforms p ON a.platform_id = p.id
    ${whereClause}
    ORDER BY a.followers_count DESC
    LIMIT ? OFFSET ?
  `);

  const accounts = stmt.all(...params) as Account[];

  return {
    list: accounts,
    total: totalResult.total,
    page,
    pageSize,
  };
}

export function getAccountById(id: number): Account | undefined {
  const stmt = db.prepare(`
    SELECT a.*, p.name as platform_name, p.display_name as platform_display_name, p.icon as platform_icon
    FROM accounts a
    LEFT JOIN platforms p ON a.platform_id = p.id
    WHERE a.id = ?
  `);
  return stmt.get(id) as Account | undefined;
}

export function createAccount(data: Partial<Account>) {
  const stmt = db.prepare(`
    INSERT INTO accounts (
      platform_id, platform_account_id, username, nickname, avatar,
      description, followers_count, following_count, total_likes, total_plays, verified, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.platform_id,
    data.platform_account_id,
    data.username,
    data.nickname || data.username,
    data.avatar || '',
    data.description || '',
    data.followers_count || 0,
    data.following_count || 0,
    data.total_likes || 0,
    data.total_plays || 0,
    data.verified || 0,
    data.status || 'active'
  );
  return getAccountById(result.lastInsertRowid as number);
}

export function updateAccount(id: number, data: Partial<Account>) {
  const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at');
  if (fields.length === 0) return getAccountById(id);

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => (data as any)[f]);
  values.push(id);

  const stmt = db.prepare(`UPDATE accounts SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
  stmt.run(...values);
  return getAccountById(id);
}

export function deleteAccount(id: number) {
  const stmt = db.prepare('DELETE FROM accounts WHERE id = ?');
  return stmt.run(id);
}

export function getAccountsByPlatform(platformId: number) {
  const stmt = db.prepare('SELECT * FROM accounts WHERE platform_id = ? ORDER BY followers_count DESC');
  return stmt.all(platformId) as Account[];
}
