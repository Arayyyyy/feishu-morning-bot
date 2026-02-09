# 飞书早报机器人

一个自动抓取微信公众号文章并定时发送到飞书群聊的机器人。

## 功能特性

- **自动抓取**：从RSS源自动获取微信公众号文章
- **定时发送**：支持cron表达式配置定时任务
- **手动触发**：提供API接口支持手动发送
- **去重过滤**：自动过滤已发送的文章
- **多目标支持**：支持群聊和私聊
- **数据持久化**：使用SQLite存储文章记录和配置

## 技术栈

- **后端框架**：Node.js + TypeScript + Express
- **数据库**：SQLite (better-sqlite3)
- **调度器**：node-cron
- **飞书SDK**：@larksuiteoapi/node-sdk
- **RSS解析**：rss-parser

## 快速开始

### 本地开发

#### 1. 安装依赖

```bash
npm install
```

### 2. 配置飞书应用

1. 访问 [飞书开放平台](https://open.feishu.cn/)
2. 创建自建应用
3. 获取 App ID 和 App Secret
4. 开启机器人能力
5. 配置权限：`im:message`、`im:message:send_as_bot`

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入飞书应用信息：

```env
FEISHU_APP_ID=your_app_id_here
FEISHU_APP_SECRET=your_app_secret_here
PORT=3000
MORNING_BRIEF_SCHEDULE=0 8 * * *
```

### 4. 初始化配置

运行配置初始化脚本：

```bash
npm run init-config
```

按提示输入：
- **微信公众号RSS源**：使用以下服务获取RSS链接
  - [WeWe RSS](https://wewe.hixfy.com/) - 推荐
  - [RSSHub](https://docs.rsshub.app/routes/new-media)
- **目标群聊ID**：在飞书群设置中获取群聊ID

### 5. 启动服务

开发模式（自动重启）：
```bash
npm run dev
```

生产模式：
```bash
npm run build
npm start
```

## 使用指南

### 查看健康状态

```bash
curl http://localhost:3000/health
```

### 手动触发早报

```bash
curl -X POST http://localhost:3000/api/trigger
```

### 配置定时任务

编辑 `.env` 文件中的 `MORNING_BRIEF_SCHEDULE`：

```env
# 每天早上8点
MORNING_BRIEF_SCHEDULE=0 8 * * *

# 每天早上9点和下午6点
MORNING_BRIEF_SCHEDULE=0 9,18 * * *

# 每2小时
MORNING_BRIEF_SCHEDULE=0 */2 * * *
```

Cron表达式格式：`分 时 日 月 周`

---

## 🚀 Railway 部署（推荐）

Railway 是一个免费的 PaaS 平台，非常适合部署小型 Node.js 应用。

### 特点

- ✅ 免费额度：$5/月（足够个人使用）
- ✅ 自动从 GitHub 部署
- ✅ 自动 HTTPS
- ✅ 无需服务器维护

### 部署步骤

#### 方法一：通过 Railway 网站（推荐新手）

1. **准备 GitHub 仓库**

   ```bash
   # 初始化 git 仓库
   git init
   git add .
   git commit -m "Initial commit"

   # 推送到 GitHub
   git remote add origin https://github.com/YOUR_USERNAME/feishu-morning-bot.git
   git branch -M main
   git push -u origin main
   ```

2. **在 Railway 创建项目**

   - 访问 https://railway.app/
   - 点击 "New Project" → "Deploy from GitHub repo"
   - 选择您的仓库
   - Railway 会自动检测 Node.js 项目

3. **配置环境变量**

   在 Railway 项目设置中添加以下环境变量：

   ```env
   FEISHU_APP_ID=cli_a832b8e55563101c
   FEISHU_APP_SECRET=Vfyy6v9lu78j8O0GnrjpLdTXzLDgdlUl
   PORT=3000
   MORNING_BRIEF_SCHEDULE=0 8 * * *
   ```

4. **等待部署完成**

   Railway 会自动部署，完成后会提供一个公网地址，如：
   ```
   https://your-app-name.up.railway.app
   ```

5. **测试服务**

   ```bash
   # 健康检查
   curl https://your-app-name.up.railway.app/health

   # 手动触发早报
   curl -X POST https://your-app-name.up.railway.app/api/trigger
   ```

#### 方法二：使用 Railway CLI（推荐进阶用户）

1. **安装 Railway CLI**

   ```bash
   npm install -g railway
   ```

2. **登录**

   ```bash
   railway login
   ```

3. **初始化项目**

   ```bash
   cd feishu-morning-bot
   railway init
   ```

4. **添加环境变量**

   ```bash
   railway variables set FEISHU_APP_ID=cli_a832b8e55563101c
   railway variables set FEISHU_APP_SECRET=Vfyy6v9lu78j8O0GnrjpLdTXzLDgdlUl
   railway variables set PORT=3000
   railway variables set MORNING_BRIEF_SCHEDULE="0 8 * * *"
   ```

5. **部署**

   ```bash
   railway up
   ```

6. **查看日志**

   ```bash
   railway logs
   ```

7. **获取公网地址**

   ```bash
   railway domain
   ```

### ⚠️ 重要提示

**数据库持久化问题**：

Railway 的文件系统是临时的，重启后数据会丢失。如果需要持久化：

1. **使用 Railway PostgreSQL**（推荐）
   - 在 Railway 项目中添加 PostgreSQL 插件
   - 修改项目使用 PostgreSQL 而非 SQLite
   - 配置环境变量：`DATABASE_URL`

2. **接受数据丢失**（简单方案）
   - 每次重启会重新抓取最新文章
   - 不影响基本功能

### 监控和日志

- 访问 Railway 项目页面查看实时日志
- 设置告警通知（邮件/Discord/Slack）
- 查看资源使用情况

### 费用说明

- 免费额度：$5/月
- 超出后按量计费
- 一般个人使用不会超出免费额度

---

## 项目结构

```
feishu-morning-bot/
├── src/
│   ├── services/
│   │   ├── crawler.ts       # 内容抓取服务
│   │   ├── feishu.ts        # 飞书消息服务
│   │   └── scheduler.ts     # 定时调度服务
│   ├── repository/
│   │   └── database.ts      # 数据库初始化
│   └── index.ts             # 主入口
├── scripts/
│   └── init-config.ts       # 配置初始化脚本
├── data/                    # 数据库文件目录
├── .env                     # 环境变量
├── .env.example             # 环境变量示例
├── package.json
├── tsconfig.json
└── README.md
```

## 数据库结构

### articles 表
存储文章记录

| 字段 | 类型 | 说明 |
|-----|------|-----|
| id | TEXT | 文章ID |
| url | TEXT | 文章链接 |
| title | TEXT | 文章标题 |
| author | TEXT | 作者/来源 |
| publish_time | INTEGER | 发布时间戳 |
| content | TEXT | 文章内容 |
| hash | TEXT | 内容哈希（去重用） |

### send_logs 表
存储发送日志

| 字段 | 类型 | 说明 |
|-----|------|-----|
| article_id | TEXT | 文章ID |
| target_id | TEXT | 目标ID |
| target_type | TEXT | 目标类型（group/user） |
| sent_at | INTEGER | 发送时间戳 |
| status | TEXT | 发送状态 |

### config 表
存储配置信息

| 字段 | 类型 | 说明 |
|-----|------|-----|
| key | TEXT | 配置键 |
| value | TEXT | 配置值（JSON） |

## 常见问题

### 1. 如何获取飞书群聊ID？

1. 打开飞书群设置
2. 查找群信息
3. 复制群ID（格式：`oc_xxxxxxxxx`）

### 2. 如何获取微信公众号RSS？

推荐使用以下服务：

- **WeWe RSS**：https://wewe.hixfy.com/
  - 搜索公众号名称
  - 复制RSS链接

- **RSSHub**：https://docs.rsshub.app/routes/new-media
  - 使用官方实例或自建
  - RSS格式：`https://rsshub.app/wechat/mp/account/{公众号ID}`

### 3. 飞书消息发送失败？

检查：
1. 飞书应用权限是否正确配置
2. 群聊ID是否正确
3. 机器人是否已添加到群聊中

### 4. 如何修改发送时间？

编辑 `.env` 文件中的 `MORNING_BRIEF_SCHEDULE`，然后重启服务。

## 开发

### 构建

```bash
npm run build
```

### 运行测试

```bash
npm test
```

## 许可证

ISC

## 贡献

欢迎提交 Issue 和 Pull Request！
