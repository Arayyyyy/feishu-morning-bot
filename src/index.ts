import dotenv from 'dotenv';
import express from 'express';
import { Scheduler } from './services/scheduler';
import { FeishuMessenger } from './services/feishu';
import { ContentCrawler } from './services/crawler';

// 加载环境变量
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

// 初始化服务
let scheduler: Scheduler;

async function main() {
  console.log('========================================');
  console.log('   飞书早报机器人');
  console.log('========================================');

  // 检查环境变量
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;

  if (!appId || !appSecret) {
    console.error('错误：请设置 FEISHU_APP_ID 和 FEISHU_APP_SECRET 环境变量');
    process.exit(1);
  }

  console.log(`飞书应用 ID: ${appId}`);

  // 测试飞书连接
  console.log('测试飞书连接...');
  const messenger = new FeishuMessenger();
  const connected = await messenger.testConnection();

  if (!connected) {
    console.warn('警告：飞书连接测试失败，请检查 App ID 和 App Secret');
  } else {
    console.log('飞书连接成功！');
  }

  // 初始化调度器
  scheduler = new Scheduler();

  // 从数据库读取调度配置
  const schedule = process.env.MORNING_BRIEF_SCHEDULE || '0 8 * * *';
  console.log(`配置定时任务: ${schedule} (每天早上8点)`);

  scheduler.startMorningBrief({ schedule });

  // 设置路由
  setupRoutes();

  // 启动服务器
  app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`服务器启动成功！`);
    console.log(`端口: ${PORT}`);
    console.log(`健康检查: http://localhost:${PORT}/health`);
    console.log(`手动触发: http://localhost:${PORT}/api/trigger`);
    console.log(`========================================`);
  });
}

function setupRoutes() {
  // 健康检查
  app.get('/health', (req, res) => {
    const tasks = scheduler.getTasksStatus();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      tasks,
    });
  });

  // 手动触发早报
  app.post('/api/trigger', async (req, res) => {
    try {
      console.log('收到手动触发请求');
      const result = await scheduler.triggerNow();
      res.json({
        success: true,
        message: '早报发送成功',
        ...result,
      });
    } catch (error: any) {
      console.error('手动触发失败:', error);
      res.status(500).json({
        success: false,
        error: error.message || '发送失败',
      });
    }
  });

  // 获取配置的RSS源（测试用）
  app.get('/api/sources', (req, res) => {
    res.json({ success: true, data: [] });
  });

  // 404处理
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      path: req.path,
    });
  });
}

// 优雅退出
process.on('SIGINT', () => {
  console.log('\\n收到退出信号，正在关闭服务器...');
  if (scheduler) {
    scheduler.stopAllTasks();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\\n收到终止信号，正在关闭服务器...');
  if (scheduler) {
    scheduler.stopAllTasks();
  }
  process.exit(0);
});

// 启动应用
main().catch(error => {
  console.error('应用启动失败:', error);
  process.exit(1);
});
