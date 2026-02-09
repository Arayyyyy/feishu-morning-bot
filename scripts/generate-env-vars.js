/**
 * 生成 Railway 环境变量值
 */

const config = require('../config/fintech-rss-sources.json');

console.log('=== Railway 环境变量配置 ===\n');

console.log('RSS_SOURCES:');
console.log(JSON.stringify(config.rss_sources));
console.log('\n');

console.log('TARGET_CHATS:');
console.log(JSON.stringify(config.target_chats));
console.log('\n');

console.log('=== 复制上面的值到 Railway Variables ===');
