import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// 确保数据目录存在
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'bot.db');
const db: Database.Database = new Database(dbPath);

// 启用外键约束
db.pragma('foreign_keys = ON');

// 初始化表结构
db.exec(`
  -- 文章表
  CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    author TEXT,
    publish_time INTEGER,
    fetched_at INTEGER DEFAULT (strftime('%s', 'now')),
    content TEXT,
    cover_image TEXT,
    hash TEXT
  );

  -- 发送日志表
  CREATE TABLE IF NOT EXISTS send_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id TEXT REFERENCES articles(id) ON DELETE CASCADE,
    target_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    sent_at INTEGER DEFAULT (strftime('%s', 'now')),
    status TEXT NOT NULL
  );

  -- 配置表
  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  -- 创建索引以提高查询性能
  CREATE INDEX IF NOT EXISTS idx_articles_hash ON articles(hash);
  CREATE INDEX IF NOT EXISTS idx_articles_publish_time ON articles(publish_time DESC);
  CREATE INDEX IF NOT EXISTS idx_send_logs_target ON send_logs(target_id);
  CREATE INDEX IF NOT EXISTS idx_send_logs_article_id ON send_logs(article_id);
`);

console.log(`数据库初始化完成: ${dbPath}`);

export default db;
