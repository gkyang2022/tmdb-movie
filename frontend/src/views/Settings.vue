<template>
  <div class="settings">
    <h1 class="page-title">⚙️ 设置</h1>

    <el-alert
      v-if="!hasKey"
      type="warning"
      show-icon
      :closable="false"
      title="尚未配置 TMDB API Key，数据接口暂不可用"
      description="请在下方向 TMDB 免费申请一个 API Key 并填写保存，立即生效无需重启。"
      class="alert"
    />

    <el-card class="card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>🎬 TMDB 数据源</span>
          <el-tag v-if="info" size="small" :type="info.source === 'none' ? 'info' : 'success'">
            {{ sourceLabel }}
          </el-tag>
        </div>
      </template>

      <el-form label-width="120px" class="form">
        <el-form-item label="API Key">
          <el-input
            v-model="apiKey"
            type="password"
            show-password
            placeholder="粘贴你的 TMDB API Key（v3 Key 或 v4 Access Token 均可）"
            class="key-input"
          />
        </el-form-item>

        <el-form-item v-if="info?.tmdb_api_key_masked" label="当前已配置">
          <span class="masked">{{ info.tmdb_api_key_masked }}</span>
          <span class="masked-hint">（保存新值会覆盖旧值）</span>
        </el-form-item>

        <el-form-item label=" ">
          <el-button type="primary" :loading="saving" @click="saveKey">保存</el-button>
          <el-button :loading="testing" @click="testKey">测试连接</el-button>
          <el-button v-if="hasKey" type="danger" plain :loading="saving" @click="clearKey">清除 Key</el-button>
        </el-form-item>
      </el-form>

      <el-divider />

      <h3 class="howto-title">📖 如何获取 TMDB API Key（约 2 分钟，免费）</h3>
      <ol class="howto">
        <li>打开 <el-link type="primary" href="https://www.themoviedb.org/signup" target="_blank">themoviedb.org</el-link> 注册账号（邮箱即可）</li>
        <li>登录后进入 <el-link type="primary" href="https://www.themoviedb.org/settings/api" target="_blank">Settings → API</el-link></li>
        <li>点击「Create」创建 API Key，类型选 Developer</li>
        <li>把生成的 <b>API Key (v3)</b> 或 <b>API Read Access Token (v4)</b> 粘贴到上方输入框</li>
        <li>点击「测试连接」验证，通过后点「保存」即可开始使用</li>
      </ol>
      <p class="howto-note">
        💡 两种格式都支持：v3 Key（一串字母数字）自动走 api_key 参数；v4 Token（eyJ 开头）自动走 Bearer 头。
        也可用环境变量 <code>TMDB_API_KEY</code> 配置，二选一即可。
      </p>
    </el-card>

    <el-card class="card" shadow="never">
      <template #header><span>ℹ️ 当前环境信息</span></template>
      <el-descriptions :column="1" size="small" border>
        <el-descriptions-item label="Key 来源">
          {{ info ? sourceLabel : '—' }}
        </el-descriptions-item>
        <el-descriptions-item label="API 语言">{{ info?.language || '—' }}</el-descriptions-item>
        <el-descriptions-item label="图片代理">
          {{ info?.image_proxy_base || '未设置（使用 TMDB 官方 CDN 直链）' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { settingsApi } from '@/api/tmdb';
import type { SettingsInfo } from '@/types';

const apiKey = ref('');
const info = ref<SettingsInfo | null>(null);
const saving = ref(false);
const testing = ref(false);

const hasKey = computed(() => !!info.value?.tmdb_api_key_masked || info.value?.source === 'env');
const sourceLabel = computed(() => {
  if (!info.value) return '—';
  if (info.value.source === 'settings') return '设置页（加密存储）';
  if (info.value.source === 'env') return '环境变量';
  return '未配置';
});

async function load() {
  info.value = await settingsApi.get();
  if (info.value.source === 'settings') {
    apiKey.value = ''; // 不回显完整 Key，仅显示脱敏
  }
}

async function saveKey() {
  const key = apiKey.value.trim();
  if (!key) {
    ElMessage.warning('请输入 API Key');
    return;
  }
  saving.value = true;
  try {
    await settingsApi.save(key);
    ElMessage.success('已保存，立即生效');
    apiKey.value = '';
    await load();
  } finally {
    saving.value = false;
  }
}

async function testKey() {
  const key = apiKey.value.trim();
  if (!key && !hasKey.value) {
    ElMessage.warning('请先填写 API Key 再测试');
    return;
  }
  testing.value = true;
  try {
    const res = await settingsApi.test(key || '');
    if (res.valid) {
      ElMessage.success(res.message);
    } else {
      ElMessage.error(res.message);
    }
  } finally {
    testing.value = false;
  }
}

async function clearKey() {
  saving.value = true;
  try {
    await settingsApi.clear();
    ElMessage.success('已清除 Key');
    await load();
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.page-title {
  font-size: 24px;
  margin-bottom: 16px;
}
.alert {
  margin-bottom: 16px;
}
.card {
  background: #171b23;
  border-color: #262c37;
  margin-bottom: 16px;
}
.card :deep(.el-card__header) {
  border-bottom-color: #262c37;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.form {
  max-width: 720px;
}
.key-input {
  max-width: 520px;
}
.masked {
  font-family: monospace;
  color: #c8cdd6;
}
.masked-hint {
  color: #6b7280;
  font-size: 12px;
  margin-left: 8px;
}
.howto-title {
  font-size: 15px;
  margin-bottom: 10px;
}
.howto {
  padding-left: 20px;
  color: #c8cdd6;
  font-size: 13px;
  line-height: 2;
}
.howto-note {
  margin-top: 10px;
  color: #8b93a1;
  font-size: 12px;
  line-height: 1.8;
}
.howto-note code {
  background: #232936;
  padding: 1px 6px;
  border-radius: 4px;
  color: #f0b429;
}
</style>
