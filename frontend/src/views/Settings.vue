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
      <template #header><span>☁️ 网盘转存（夸克 / 115）</span></template>
      <el-form label-width="120px" class="form">
        <el-form-item label="夸克 Cookie">
          <el-input
            v-model="cookieQuark"
            type="password"
            show-password
            placeholder="登录 pan.quark.cn 后从浏览器复制 Cookie（含 _upass2 等字段）"
            class="key-input"
          />
          <span v-if="info?.cookie_quark_masked" class="masked-inline">当前：{{ info.cookie_quark_masked }}</span>
        </el-form-item>
        <el-form-item label="夸克目录 ID">
          <el-input v-model="folderIdQuark" placeholder="留空为根目录（0）；可从分享链接 #/ 后或网盘 API 获取" class="key-input" />
        </el-form-item>
        <el-form-item label="115 Cookie">
          <el-input
            v-model="cookie115"
            type="password"
            show-password
            placeholder="登录 115.com 后从浏览器复制 Cookie（含 UID、CID、SEID 等字段）"
            class="key-input"
          />
          <span v-if="info?.cookie_115_masked" class="masked-inline">当前：{{ info.cookie_115_masked }}</span>
        </el-form-item>
        <el-form-item label="115 目录 ID">
          <el-input v-model="folderId115" placeholder="留空为根目录（0）" class="key-input" />
        </el-form-item>
        <el-form-item label=" ">
          <el-button type="primary" :loading="saving" @click="saveAll">保存网盘配置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="card" shadow="never">
      <template #header><span>🔔 通知（追剧提醒 / 转存结果）</span></template>
      <el-form label-width="120px" class="form">
        <el-form-item label="Telegram Bot Token">
          <el-input
            v-model="telegramToken"
            type="password"
            show-password
            placeholder="从 @BotFather 获取（可选）"
            class="key-input"
          />
          <span v-if="info?.telegram_bot_token_masked" class="masked-inline">当前：{{ info.telegram_bot_token_masked }}</span>
        </el-form-item>
        <el-form-item label="接收 Chat ID">
          <el-input v-model="telegramChatIds" placeholder="多个用逗号/空格分隔；向 @userinfobot 发送任意消息可查自己的 ID" class="key-input" />
        </el-form-item>
        <el-form-item label="Discord Webhook">
          <el-input v-model="discordWebhooks" placeholder="https://discord.com/api/webhooks/...（可选，多个换行/逗号分隔）" class="key-input" />
        </el-form-item>
        <el-form-item label="通知渠道">
          <el-checkbox-group v-model="notifyTargets">
            <el-checkbox value="telegram_chat">Telegram</el-checkbox>
            <el-checkbox value="discord_channel">Discord</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label=" ">
          <el-button type="primary" :loading="saving" @click="saveAll">保存通知配置</el-button>
          <el-button :loading="testingNotify" @click="testNotify">发送测试消息</el-button>
        </el-form-item>
      </el-form>
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
const testingNotify = ref(false);

// 网盘
const cookieQuark = ref('');
const folderIdQuark = ref('');
const cookie115 = ref('');
const folderId115 = ref('');
// 通知
const telegramToken = ref('');
const telegramChatIds = ref('');
const discordWebhooks = ref('');
const notifyTargets = ref<string[]>(['telegram_chat', 'discord_channel']);

const hasKey = computed(() => !!info.value?.tmdb_api_key_masked || info.value?.source === 'env');
const sourceLabel = computed(() => {
  if (!info.value) return '—';
  if (info.value.source === 'settings') return '设置页（加密存储）';
  if (info.value.source === 'env') return '环境变量';
  return '未配置';
});

async function load() {
  info.value = await settingsApi.get();
  apiKey.value = ''; // 不回显完整 Key，仅显示脱敏
  folderIdQuark.value = info.value.folder_id_quark || '';
  folderId115.value = info.value.folder_id_115 || '';
  telegramChatIds.value = info.value.telegram_chat_ids || '';
  discordWebhooks.value = info.value.discord_webhook_urls || '';
  notifyTargets.value = info.value.notification_targets?.length ? info.value.notification_targets : ['telegram_chat', 'discord_channel'];
  cookieQuark.value = '';
  cookie115.value = '';
  telegramToken.value = '';
}

async function saveKey() {
  const key = apiKey.value.trim();
  if (!key) {
    ElMessage.warning('请输入 API Key');
    return;
  }
  saving.value = true;
  try {
    await settingsApi.save({ tmdb_api_key: key });
    ElMessage.success('已保存，立即生效');
    apiKey.value = '';
    await load();
  } finally {
    saving.value = false;
  }
}

async function saveAll() {
  saving.value = true;
  try {
    await settingsApi.save({
      cookie_quark: cookieQuark.value.trim(),
      folder_id_quark: folderIdQuark.value.trim(),
      cookie_115: cookie115.value.trim(),
      folder_id_115: folderId115.value.trim(),
      telegram_bot_token: telegramToken.value.trim(),
      telegram_chat_ids: telegramChatIds.value.trim(),
      discord_webhook_urls: discordWebhooks.value.trim(),
      notification_targets: JSON.stringify(notifyTargets.value),
    });
    ElMessage.success('配置已保存');
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

async function testNotify() {
  testingNotify.value = true;
  try {
    const res = await settingsApi.testNotify();
    if (res.ok) {
      ElMessage.success(res.message);
    } else {
      ElMessage.error(res.message);
    }
  } finally {
    testingNotify.value = false;
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
  max-width: 760px;
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
.masked-inline {
  margin-left: 10px;
  font-size: 12px;
  color: #8b93a1;
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
