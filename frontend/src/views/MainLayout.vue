<template>
  <el-container class="layout">
    <el-aside width="200px" class="sidebar">
      <div class="brand">🎬 TMDB Movie</div>
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
        <el-button link type="danger" size="small" @click="logout">退出</el-button>
      </div>
    </el-aside>
    <el-main class="main">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
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
.main {
  padding: 20px 24px;
  overflow-y: auto;
}
</style>
