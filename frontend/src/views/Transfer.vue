<template>
  <div class="transfer">
    <h1 class="page-title">📥 网盘转存</h1>

    <el-alert
      v-if="!quarkConfigured && !configured115"
      type="warning"
      show-icon
      :closable="false"
      title="尚未配置网盘 Cookie"
      description="请先在「设置」页填写夸克/115 的 Cookie 和目标目录，才能使用转存功能。"
      class="alert"
    />

    <el-card class="card" shadow="never">
      <template #header><span>夸克网盘转存</span></template>
      <el-form label-width="100px" class="form" @submit.prevent>
        <el-form-item label="内容类型">
          <el-radio-group v-model="contentTypeQuark" size="small">
            <el-radio-button value="movie">电影</el-radio-button>
            <el-radio-button value="tv">剧集</el-radio-button>
            <el-radio-button value="default">默认</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="分享链接">
          <el-input
            v-model="quarkUrl"
            type="textarea"
            :rows="2"
            placeholder="https://pan.quark.cn/s/xxxx（支持带提取码，如 ...?pwd=abc）"
            class="url-input"
          />
        </el-form-item>
        <el-form-item label=" ">
          <el-button type="primary" :loading="transferring" :disabled="!quarkConfigured" @click="doTransfer('quark')">
            转存到夸克
          </el-button>
          <span v-if="quarkConfigured && quarkFolderId" class="hint">
            目标：{{ quarkFolderLabel }}（{{ quarkFolderId === '0' ? '根目录' : quarkFolderId }}）
          </span>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="card" shadow="never">
      <template #header><span>115 网盘转存</span></template>
      <el-form label-width="100px" class="form" @submit.prevent>
        <el-form-item label="内容类型">
          <el-radio-group v-model="contentType115" size="small">
            <el-radio-button value="movie">电影</el-radio-button>
            <el-radio-button value="tv">剧集</el-radio-button>
            <el-radio-button value="default">默认</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="分享链接">
          <el-input
            v-model="url115"
            type="textarea"
            :rows="2"
            placeholder="https://115.com/s/xxxx?password=abc"
            class="url-input"
          />
        </el-form-item>
        <el-form-item label=" ">
          <el-button type="primary" :loading="transferring115" :disabled="!configured115" @click="doTransfer('115')">
            转存到 115
          </el-button>
          <span v-if="configured115 && folderId115" class="hint">
            目标：{{ folderId115 === '0' ? '根目录' : folderId115 }}
          </span>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="lastResult" class="card result-card" shadow="never">
      <template #header><span>📋 转存结果</span></template>
      <el-result
        :icon="lastResult.ok ? 'success' : 'error'"
        :title="lastResult.ok ? '转存成功' : '转存失败'"
        :sub-title="lastResult.message"
      >
        <template v-if="lastResult.names && lastResult.names.length">
          <div class="names">
            <el-tag v-for="(name, i) in lastResult.names" :key="i" size="small" class="name-tag" effect="plain">
              {{ name }}
            </el-tag>
          </div>
        </template>
      </el-result>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { transferApi } from '@/api/tmdb';
import type { TransferResult } from '@/types';

const quarkUrl = ref('');
const url115 = ref('');
const quarkConfigured = ref(false);
const configured115 = ref(false);
const quarkFolderId = ref('0');
const folderId115 = ref('0');
const transferring = ref(false);
const transferring115 = ref(false);
const lastResult = ref<TransferResult | null>(null);

// 内容类型：用于路由到分类子目录
const contentTypeQuark = ref<'movie' | 'tv' | 'default'>('default');
const contentType115 = ref<'movie' | 'tv' | 'default'>('default');

const quarkFolderLabel = computed(() => {
  if (contentTypeQuark.value === 'movie') return '电影目录';
  if (contentTypeQuark.value === 'tv') return '剧集目录';
  return '默认目录';
});

async function loadConfig() {
  try {
    const cfg = await transferApi.config();
    quarkConfigured.value = cfg.quark.configured;
    configured115.value = cfg['115'].configured;
    quarkFolderId.value = cfg.quark.folderId;
    folderId115.value = cfg['115'].folderId;
  } catch {
    // 忽略，未配置时按钮置灰即可
  }
}

async function doTransfer(type: 'quark' | '115') {
  const url = type === 'quark' ? quarkUrl.value.trim() : url115.value.trim();
  if (!url) {
    ElMessage.warning('请先填写分享链接');
    return;
  }
  const ct = (() => {
    const raw = type === 'quark' ? contentTypeQuark.value : contentType115.value;
    return raw === 'default' ? undefined : raw;
  })();
  const loading = type === 'quark' ? transferring : transferring115;
  loading.value = true;
  try {
    const res = await transferApi.save(url, type, ct);
    lastResult.value = res;
    if (res.ok) {
      ElMessage.success(res.message);
    } else {
      ElMessage.error(res.error || res.message);
    }
  } catch (e: any) {
    const msg = e?.response?.data?.error || e?.message || '转存请求失败';
    lastResult.value = { ok: false, message: msg };
    ElMessage.error(msg);
  } finally {
    loading.value = false;
  }
}

onMounted(loadConfig);
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
.form {
  max-width: 760px;
}
.url-input {
  width: 100%;
}
.hint {
  margin-left: 10px;
  color: #8b93a1;
  font-size: 12px;
}
.result-card {
  max-width: 760px;
}
.names {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  max-width: 640px;
  margin: 0 auto;
}
.name-tag {
  background: #232936;
  border-color: #3a4253;
  color: #c8cdd6;
}
</style>
