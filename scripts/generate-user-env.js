/**
 * 生成用户指定的RSS源环境变量
 */

const sources = [
  {"name":"未央网","url":"http://www.weiyangx.com/rss.xml","enabled":true},
  {"name":"零壹财经","url":"https://www.01caijing.com/rss/","enabled":true},
  {"name":"消金界","url":"https://plink.anyfeeder.com/weixin/jjbd21","enabled":true}
];

const targets = [
  {"id":"oc_e528f0e50d53dc87e8f77ee400e657b7","name":"机器人test","type":"group","enabled":true}
];

// 生成紧凑的JSON字符串
const rssJson = JSON.stringify(sources);
const targetJson = JSON.stringify(targets);

console.log('=== 您的Railway环境变量配置 ===\n');
console.log('RSS_SOURCES=' + rssJson);
console.log('\nTARGET_CHATS=' + targetJson);
console.log('\n=== 复制上面的值到 Railway ===\n');
console.log('注意：这只是一行，请确保复制时没有换行');
