import { Client } from '@larksuiteoapi/node-sdk';
import { Article } from './crawler';
import db from '../repository/database';

export interface TargetChat {
  id: string;
  name: string;
  type?: 'group' | 'user';
  enabled?: boolean;
}

export class FeishuMessenger {
  private client: Client;

  constructor() {
    const appId = process.env.FEISHU_APP_ID;
    const appSecret = process.env.FEISHU_APP_SECRET;

    if (!appId || !appSecret) {
      throw new Error('缺少飞书应用配置：请设置 FEISHU_APP_ID 和 FEISHU_APP_SECRET 环境变量');
    }

    this.client = new Client({
      appId,
      appSecret,
    });
  }

  /**
   * 发送早报卡片消息
   */
  async sendMorningBrief(chatId: string, articles: Article[], chatType: 'group' | 'user' = 'group'): Promise<void> {
    if (articles.length === 0) {
      console.log(`没有文章需要发送到 ${chatId}`);
      return;
    }

    const card = this.buildMorningCard(articles);

    try {
      // 根据类型选择 receive_id_type
      const receiveIdType = chatType === 'user' ? 'open_id' : 'chat_id';

      await this.client.im.message.create({
        params: { receive_id_type: receiveIdType },
        data: {
          receive_id: chatId,
          msg_type: 'interactive',
          content: JSON.stringify(card),
        },
      });

      console.log(`早报已发送到 ${chatId}，包含 ${articles.length} 篇文章`);

      // 记录发送日志
      this.logSend(articles, chatId, chatType);
    } catch (error) {
      console.error(`发送消息失败 (${chatId}):`, error);
      throw error;
    }
  }

  /**
   * 构建早报卡片
   */
  private buildMorningCard(articles: Article[]): any {
    // 按来源分组文章
    const groupedArticles = this.groupBySource(articles);
    const elements: any[] = [];

    // 标题和日期
    elements.push({
      tag: 'div',
      text: {
        tag: 'lark_md',
        content: `**📅 日期**: ${this.formatDate()}\\n**📊 文章数**: ${articles.length} 篇`,
      },
    });

    // 分隔线
    elements.push({ tag: 'hr' });

    // 按来源分组展示
    for (const [source, sourceArticles] of Object.entries(groupedArticles)) {
      // 来源标题
      elements.push({
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `**📰 ${source}** (${sourceArticles.length}篇)`,
        },
      });

      // 该来源的文章列表
      for (let i = 0; i < sourceArticles.length; i++) {
        const article = sourceArticles[i];
        elements.push(this.buildArticleElement(article, i + 1));

        if (i < sourceArticles.length - 1) {
          elements.push({ tag: 'hr' });
        }
      }

      // 来源之间的分隔
      if (Object.keys(groupedArticles).length > 1) {
        elements.push({ tag: 'hr' });
      }
    }

    return {
      config: { wide_screen_mode: true },
      header: {
        title: { tag: 'plain_text', content: '💰 金融科技早报' },
        template: 'turquoise',
      },
      elements,
    };
  }

  /**
   * 按来源分组文章
   */
  private groupBySource(articles: Article[]): Record<string, Article[]> {
    const grouped: Record<string, Article[]> = {};

    for (const article of articles) {
      const source = article.author || '未知来源';
      if (!grouped[source]) {
        grouped[source] = [];
      }
      grouped[source].push(article);
    }

    return grouped;
  }

  /**
   * 构建单篇文章元素
   */
  private buildArticleElement(article: Article, index: number): any {
    // 生成一句话摘要（30-50字）
    const shortSummary = this.generateShortSummary(article);

    const content = `${index}. **[${this.escapeMarkdown(article.title)}](${article.url})**\\n💡 ${shortSummary}\\n_${this.formatTime(article.publishTime)}_`;

    return {
      tag: 'div',
      text: {
        tag: 'lark_md',
        content,
      },
    };
  }

  /**
   * 生成一句话摘要
   */
  private generateShortSummary(article: Article): string {
    // 尝试从摘要或内容中提取
    const fullText = article.summary || article.content || '';

    // 移除HTML标签
    const plainText = fullText.replace(/<[^>]*>/g, '').replace(/\n/g, ' ').trim();

    // 提取第一句话（以句号、问号、感叹号或换行分隔）
    const firstSentence = plainText.split(/[。？！\n]/)[0];

    // 截取40字
    let summary = firstSentence.length > 40 ? firstSentence.substring(0, 40) : firstSentence;

    // 去除多余空格
    summary = summary.replace(/\s+/g, ' ').trim();

    // 如果为空，返回默认文本
    if (!summary) {
      return '点击查看详情';
    }

    // 确保不超过50字
    return summary.length > 50 ? summary.substring(0, 50) + '...' : summary;
  }

  /**
   * 转义Markdown特殊字符
   */
  private escapeMarkdown(text: string): string {
    return text
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/\*/g, '\\*')
      .replace(/_/g, '\\_');
  }

  /**
   * 格式化日期
   */
  private formatDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[now.getDay()];

    return `${year}-${month}-${day} ${weekday}`;
  }

  /**
   * 格式化时间
   */
  private formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * 记录发送日志
   */
  private logSend(articles: Article[], targetId: string, targetType: string): void {
    const insert = db.prepare(`
      INSERT INTO send_logs (article_id, target_id, target_type, status)
      VALUES (?, ?, ?, ?)
    `);

    const transaction = db.transaction((articles: Article[]) => {
      for (const article of articles) {
        try {
          insert.run(article.id, targetId, targetType, 'success');
        } catch (error) {
          console.error('记录发送日志失败:', error);
        }
      }
    });

    transaction(articles);
  }

  /**
   * 发送纯文本消息（用于测试或通知）
   */
  async sendTextMessage(chatId: string, text: string, chatType: 'group' | 'user' = 'group'): Promise<void> {
    const receiveIdType = chatType === 'user' ? 'open_id' : 'chat_id';

    await this.client.im.message.create({
      params: { receive_id_type: receiveIdType },
      data: {
        receive_id: chatId,
        msg_type: 'text',
        content: JSON.stringify({ text }),
      },
    });
  }

  /**
   * 测试连接（获取应用访问令牌）
   */
  async testConnection(): Promise<boolean> {
    try {
      // 尝试获取tenant access token来测试连接
      const response: any = await this.client.auth.v3.tenantAccessToken.internal({
        data: {
          app_id: process.env.FEISHU_APP_ID!,
          app_secret: process.env.FEISHU_APP_SECRET!,
        },
      });

      console.log('飞书API响应:', JSON.stringify({ code: response.code, data: response.data }));

      // SDK可能已经自动管理token，只要code为0就表示连接成功
      return response.code === 0;
    } catch (error: any) {
      console.error('飞书连接测试失败:', error?.message || error);
      return false;
    }
  }
}
