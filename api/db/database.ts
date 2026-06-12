import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/mediascope.db');

export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS platforms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      icon TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform_id INTEGER NOT NULL,
      platform_account_id TEXT NOT NULL,
      username TEXT NOT NULL,
      nickname TEXT,
      avatar TEXT,
      description TEXT,
      followers_count INTEGER DEFAULT 0,
      following_count INTEGER DEFAULT 0,
      total_likes INTEGER DEFAULT 0,
      total_plays INTEGER DEFAULT 0,
      verified INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      last_sync_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(platform_id, platform_account_id),
      FOREIGN KEY (platform_id) REFERENCES platforms(id)
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      platform_id INTEGER NOT NULL,
      platform_post_id TEXT NOT NULL,
      title TEXT,
      content TEXT,
      cover_image TEXT,
      content_type TEXT NOT NULL,
      publish_time DATETIME,
      duration INTEGER,
      tags TEXT,
      channel TEXT,
      play_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      share_count INTEGER DEFAULT 0,
      collect_count INTEGER DEFAULT 0,
      conversion_count INTEGER DEFAULT 0,
      conversion_amount REAL DEFAULT 0,
      follower_increase INTEGER DEFAULT 0,
      hot_score REAL DEFAULT 0,
      status TEXT DEFAULT 'published',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(platform_id, platform_post_id),
      FOREIGN KEY (account_id) REFERENCES accounts(id),
      FOREIGN KEY (platform_id) REFERENCES platforms(id)
    );

    CREATE TABLE IF NOT EXISTS live_rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      platform_id INTEGER NOT NULL,
      platform_live_id TEXT NOT NULL,
      title TEXT,
      cover_image TEXT,
      start_time DATETIME,
      end_time DATETIME,
      duration INTEGER DEFAULT 0,
      status TEXT DEFAULT 'living',
      max_viewers INTEGER DEFAULT 0,
      total_viewers INTEGER DEFAULT 0,
      new_followers INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      share_count INTEGER DEFAULT 0,
      gift_count INTEGER DEFAULT 0,
      gift_amount REAL DEFAULT 0,
      product_count INTEGER DEFAULT 0,
      sales_amount REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(platform_id, platform_live_id),
      FOREIGN KEY (account_id) REFERENCES accounts(id),
      FOREIGN KEY (platform_id) REFERENCES platforms(id)
    );

    CREATE TABLE IF NOT EXISTS post_metrics_daily (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      account_id INTEGER NOT NULL,
      platform_id INTEGER NOT NULL,
      stat_date DATE NOT NULL,
      play_count INTEGER DEFAULT 0,
      play_increment INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      like_increment INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      comment_increment INTEGER DEFAULT 0,
      share_count INTEGER DEFAULT 0,
      share_increment INTEGER DEFAULT 0,
      collect_count INTEGER DEFAULT 0,
      collect_increment INTEGER DEFAULT 0,
      conversion_count INTEGER DEFAULT 0,
      conversion_increment INTEGER DEFAULT 0,
      conversion_amount REAL DEFAULT 0,
      conversion_amount_increment REAL DEFAULT 0,
      follower_increase INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(post_id, stat_date),
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (account_id) REFERENCES accounts(id),
      FOREIGN KEY (platform_id) REFERENCES platforms(id)
    );

    CREATE TABLE IF NOT EXISTS account_metrics_daily (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      platform_id INTEGER NOT NULL,
      stat_date DATE NOT NULL,
      followers_count INTEGER DEFAULT 0,
      follower_increase INTEGER DEFAULT 0,
      follower_decrease INTEGER DEFAULT 0,
      total_posts INTEGER DEFAULT 0,
      total_plays INTEGER DEFAULT 0,
      play_increment INTEGER DEFAULT 0,
      total_likes INTEGER DEFAULT 0,
      like_increment INTEGER DEFAULT 0,
      total_comments INTEGER DEFAULT 0,
      comment_increment INTEGER DEFAULT 0,
      total_shares INTEGER DEFAULT 0,
      share_increment INTEGER DEFAULT 0,
      total_conversions INTEGER DEFAULT 0,
      conversion_increment INTEGER DEFAULT 0,
      total_conversion_amount REAL DEFAULT 0,
      conversion_amount_increment REAL DEFAULT 0,
      avg_play_rate REAL DEFAULT 0,
      avg_interaction_rate REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(account_id, stat_date),
      FOREIGN KEY (account_id) REFERENCES accounts(id),
      FOREIGN KEY (platform_id) REFERENCES platforms(id)
    );

    CREATE TABLE IF NOT EXISTS platform_metrics_daily (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform_id INTEGER NOT NULL,
      stat_date DATE NOT NULL,
      total_accounts INTEGER DEFAULT 0,
      total_posts INTEGER DEFAULT 0,
      total_plays INTEGER DEFAULT 0,
      play_increment INTEGER DEFAULT 0,
      total_likes INTEGER DEFAULT 0,
      like_increment INTEGER DEFAULT 0,
      total_comments INTEGER DEFAULT 0,
      comment_increment INTEGER DEFAULT 0,
      total_shares INTEGER DEFAULT 0,
      share_increment INTEGER DEFAULT 0,
      total_followers INTEGER DEFAULT 0,
      follower_increase INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(platform_id, stat_date),
      FOREIGN KEY (platform_id) REFERENCES platforms(id)
    );

    CREATE TABLE IF NOT EXISTS dashboards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      layout_config TEXT,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS dashboard_widgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dashboard_id INTEGER NOT NULL,
      widget_type TEXT NOT NULL,
      title TEXT NOT NULL,
      config TEXT,
      position_x INTEGER DEFAULT 0,
      position_y INTEGER DEFAULT 0,
      width INTEGER DEFAULT 6,
      height INTEGER DEFAULT 4,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dashboard_id) REFERENCES dashboards(id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      report_type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      params TEXT,
      file_path TEXT,
      scheduled_at DATETIME,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sync_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_type TEXT NOT NULL,
      platform_id INTEGER,
      account_id INTEGER,
      status TEXT DEFAULT 'pending',
      started_at DATETIME,
      completed_at DATETIME,
      records_processed INTEGER DEFAULT 0,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (platform_id) REFERENCES platforms(id),
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    );

    CREATE INDEX IF NOT EXISTS idx_posts_account_id ON posts(account_id);
    CREATE INDEX IF NOT EXISTS idx_posts_platform_id ON posts(platform_id);
    CREATE INDEX IF NOT EXISTS idx_posts_publish_time ON posts(publish_time);
    CREATE INDEX IF NOT EXISTS idx_posts_content_type ON posts(content_type);
    CREATE INDEX IF NOT EXISTS idx_post_metrics_daily_post_id ON post_metrics_daily(post_id);
    CREATE INDEX IF NOT EXISTS idx_post_metrics_daily_stat_date ON post_metrics_daily(stat_date);
    CREATE INDEX IF NOT EXISTS idx_account_metrics_daily_account_id ON account_metrics_daily(account_id);
    CREATE INDEX IF NOT EXISTS idx_account_metrics_daily_stat_date ON account_metrics_daily(stat_date);
    CREATE INDEX IF NOT EXISTS idx_platform_metrics_daily_platform_id ON platform_metrics_daily(platform_id);
    CREATE INDEX IF NOT EXISTS idx_platform_metrics_daily_stat_date ON platform_metrics_daily(stat_date);
    CREATE INDEX IF NOT EXISTS idx_live_rooms_account_id ON live_rooms(account_id);
    CREATE INDEX IF NOT EXISTS idx_live_rooms_start_time ON live_rooms(start_time);
  `);

  const platformCount = db.prepare('SELECT COUNT(*) as count FROM platforms').get() as { count: number };
  if (platformCount.count === 0) {
    const insertPlatform = db.prepare(`
      INSERT INTO platforms (name, display_name, icon, status)
      VALUES (?, ?, ?, 'active')
    `);
    const platforms = [
      ['douyin', '抖音', '🎵'],
      ['kuaishou', '快手', '🎬'],
      ['xiaohongshu', '小红书', '📕'],
      ['weixin', '微信视频号', '💚'],
      ['bilibili', '哔哩哔哩', '📺'],
      ['weibo', '微博', '🔴'],
    ];
    const insertMany = db.transaction((plats: string[][]) => {
      for (const plat of plats) {
        insertPlatform.run(plat[0], plat[1], plat[2]);
      }
    });
    insertMany(platforms);
  }
}

export default db;
