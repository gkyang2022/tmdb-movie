<template>
  <el-container class="layout">
    <el-aside width="200px" class="sidebar">
      <div class="brand">
        <img src="/logo.svg" alt="QuarkCine" class="brand-logo" />
        <span class="brand-name">QuarkCine</span>
      </div>
      <el-menu :default-active="$route.path" router background-color="#14181f" text-color="#9aa3b2" active-text-color="#ffffff" class="menu">
        <el-menu-item index="/home">
          <el-icon><HomeFilled /></el-icon><span>首页</span>
        </el-menu-item>
        <el-menu-item index="/rank/movie">
          <el-icon><Film /></el-icon><span>电影</span>
        </el-menu-item>
        <el-menu-item index="/rank/tv">
          <el-icon><Monitor /></el-icon><span>剧集</span>
        </el-menu-item>
        <el-menu-item index="/search">
          <el-icon><Search /></el-icon><span>搜索</span>
        </el-menu-item>
        <el-menu-item index="/tracker">
          <el-icon><Bell /></el-icon><span>追剧提醒</span>
        </el-menu-item>
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon><span>设置</span>
        </el-menu-item>
      </el-menu>
      <div class="sidebar-footer">
        <span class="user">{{ store.username }}</span>
        <div class="footer-right">
          <a href="https://github.com/gkyang2022/quarkcine" target="_blank" class="github-link" title="QuarkCine GitHub">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
            <span class="version">v{{ VERSION }}</span>
          </a>
          <el-button link type="danger" size="small" @click="logout">退出</el-button>
        </div>
      </div>
    </el-aside>
    <el-main class="main">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { VERSION } from '@/version';
import { HomeFilled, Film, Monitor, Search, Setting, Bell } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';

const store = useUserStore();
const router = useRouter();

function logout() {
  store.logout();
  router.push('/login');
}
</script>

<style scoped>
.layout {
  height: 100%;
}
.sidebar {
  background: #14181f;
  border-right: 1px solid #21262f;
  display: flex;
  flex-direction: column;
}
.brand {
  padding: 18px 20px;
  font-size: 17px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
}
.brand-logo {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}
.menu {
  border-right: none;
  flex: 1;
}
.menu :deep(.el-menu-item) {
  height: 46px;
  margin: 4px 8px;
  border-radius: 8px;
}
.menu :deep(.el-menu-item.is-active) {
  background: #2a5bd7;
}
.sidebar-footer {
  padding: 14px 20px;
  border-top: 1px solid #21262f;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #8b93a1;
}
.footer-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.github-link {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #8b93a1;
  text-decoration: none;
  transition: color 0.2s;
}
.github-link:hover {
  color: #c8cdd6;
}
.version {
  font-size: 11px;
}
.main {
  padding: 20px 24px;
  overflow-y: auto;
}
</style>
