/**
 * 生成紧凑的环境变量值
 */

const sources = [
  {"name":"36氪","url":"https://36kr.com/feed","enabled":true},
  {"name":"虎嗅","url":"https://www.huxiu.com/rss/0.xml","enabled":true},
  {"name":"未央网","url":"http://www.weiyangx.com/rss.xml","enabled":true},
  {"name":"零壹财经","url":"https://www.01caijing.com/rss/","enabled":true},
  {"name":"消金界","url":"https://plink.anyfeeder.com/weixin/jjbd21","enabled":true},
  {"name":"InfoQ","url":"https://www.infoq.cn/feed","enabled":true},
  {"name":"移动支付网","url":"http://www.mpaypass.com.cn/rss/","enabled":true},
  {"name":"中国电子银行网","url":"http://www.cebnet.com.cn/rss/","enabled":true}
];

const targets = [
  {"id":"oc_e528f0e50d53dc87e8f77ee400e657b7","name":"机器人test","type":"group","enabled":true}
];

// 生成紧凑的JSON字符串（无空格）
const rssJson = JSON.stringify(sources);
const targetJson = JSON.stringify(targets);

console.log('=== Railway 环境变量（紧凑格式）===\n');
console.log('RSS_SOURCES=' + rssJson);
console.log('\nTARGET_CHATS=' + targetJson);
console.log('\n=== 复制上面的值到 Railway ===');
