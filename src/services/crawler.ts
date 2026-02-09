import Parser from 'rss-parser';
import crypto from 'crypto';
import db from '../repository/database';

export interface Article {
  id: string;
  title: string;
  url: string;
  author: string;
  publishTime: Date;
  summary: string;
  content?: string;
  coverImage?: string;
  hash?: string;
}

export interface RSSSource {
  name: string;
  url: string;
  enabled?: boolean;
}

export class ContentCrawler {
  private parser: Parser;

  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      customFields: {
        item: [
          ['author', 'author'],
          ['dc:creator', 'creator']
        ]
      }
    });
  }

  /**
   * 从RSS源抓取文章
   */
  async fetchFromRSS(rssUrl: string): Promise<Article[]> {
    try {
      const feed = await this.parser.parseURL(rssUrl);
      const articles: Article[] = [];

      for (const item of feed.items) {
        const article: Article = {
          id: item.guid || item.link || crypto.randomUUID(),
          title: item.title || '无标题',
          url: item.link || '',
          author: (item.author as string) || (item.creator as string) || feed.title || 'Unknown',
          publishTime: item.pubDate ? new Date(item.pubDate) : new Date(),
          summary: item.contentSnippet || item.content?.substring(0, 200) || '',
          content: item.content,
          coverImage: (item as any).enclosure?.url || (item as any).image || '',
        };

        // 计算内容哈希用于去重
        article.hash = this.calculateHash(article.title, article.summary);
        articles.push(article);
      }

      console.log(`从 ${feed.title || rssUrl} 抓取到 ${articles.length} 篇文章`);
      return articles;
    } catch (error) {
      console.error(`抓取RSS失败 (${rssUrl}):`, error);
      return [];
    }
  }

  /**
   * 从多个RSS源抓取文章
   */
  async fetchFromMultipleSources(sources: RSSSource[]): Promise<Article[]> {
    const allArticles: Article[] = [];

    for (const source of sources) {
      if (source.enabled !== false) {
        const articles = await this.fetchFromRSS(source.url);
        allArticles.push(...articles);
      }
    }

    return allArticles;
  }

  /**
   * 计算内容哈希用于去重
   */
  private calculateHash(title: string, summary: string): string {
    const content = `${title}${summary.substring(0, 100)}`;
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * 过滤新文章（去除已存在于数据库的文章）
   */
  filterNewArticles(articles: Article[]): Article[] {
    const stmt = db.prepare('SELECT id FROM articles WHERE hash = ?');

    return articles.filter(article => {
      if (!article.hash) return false;

      try {
        const exists = stmt.get(article.hash);
        if (!exists) {
          return true;
        }
        return false;
      } catch (error) {
        console.error('检查文章是否存在时出错:', error);
        return false;
      }
    });
  }

  /**
   * 保存文章到数据库
   */
  saveArticles(articles: Article[]): number {
    if (articles.length === 0) return 0;

    const insert = db.prepare(`
      INSERT OR IGNORE INTO articles (id, url, title, author, publish_time, content, hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((articles: Article[]) => {
      let saved = 0;
      for (const article of articles) {
        if (article.hash) {
          const result = insert.run(
            article.id,
            article.url,
            article.title,
            article.author,
            article.publishTime.getTime(),
            article.content || '',
            article.hash
          );
          if (result.changes > 0) saved++;
        }
      }
      return saved;
    });

    return transaction(articles);
  }

  /**
   * 检查文章是否已发送到指定目标
   */
  isArticleSent(articleId: string, targetId: string): boolean {
    const stmt = db.prepare(
      'SELECT id FROM send_logs WHERE article_id = ? AND target_id = ? AND status = ?'
    );
    const result = stmt.get(articleId, targetId, 'success');
    return !!result;
  }

  /**
   * 获取最近的文章
   */
  getRecentArticles(limit: number = 50): Article[] {
    const stmt = db.prepare(`
      SELECT * FROM articles
      ORDER BY publish_time DESC
      LIMIT ?
    `);

    const rows = stmt.all(limit) as any[];
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      url: row.url,
      author: row.author,
      publishTime: new Date(row.publish_time),
      summary: row.content?.substring(0, 200) || '',
      content: row.content,
      coverImage: row.cover_image,
    }));
  }
}
