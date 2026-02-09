/**
 * 配置初始化脚本
 * 用于初始化数据库配置
 */

import db from '../src/repository/database';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

async function initConfig() {
  console.log('========================================');
  console.log('   飞书早报机器人 - 配置初始化');
  console.log('========================================\\n');

  // 1. 配置RSS源
  console.log('请配置微信公众号RSS源');
  console.log('提示：可以使用以下服务获取RSS链接：');
  console.log('  - WeWe RSS: https://wewe.hixfy.com/');
  console.log('  - RSSHub: https://docs.rsshub.app/routes/new-media');
  console.log('');

  const rssSources: Array<{ name: string; url: string; enabled: boolean }> = [];

  while (true) {
    const name = await question('请输入公众号名称 (留空结束): ');
    if (!name.trim()) break;

    const url = await question('请输入RSS链接: ');

    rssSources.push({
      name: name.trim(),
      url: url.trim(),
      enabled: true,
    });

    console.log(`已添加: ${name}\\n`);
  }

  // 2. 配置目标群聊
  console.log('\\n请配置目标群聊/私聊');
  console.log('提示：群聊ID可以在飞书群设置中获取');
  console.log('');

  const targetChats: Array<{ id: string; name: string; type: 'group' | 'user'; enabled: boolean }> = [];

  while (true) {
    const name = await question('请输入群聊/用户名称 (留空结束): ');
    if (!name.trim()) break;

    const id = await question('请输入群聊ID (oc_xxxxxxxxx) 或 用户ID (ou_xxxxxxxxx): ');

    const typeInput = await question('类型 (输入1=群聊, 2=私聊, 默认=群聊): ');
    const type = typeInput === '2' ? 'user' : 'group';

    targetChats.push({
      name: name.trim(),
      id: id.trim(),
      type,
      enabled: true,
    });

    console.log(`已添加目标: ${name} (${type})\\n`);
  }

  // 3. 保存配置到数据库
  console.log('\\n正在保存配置...');

  try {
    // 保存RSS源配置
    const insertRSS = db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)');
    insertRSS.run('rss_sources', JSON.stringify(rssSources));

    // 保存目标群聊配置
    const insertChats = db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)');
    insertChats.run('target_chats', JSON.stringify(targetChats));

    console.log('\\n========================================');
    console.log('配置保存成功！');
    console.log('========================================');
    console.log(`已配置 ${rssSources.length} 个RSS源`);
    console.log(`已配置 ${targetChats.length} 个目标群聊/用户`);
    console.log('');
    console.log('下一步：');
    console.log('1. 确保 .env 文件中已配置飞书应用信息');
    console.log('2. 运行 npm run dev 启动开发服务器');
    console.log('3. 或运行 npm run build && npm start 启动生产服务器');
    console.log('========================================');
  } catch (error) {
    console.error('保存配置失败:', error);
  }

  rl.close();
}

// 运行初始化
initConfig().catch(error => {
  console.error('初始化失败:', error);
  rl.close();
  process.exit(1);
});
