# QuarkCine

> 影视发现 · 一键转存夸克/115网盘 · SmartStrm STRM 生成

基于 **TMDB 官方 API** 的影视探索工具，前后端分离：后端 Express + TypeScript，前端 Vue 3 + Vite + Element Plus。

数据源稳定（TMDB 官方直链），无需 Cookie / 反爬hack；转存链路打通夸克 + 115；配合 SmartStrm 可自动生成 STRM 文件，接入 Jellyfin / 飞牛影视等媒体库播放。

![QuarkCine](https://raw.githubusercontent.com/gkyang2022/tmdb-movie/main/screenshot.png)

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

## 🚀 快速部署（Docker）

### 1. 准备三个密钥

```bash
openssl rand -hex 32   # → AUTH_SECRET
openssl rand -hex 32   # → ENCRYPTION_KEY
# 设置一个强密码 → ADMIN_PASSWORD
```

### 2. 修改 docker-compose.yml

```yaml
environment:
  - ADMIN_PASSWORD=你的强密码          # 必填
  - AUTH_SECRET=上面生成的第一个hex值    # 必填
  - ENCRYPTION_KEY=上面生成的第二个hex值 # 必填
  - TMDB_API_KEY=                      # 可选，也可在网页设置页填写
```

### 3. 启动

```bash
docker compose up -d --build
```

访问 `http://<服务器IP>:8081`，用 `admin` + 你的密码登录，
在 **「设置 → 数据源」** 粘贴 TMDB API Key → 测试连接 → 保存。

> 💡 TMDB API Key 免费：<https://www.themoviedb.org/signup> → Settings → API → Create

### 4. 接入网盘（可选）

在 **「设置 → 网盘」** 填入夸克 Cookie，即可开启转存和追剧功能。

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
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | ✅ 必改 | 管理员登录凭证 |
| `AUTH_SECRET` | ✅ 必填 | JWT 签名密钥（`openssl rand -hex 32`） |
| `ENCRYPTION_KEY` | ✅ 必填 | AES-256-GCM 加密密钥（`openssl rand -hex 32`） |
| `TMDB_API_KEY` | — | 环境变量方式配置 TMDB Key（也可网页设置页填） |
| `TMDB_LANGUAGE` | — | 默认 `zh-CN` |
| `CACHE_TTL` | — | 缓存秒数，默认 3600（TMDB 免费层有限速） |

## 🔒 安全说明

- TMDB API Key、Cookie 等敏感配置 **AES-256-GCM 加密存储**于 `backend/data/settings.json`
- 所有接口需登录认证（JWT），避免 API 配额被陌生人白嫖
- v3 Key（纯字母数字）自动走 `api_key` 参数；v4 Token（`eyJ` 开头）自动走 Bearer 头

## 📄 License

MIT
