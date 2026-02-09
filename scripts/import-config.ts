/**
 * 配置导入脚本
 * 从 config/rss-sources.json 导入配置到数据库
 */

import db from '../src/repository/database';
import fs from 'fs';
import path from 'path';

interface Config {
  rss_sources: Array<{
    name: string;
    url: string;
    enabled?: boolean;
  }>;
  target_chats: Array<{
    id: string;
    name: string;
    type?: 'group' | 'user';
    enabled?: boolean;
  }>;
}

async function importConfig() {
  const configPath = path.join(process.cwd(), 'config', 'rss-sources.json');

  if (!fs.existsSync(configPath)) {
    console.error('配置文件不存在:', configPath);
    console.log('请先编辑 config/rss-sources.json 文件');
    process.exit(1);
  }

  console.log('读取配置文件:', configPath);
  const configContent = fs.readFileSync(configPath, 'utf-8');
  const config: Config = JSON.parse(configContent);

  console.log('\\n========================================');
  console.log('   导入配置到数据库');
  console.log('========================================\\n');

  // 导入RSS源
  console.log(`RSS源 (${config.rss_sources.length} 个):`);
  for (const source of config.rss_sources) {
    console.log(`  - ${source.name}`);
    console.log(`    URL: ${source.url}`);
    console.log(`    状态: ${source.enabled !== false ? '启用' : '禁用'}`);
  }

  // 导入目标群聊
  console.log(`\\n目标群聊 (${config.target_chats.length} 个):`);
  for (const chat of config.target_chats) {
    console.log(`  - ${chat.name}`);
    console.log(`    ID: ${chat.id}`);
    console.log(`    类型: ${chat.type || 'group'}`);
    console.log(`    状态: ${chat.enabled !== false ? '启用' : '禁用'}`);
  }

  // 保存到数据库
  try {
    const insertRSS = db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)');
    insertRSS.run('rss_sources', JSON.stringify(config.rss_sources));

    const insertChats = db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)');
    insertChats.run('target_chats', JSON.stringify(config.target_chats));

    console.log('\\n========================================');
    console.log('✅ 配置导入成功！');
    console.log('========================================');
    console.log('\\n下一步：');
    console.log('  运行 npm run dev 启动开发服务器');
    console.log('  或运行 npm run build && npm start 启动生产服务器');
    console.log('\\n手动触发早报：');
    console.log('  curl -X POST http://localhost:3000/api/trigger');
    console.log('========================================');
  } catch (error) {
    console.error('\\n❌ 配置导入失败:', error);
    process.exit(1);
  }
}

// 运行导入
importConfig().catch(error => {
  console.error('导入失败:', error);
  process.exit(1);
});
