# QuarkCine

> 影视发现 · 一键转存夸克/115网盘 · 自动生成 STRM 接入媒体库

基于 **TMDB 官方 API** 的影视探索工具，前后端分离：后端 Express + TypeScript，前端 Vue 3 + Vite + Element Plus。

数据源稳定（TMDB 官方直链），转存链路打通夸克 + 115；配合 SmartStrm 可自动生成 STRM 文件，接入 Jellyfin / 飞牛影视等媒体库播放。

![QuarkCine](https://raw.githubusercontent.com/gkyang2022/quarkcine/main/screenshot.png)

## ✨ 功能

| 模块 | 功能 |
|:---|:---|
| **发现** | 首页趋势 / 热映 / Popular；分类页瀑布流（电影 Popular / 剧集 On The Air） |
| **搜索** | 全文搜索全部 / 电影 / 剧集 |
| **详情** | 海报、评分、简介、导演、演员、预告片、相似推荐 |
| **盘搜** | 直连 Pansou（115/夸克），详情页一键搜盘 |
| **转存** | 夸克/115 分享链接一键转存，支持按内容类型（电影/剧集/动漫）分类目录 |
| **追剧** | 剧集订阅 + 定时检查 + Telegram/Discord 通知 |
| **STRM** | 转存成功后自动通知 SmartStrm 生成 STRM，接入媒体库播放 |
| **设置** | 部署者自填 API Key，加密存储，支持测试连接，保存即生效 |

## 🚀 5分钟部署（Docker）

### 第一步：下载项目

在服务器上运行一行命令：

```bash
git clone https://github.com/gkyang2022/quarkcine.git && cd quarkcine
```

### 第二步：设置管理员密码

编辑 `docker-compose.yml`，找到 `ADMIN_PASSWORD=` 这一行，填一个你自己的密码：

```yaml
environment:
  - ADMIN_PASSWORD=改成你的密码
```

> 💡 密码建议 6 位以上，不要留空。也可以在首次启动后登录网页界面再改。

### 第三步：启动

```bash
docker compose up -d
```

### 第四步：访问

打开浏览器访问 `http://<服务器IP>:8081`

用账号 `admin` 和你设置的密码登录。

### 第五步：配置 TMDB（免费）

> 如果只是用转存/追剧功能，不需要这一步。

1. 免费注册 TMDB：<https://www.themoviedb.org/signup>
2. 进入 **Settings → API → Create API key**
3. 复制 API Key，粘贴到 QuarkCine **「设置 → 数据源」** 页面 → 测试连接 → 保存

---

## 📁 接入网盘（可选）

在 **「设置 → 网盘」** 填入夸克 Cookie，即可开启：
- 一键转存
- 追剧提醒
- 自动生成 STRM

详细教程：[Wiki：网盘接入](https://github.com/gkyang2022/quarkcine/wiki)

## 🛠 本地开发

```bash
# 后端（http://localhost:8008）
cd backend && npm install
cp .env.example .env   # 填写必要配置
npm run dev

# 前端（http://localhost:8080，已代理 /api 到后端）
cd frontend && npm install
npm run dev
```

## ⚙️ 环境变量

| 变量 | 必填 | 说明 |
|:---|:---|:---|
| `ADMIN_PASSWORD` | ✅ | 管理员密码，建议 6 位以上 |
| `TMDB_API_KEY` | — | 环境变量方式配置 TMDB Key（也可网页设置页填） |
| `TMDB_LANGUAGE` | — | 默认 `zh-CN` |

## 🔒 安全说明

- TMDB API Key、Cookie 等敏感配置 **AES-256-GCM 加密存储**
- 所有接口需登录认证（JWT）
- v3 Key 自动走 `api_key` 参数；v4 Token（`eyJ` 开头）自动走 Bearer 头

## 📄 License

MIT
