/**
 * 更新后的Railway环境变量配置
 * 移除anyfeeder源（链接为中转页面）
 * 使用直接链接的媒体RSS源
 */

const sources = [
  {"name":"36氪","url":"https://36kr.com/feed","enabled":true},
  {"name":"虎嗅","url":"https://www.huxiu.com/rss/0.xml","enabled":true},
  {"name":"钛媒体","url":"https://www.tmtpost.com/feed","enabled":true},
  {"name":"界面新闻","url":"https://a.jiemian.com/index.php?m=article&a=rss","enabled":true},
  {"name":"InfoQ","url":"https://www.infoq.cn/feed","enabled":true},
  {"name":"移动支付网","url":"http://www.mpaypass.com.cn/rss/","enabled":true}
];

const targets = [
  {"id":"oc_e528f0e50d53dc87e8f77ee400e657b7","name":"机器人test","type":"group","enabled":true}
];

// 生成紧凑的JSON字符串（无空格）
const rssJson = JSON.stringify(sources);
const targetJson = JSON.stringify(targets);

console.log('=== Railway 环境变量（更新版 - 直接链接）===\n');
console.log('RSS_SOURCES=' + rssJson);
console.log('\nTARGET_CHATS=' + targetJson);
console.log('\n=== 说明 ===');
console.log('✅ 已移除 anyfeeder 源（链接为搜狗中转页面）');
console.log('✅ 使用媒体官方RSS（直接链接到原文）');
console.log('\n请复制上面的值到 Railway 环境变量中替换旧的配置');
