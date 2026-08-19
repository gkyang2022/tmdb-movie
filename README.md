# QuarkCine

> 影视发现 · 一键转存夸克/115网盘 · 自动生成 STRM 接入媒体库

基于 **TMDB 官方 API** 的影视探索工具，前后端分离：后端 Express + TypeScript，前端 Vue 3 + Vite + Element Plus。

转存链路打通夸克 + 115；配合 SmartStrm 可自动生成 STRM 文件，接入 Jellyfin / 飞牛影视等媒体库播放。

![QuarkCine](https://raw.githubusercontent.com/gkyang2022/quarkcine/main/screenshot.png)

## ✨ 功能

| 模块 | 功能 |
|:---|:---|
| **发现** | 首页趋势 / 热映 / Popular；分类页瀑布流 |
| **搜索** | 全文搜索全部 / 电影 / 剧集 |
| **详情** | 海报、评分、简介、导演、演员、预告片、相似推荐 |
| **盘搜** | 直连 Pansou，详情页一键搜盘 |
| **转存** | 夸克/115 分享链接一键转存，支持按内容类型分类目录 |
| **追剧** | 剧集订阅 + 定时检查 + Telegram/Discord 通知 |
| **STRM** | 转存成功后自动通知 SmartStrm 生成 STRM |
| **设置** | 网页填写 API Key，加密存储，保存即生效 |

## 🚀 一键部署（推荐 Docker Compose）

把下面内容保存为 `docker-compose.yml`，然后运行 `docker compose up -d` 即可。

> ⚠️ 首次部署前，先把 `ADMIN_PASSWORD` 改成你自己的密码。

```yaml
services:
  backend:
    image: yy562198/quarkcine-backend:latest
    container_name: quarkcine-backend
    restart: unless-stopped
    ports:
      - "8009:8008"
    environment:
      - PORT=8008
      - ADMIN_PASSWORD=你的密码          # ← 改成你自己的密码
      - TMDB_LANGUAGE=zh-CN
      - TZ=Asia/Shanghai
    volumes:
      - ./backend/data:/app/data

  frontend:
    image: yy562198/quarkcine-frontend:latest
    container_name: quarkcine-frontend
    restart: unless-stopped
    ports:
      - "8081:80"
    depends_on:
      - backend
```

### 启动步骤

```bash
# 1. 保存上面的文件为 docker-compose.yml

# 2. 启动
docker compose up -d

# 3. 打开浏览器访问
http://<服务器IP>:8081
```

用账号 **`admin`** 和你设置的密码登录。

---

### 从 Git 拉取（可选）

如果你熟悉 Git，也可以：

```bash
git clone https://github.com/gkyang2022/quarkcine.git && cd quarkcine
# 编辑 docker-compose.yml 修改 ADMIN_PASSWORD
docker compose up -d
```

---

## 配置 TMDB（免费，可跳过）

> 如果只用转存/追剧功能，不需要这一步。

1. 免费注册 TMDB：<https://www.themoviedb.org/signup>
2. 进入 **Settings → API → Create API key**
3. 复制 API Key，粘贴到 QuarkCine **「设置 → 数据源」** 页面 → 测试连接 → 保存

---

## 📁 接入网盘（可选）

在 **「设置 → 网盘」** 填入夸克 Cookie，即可开启转存、追剧提醒和 STRM 自动生成。

详细教程：[Wiki：网盘接入](https://github.com/gkyang2022/quarkcine/wiki)

## 🛠 本地开发

```bash
# 后端（http://localhost:8008）
cd backend && npm install
cp .env.example .env
npm run dev

# 前端（http://localhost:8080）
cd frontend && npm install
npm run dev
```

## 🔒 安全说明

- API Key、Cookie 等敏感配置 **AES-256-GCM 加密存储**
- 所有接口需登录认证（JWT）

## 🙏 鸣谢

本项目参考了 [horacemovie](https://github.com/gkyang2022/horacemovie) 的项目架构设计。

horacemovie 使用豆瓣 API，本项目改用 [TMDB](https://www.themoviedb.org/) API，数据源更稳定、国际化支持更好，并在此基础上扩展了 SmartStrm 集成功能。

## 📄 License

MIT
