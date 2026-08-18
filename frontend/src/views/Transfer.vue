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
          <span v-if="!quarkConfigured" class="hint">未配置夸克 Cookie</span>
        </el-form-item>
      </el-form>
      <div v-if="quarkFolderId" class="folder-hint">
        目标目录：{{ quarkFolderId === '0' ? '网盘根目录' : quarkFolderId }}
      </div>
    </el-card>

    <el-card class="card" shadow="never">
      <template #header><span>115 网盘转存</span></template>
      <el-form label-width="100px" class="form" @submit.prevent>
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
          <span v-if="!configured115" class="hint">未配置 115 Cookie</span>
        </el-form-item>
      </el-form>
      <div v-if="folderId115" class="folder-hint">
        目标目录：{{ folderId115 === '0' ? '网盘根目录' : folderId115 }}
      </div>
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
import { onMounted, ref } from 'vue';
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
  const loading = type === 'quark' ? transferring : transferring115;
  loading.value = true;
  try {
    const res = await transferApi.save(url, type);
    lastResult.value = res;
    if (res.ok) {
      ElMessage.success(res.message);
    } else {
      ElMessage.error(res.error || res.message);
    }
  } catch (e: any) {
    const msg = e?.response?.data?.error || '转存请求失败';
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
  color: #6b7280;
  font-size: 12px;
}
.folder-hint {
  margin-left: 100px;
  color: #8b93a1;
  font-size: 12px;
  margin-top: -10px;
  margin-bottom: 10px;
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
