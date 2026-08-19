<template>
  <div class="login-page">
    <div class="login-box">
      <div class="logo-wrap"><img src="/logo.svg" alt="QuarkCine" class="logo-img" /></div>
      <h1 class="logo">QuarkCine</h1>
      <p class="subtitle">影视探索 · 数据来自 TMDB</p>
      <el-form @submit.prevent="doLogin">
        <el-form-item>
          <el-input v-model="username" placeholder="用户名" size="large" :prefix-icon="User" />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="password"
            type="password"
            placeholder="密码"
            size="large"
            show-password
            :prefix-icon="Lock"
            @keyup.enter="doLogin"
          />
        </el-form-item>
        <el-button type="primary" size="large" class="login-btn" :loading="loading" @click="doLogin">
          登 录
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
import { authApi } from '@/api/tmdb';
import { useUserStore } from '@/stores/user';

const username = ref('');
const password = ref('');
const loading = ref(false);
const router = useRouter();
const route = useRoute();
const store = useUserStore();

async function doLogin() {
  if (!username.value || !password.value) {
    ElMessage.warning('请输入用户名和密码');
    return;
  }
  loading.value = true;
  try {
    const res = await authApi.login(username.value, password.value);
    store.setLogin(res.token, res.username);
    ElMessage.success('登录成功');
    router.push((route.query.redirect as string) || '/home');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at top, #1a2130 0%, #0f1115 60%);
}
.login-box {
  width: 360px;
  padding: 40px 36px;
  background: #171b23;
  border: 1px solid #262c37;
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}
.logo-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}
.logo-img {
  width: 72px;
  height: 72px;
}
.logo {
  text-align: center;
  font-size: 24px;
  margin-bottom: 4px;
}
.subtitle {
  text-align: center;
  color: #8b93a1;
  font-size: 12px;
  margin-bottom: 28px;
}
.login-btn {
  width: 100%;
}

</style>
