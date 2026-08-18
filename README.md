# 🎬 TMDB Movie

一个基于 **TMDB 官方 API** 的影视探索 Web 应用。前后端分离：
后端 Express + TypeScript，前端 Vue 3 + Vite + Element Plus。

> 参考 [horacemovie](https://github.com/gkyang2022/horacemovie) 的架构设计，数据源换成 TMDB（正规官方 API，无需 Cookie / 反爬 hack，图片直链稳定）。

## ✨ 功能

- 📈 **本周趋势**（全部 / 电影 / 剧集）
- 🔥 **正在热映**
- 🏆 **排行榜**（电影 Top / 剧集 Top，10 分制评分）
- 🔍 **搜索**（全部 / 电影 / 剧集）
- 📄 **详情页**（简介、评分、导演、演员、预告片、相似推荐）
- ⚙️ **设置页配置 TMDB API Key** —— 部署者自己填，支持「测试连接」，保存即生效无需重启

## 🚀 快速开始（Docker 部署）

### 1. 获取 TMDB API Key（免费，约 2 分钟）

1. 打开 <https://www.themoviedb.org/signup> 注册账号
2. 进入 <https://www.themoviedb.org/settings/api> 创建 API Key（Developer 类型）
3. 复制 **API Key (v3)** 或 **API Read Access Token (v4)**（两种都支持）

### 2. 修改配置

编辑 `docker-compose.yml`：

```yaml
environment:
  - ADMIN_PASSWORD=改成你自己的密码        # 必改！
  - AUTH_SECRET=openssl rand -hex 32 生成  # 必填
  - ENCRYPTION_KEY=openssl rand -hex 32 生成  # 必填（加密存储 API Key）
  - TMDB_API_KEY=可选，也可部署后在网页设置页填写
```

### 3. 启动

```bash
docker compose up -d --build
```

访问 `http://<服务器IP>:8080`，用 `admin` + 你设置的密码登录，
在 **「设置」页**粘贴 TMDB API Key → 测试连接 → 保存，即刻可用。

## 🛠 本地开发

```bash
# 后端（http://localhost:8008）
cd backend
cp .env.example .env   # 填写必要配置
npm install
npm run dev

# 前端（http://localhost:8080，已代理 /api 到后端）
cd frontend
npm install
npm run dev
```

## ⚙️ 环境变量

| 变量 | 必填 | 说明 |
|---|---|---|
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | 生产必改 | 管理员登录账号 |
| `AUTH_SECRET` | 生产必填 | JWT 签名密钥（`openssl rand -hex 32`） |
| `ENCRYPTION_KEY` | 生产必填 | 设置加密密钥（AES-256-GCM，`openssl rand -hex 32`） |
| `TMDB_API_KEY` | 可选 | 环境变量方式配置 TMDB Key（也可网页设置页填） |
| `TMDB_LANGUAGE` | 否 | 默认 `zh-CN` |
| `IMAGE_PROXY_BASE` | 否 | 图片代理前缀，默认空 = TMDB 官方 CDN 直链 |
| `CACHE_TTL` | 否 | 缓存秒数，默认 3600（TMDB 免费层有限速） |

## 🔒 安全说明

- TMDB API Key **加密存储**（AES-256-GCM），数据库文件位于 `backend/data/settings.json`
- 所有数据接口需登录（Bearer Token），避免部署者的 API Key 配额被陌生人白嫖
- Key 支持两种格式：v3 Key（自动走 `api_key` 参数）/ v4 Token（`eyJ` 开头，自动走 Bearer 头）

## 📄 License

MIT
