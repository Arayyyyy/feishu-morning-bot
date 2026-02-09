import cron from 'node-cron';
import { ContentCrawler, RSSSource } from './crawler';
import { FeishuMessenger, TargetChat } from './feishu';
import db from '../repository/database';

export interface SchedulerConfig {
  schedule: string; // cron表达式
  enabled?: boolean;
}

export class Scheduler {
  private crawler: ContentCrawler;
  private messenger: FeishuMessenger;
  private tasks: Map<string, any> = new Map();

  constructor() {
    this.crawler = new ContentCrawler();
    this.messenger = new FeishuMessenger();
  }

  /**
   * 添加定时任务
   */
  addTask(name: string, schedule: string, handler: () => Promise<void>): void {
    // 验证cron表达式
    if (!cron.validate(schedule)) {
      throw new Error(`无效的cron表达式: ${schedule}`);
    }

    // 如果任务已存在，先停止
    this.stopTask(name);

    const task = cron.schedule(schedule, async () => {
      console.log(`[${new Date().toISOString()}] 执行任务: ${name}`);
      try {
        await handler();
        console.log(`[${new Date().toISOString()}] 任务完成: ${name}`);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] 任务失败: ${name}`, error);
      }
    });

    this.tasks.set(name, task);
    console.log(`任务已添加: ${name} - ${schedule}`);
  }

  /**
   * 停止任务
   */
  stopTask(name: string): void {
    const task = this.tasks.get(name);
    if (task) {
      task.stop();
      this.tasks.delete(name);
      console.log(`任务已停止: ${name}`);
    }
  }

  /**
   * 停止所有任务
   */
  stopAllTasks(): void {
    for (const [name] of this.tasks) {
      this.stopTask(name);
    }
  }

  /**
   * 启动早报任务
   */
  startMorningBrief(config: SchedulerConfig = { schedule: '0 8 * * *' }): void {
    if (config.enabled === false) {
      console.log('早报任务已禁用');
      return;
    }

    this.addTask('morning-brief', config.schedule, async () => {
      await this.executeMorningBrief();
    });
  }

  /**
   * 执行早报发送
   */
  private async executeMorningBrief(): Promise<void> {
    // 1. 获取配置的RSS源
    const sources = this.getRSSSources();
    if (sources.length === 0) {
      console.log('没有配置RSS源');
      return;
    }

    // 2. 抓取所有文章
    console.log(`开始从 ${sources.length} 个RSS源抓取文章...`);
    const allArticles = await this.crawler.fetchFromMultipleSources(sources);

    if (allArticles.length === 0) {
      console.log('没有抓取到任何文章');
      return;
    }

    // 3. 过滤新文章
    console.log(`抓取到 ${allArticles.length} 篇文章，开始过滤...`);
    const newArticles = this.crawler.filterNewArticles(allArticles);

    if (newArticles.length === 0) {
      console.log('没有新文章需要发送');
      return;
    }

    console.log(`发现 ${newArticles.length} 篇新文章`);

    // 4. 保存到数据库
    const saved = this.crawler.saveArticles(newArticles);
    console.log(`已保存 ${saved} 篇文章到数据库`);

    // 5. 发送到目标群聊
    const targets = this.getTargetChats();
    if (targets.length === 0) {
      console.log('没有配置目标群聊');
      return;
    }

    console.log(`开始发送到 ${targets.length} 个目标...`);
    for (const target of targets) {
      if (target.enabled !== false) {
        try {
          await this.messenger.sendMorningBrief(
            target.id,
            newArticles,
            target.type || 'group'
          );
        } catch (error) {
          console.error(`发送失败 (${target.name}):`, error);
        }
      }
    }

    console.log(`早报发送完成: ${newArticles.length} 篇文章, ${targets.length} 个目标`);
  }

  /**
   * 手动触发（立即执行）
   */
  async triggerNow(): Promise<{ count: number; sources: number; targets: number }> {
    console.log('手动触发早报任务...');

    const sources = this.getRSSSources();
    const targets = this.getTargetChats();

    if (sources.length === 0) {
      throw new Error('没有配置RSS源');
    }

    if (targets.length === 0) {
      throw new Error('没有配置目标群聊');
    }

    await this.executeMorningBrief();

    return {
      sources: sources.length,
      targets: targets.length,
      count: 0, // 实际发送的文章数量会在executeMorningBrief中打印
    };
  }

  /**
   * 获取配置的RSS源
   */
  private getRSSSources(): RSSSource[] {
    try {
      // 先尝试从数据库读取
      const config = db.prepare('SELECT value FROM config WHERE key = ?').get('rss_sources');
      if (config) {
        return JSON.parse((config as any).value);
      }

      // 如果数据库没有配置，从环境变量读取
      const envConfig = process.env.RSS_SOURCES;
      if (envConfig) {
        console.log('从环境变量读取RSS源配置，长度:', envConfig.length);
        const parsed = JSON.parse(envConfig);
        console.log('解析到RSS源数量:', parsed.length);
        return parsed;
      }

      console.log('未找到RSS源配置（数据库和环境变量都没有）');
      return [];
    } catch (error) {
      console.error('获取RSS源配置失败:', error);
      return [];
    }
  }

  /**
   * 获取目标群聊
   */
  private getTargetChats(): TargetChat[] {
    try {
      // 先尝试从数据库读取
      const config = db.prepare('SELECT value FROM config WHERE key = ?').get('target_chats');
      if (config) {
        return JSON.parse((config as any).value);
      }

      // 如果数据库没有配置，从环境变量读取
      const envConfig = process.env.TARGET_CHATS;
      if (envConfig) {
        console.log('从环境变量读取目标群聊配置，长度:', envConfig.length);
        const parsed = JSON.parse(envConfig);
        console.log('解析到目标群聊数量:', parsed.length);
        return parsed;
      }

      console.log('未找到目标群聊配置（数据库和环境变量都没有）');
      return [];
    } catch (error) {
      console.error('获取目标群聊配置失败:', error);
      return [];
    }
  }

  /**
   * 获取所有任务状态
   */
  getTasksStatus(): Array<{ name: string; running: boolean }> {
    return Array.from(this.tasks.entries()).map(([name, task]) => ({
      name,
      running: task.getStatus() === 'scheduled',
    }));
  }
}
