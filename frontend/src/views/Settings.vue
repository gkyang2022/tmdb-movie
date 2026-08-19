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

    <!-- 分类目录配置 -->
    <el-card class="card" shadow="never">
      <template #header><span>📁 分类目录配置（可选）</span></template>
      <el-alert type="info" :closable="false" class="alert-sm">
        配置后，转存电影/剧集时会自动路由到对应目录。不配置则使用上方的基础目录 ID。
      </el-alert>
      
      <el-tabs v-model="folderTab" class="folder-tabs">
        <el-tab-pane label="夸克网盘" name="quark">
          <el-form label-width="100px" class="form">
            <el-form-item label="电影目录">
              <el-input v-model="quarkFolders.movie" placeholder="目录 ID 或点击浏览">
                <template #append>
                  <el-button @click="openFolderPicker('quark', 'movie')">浏览</el-button>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="剧集目录">
              <el-input v-model="quarkFolders.tv" placeholder="目录 ID 或点击浏览">
                <template #append>
                  <el-button @click="openFolderPicker('quark', 'tv')">浏览</el-button>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="默认目录">
              <el-input v-model="quarkFolders.default" placeholder="未匹配类型时使用" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="115网盘" name="115">
          <el-form label-width="100px" class="form">
            <el-form-item label="电影目录">
              <el-input v-model="folders115.movie" placeholder="目录 ID 或点击浏览">
                <template #append>
                  <el-button @click="openFolderPicker('115', 'movie')">浏览</el-button>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="剧集目录">
              <el-input v-model="folders115.tv" placeholder="目录 ID 或点击浏览">
                <template #append>
                  <el-button @click="openFolderPicker('115', 'tv')">浏览</el-button>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="默认目录">
              <el-input v-model="folders115.default" placeholder="未匹配类型时使用" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      
      <el-button type="primary" :loading="saving" @click="saveFolderConfig">保存目录配置</el-button>
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
      <template #header><span>🔍 盘搜（Pansou 网盘搜索）</span></template>
      <el-form label-width="120px" class="form">
        <el-form-item label="Pansou 地址">
          <el-input
            v-model="pansouUrl"
            placeholder="http://你的-pansou-实例:port（自部署 fish2018/pansou 后填写）"
            class="key-input"
          />
          <span v-if="info?.pansou_url" class="masked-inline">当前：{{ info.pansou_url }}</span>
        </el-form-item>
        <el-form-item label=" ">
          <el-button type="primary" :loading="saving" @click="saveAll">保存盘搜配置</el-button>
        </el-form-item>
        <el-alert
          type="info"
          :closable="false"
          show-icon
          class="pansou-tip"
          title="详情页「搜盘」按钮依赖此服务"
          description="Pansou 是一个开源网盘资源搜索服务（支持 115 / 夸克）。需自行部署在 NAS 或服务器上，把实例地址填到这里即可。未配置时详情页点「搜盘」会提示去设置。"
        />
      </el-form>
    </el-card>

    <el-card class="card" shadow="never">
      <template #header><span>🛠 工具</span></template>
      <div class="tools-row">
        <div class="tool-item">
          <div class="tool-info">
            <div class="tool-title">☁️ 手动转存</div>
            <div class="tool-desc">拿到一个网盘分享链接（不是从详情页搜出来的）时，粘贴到这里直接转存</div>
          </div>
          <el-button type="primary" plain @click="goTransfer">打开转存页</el-button>
        </div>
      </div>
    </el-card>

    <el-card class="card" shadow="never">
      <template #header><span>🔑 修改登录密码</span></template>
      <el-form label-width="120px" class="form">
        <el-form-item label="旧密码">
          <el-input
            v-model="pwdForm.oldPassword"
            type="password"
            show-password
            placeholder="当前登录密码"
            class="key-input"
            @keyup.enter="changePassword"
          />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input
            v-model="pwdForm.newPassword"
            type="password"
            show-password
            placeholder="至少 6 位"
            class="key-input"
            @keyup.enter="changePassword"
          />
        </el-form-item>
        <el-form-item label="确认新密码">
          <el-input
            v-model="pwdForm.confirmPassword"
            type="password"
            show-password
            placeholder="再输一次新密码"
            class="key-input"
            @keyup.enter="changePassword"
          />
        </el-form-item>
        <el-form-item label=" ">
          <el-button type="primary" :loading="changingPwd" @click="changePassword">修改密码</el-button>
        </el-form-item>
        <p class="pwd-hint">
          💡 密码以加密形式保存在服务端，修改后需用新密码重新登录。
          如果忘记旧密码，可重新部署并用 <code>ADMIN_PASSWORD</code> 环境变量重置。
        </p>
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
  
  <!-- 目录选择器弹窗 -->
  <el-dialog v-model="folderPickerVisible" title="选择目录" width="600px">
    <el-breadcrumb separator="/" class="breadcrumb">
      <el-breadcrumb-item
        v-for="(item, idx) in folderPathStack"
        :key="item.id"
        @click="enterFolderByPath(idx)"
      >
        <span class="breadcrumb-item">{{ item.name }}</span>
      </el-breadcrumb-item>
    </el-breadcrumb>
    
    <div v-loading="folderLoading" class="folder-list">
      <div
        v-for="folder in folderList"
        :key="folder.id"
        class="folder-item"
        :class="{ selected: selectedFolder?.id === folder.id }"
        @click="selectFolder(folder)"
        @dblclick="enterFolder(folder)"
      >
        <el-icon size="20"><Folder /></el-icon>
        <span class="folder-name">{{ folder.name }}</span>
      </div>
      <el-empty v-if="!folderLoading && folderList.length === 0" description="此目录为空" />
    </div>
    
    <template #footer>
      <el-button @click="folderPickerVisible = false">取消</el-button>
      <el-button type="primary" :disabled="!selectedFolder" @click="confirmFolderSelection">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Folder } from '@element-plus/icons-vue';
import { authApi, settingsApi } from '@/api/tmdb';
import { useUserStore } from '@/stores/user';
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

// 分类目录
const folderTab = ref<'quark' | '115'>('quark');
const quarkFolders = ref({ movie: '', tv: '', default: '' });
const folders115 = ref({ movie: '', tv: '', default: '' });

// 目录选择器
const folderPickerVisible = ref(false);
const folderLoading = ref(false);
const folderList = ref<{ id: string; name: string; isFolder: boolean }[]>([]);
const folderPathStack = ref<{ id: string; name: string }[]>([{ id: '0', name: '根目录' }]);
const selectedFolder = ref<{ id: string; name: string; isFolder: boolean } | null>(null);
const currentPickerType = ref<'quark' | '115'>('quark');
const currentPickerField = ref<'movie' | 'tv' | 'default'>('movie');
// 通知
const telegramToken = ref('');
const telegramChatIds = ref('');
const discordWebhooks = ref('');
const notifyTargets = ref<string[]>(['telegram_chat', 'discord_channel']);
// 盘搜
const pansouUrl = ref('');

// 修改密码
const pwdForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' });
const changingPwd = ref(false);
const router = useRouter();
const userStore = useUserStore();

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
  
  // 加载分类目录配置（确保每次都设置，包括空值）
  quarkFolders.value = {
    movie: info.value.quark_folders?.movie || '',
    tv: info.value.quark_folders?.tv || '',
    default: info.value.quark_folders?.default || '',
  };
  folders115.value = {
    movie: info.value.folders_115?.movie || '',
    tv: info.value.folders_115?.tv || '',
    default: info.value.folders_115?.default || '',
  };
  
  telegramChatIds.value = info.value.telegram_chat_ids || '';
  discordWebhooks.value = info.value.discord_webhook_urls || '';
  notifyTargets.value = info.value.notification_targets?.length ? info.value.notification_targets : ['telegram_chat', 'discord_channel'];
  pansouUrl.value = info.value.pansou_url || '';
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
      pansou_url: pansouUrl.value.trim(),
    });
    ElMessage.success('配置已保存');
    await load();
  } finally {
    saving.value = false;
  }
}

async function saveFolderConfig() {
  saving.value = true;
  try {
    await settingsApi.save({
      quark_folders: JSON.stringify(quarkFolders.value),
      '115_folders': JSON.stringify(folders115.value),
    });
    ElMessage.success('目录配置已保存');
  } finally {
    saving.value = false;
  }
}

async function openFolderPicker(type: 'quark' | '115', field: 'movie' | 'tv' | 'default') {
  currentPickerType.value = type;
  currentPickerField.value = field;
  folderPathStack.value = [{ id: '0', name: '根目录' }];
  selectedFolder.value = null;
  await loadFolders('0');
  folderPickerVisible.value = true;
}

async function loadFolders(parentId: string) {
  folderLoading.value = true;
  try {
    const { transferApi } = await import('@/api/tmdb');
    const res = await transferApi.listFolders(currentPickerType.value, parentId);
    folderList.value = res.folders || [];
  } catch (e: any) {
    ElMessage.error(e?.message || '加载目录失败');
    folderList.value = [];
  } finally {
    folderLoading.value = false;
  }
}

function selectFolder(folder: { id: string; name: string; isFolder: boolean }) {
  selectedFolder.value = folder;
}

async function enterFolder(folder: { id: string; name: string; isFolder: boolean }) {
  folderPathStack.value.push({ id: folder.id, name: folder.name });
  selectedFolder.value = null;
  await loadFolders(folder.id);
}

async function enterFolderByPath(idx: number) {
  folderPathStack.value = folderPathStack.value.slice(0, idx + 1);
  selectedFolder.value = null;
  await loadFolders(folderPathStack.value[idx].id);
}

function confirmFolderSelection() {
  if (!selectedFolder.value) return;
  const folders = currentPickerType.value === 'quark' ? quarkFolders : folders115;
  folders.value[currentPickerField.value] = selectedFolder.value.id;
  folderPickerVisible.value = false;
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

function goTransfer() {
  router.push('/transfer');
}

async function changePassword() {
  const { oldPassword, newPassword, confirmPassword } = pwdForm.value;
  if (!oldPassword || !newPassword || !confirmPassword) {
    ElMessage.warning('请填写完整');
    return;
  }
  if (newPassword.length < 6) {
    ElMessage.warning('新密码至少 6 位');
    return;
  }
  if (newPassword !== confirmPassword) {
    ElMessage.warning('两次新密码不一致');
    return;
  }
  if (newPassword === oldPassword) {
    ElMessage.warning('新密码不能与旧密码相同');
    return;
  }
  changingPwd.value = true;
  try {
    await ElMessageBox.confirm(
      '修改密码后需要重新登录，是否继续？',
      '确认修改密码',
      { confirmButtonText: '继续修改', cancelButtonText: '取消', type: 'warning' },
    );
  } catch {
    changingPwd.value = false;
    return;
  }
  try {
    const res = await authApi.changePassword(oldPassword, newPassword);
    ElMessage.success(res.message || '密码已更新，请重新登录');
    pwdForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
    userStore.logout();
    router.push('/login');
  } catch (e: any) {
    const msg = e?.response?.data?.error || e?.message || '修改失败';
    ElMessage.error(msg);
  } finally {
    changingPwd.value = false;
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
.pansou-tip {
  margin-top: 6px;
}
.tools-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.tool-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
}
.tool-title {
  font-weight: 600;
  margin-bottom: 4px;
}
.tool-desc {
  font-size: 12px;
  color: #8b93a1;
}
.pwd-hint {
  color: #8b93a1;
  font-size: 12px;
  line-height: 1.8;
  margin: 0;
}
.pwd-hint code {
  background: #232936;
  padding: 1px 6px;
  border-radius: 4px;
  color: #f0b429;
}

/* 目录选择器 */
.alert-sm {
  margin-bottom: 12px;
}
.folder-tabs {
  margin-bottom: 16px;
}
.breadcrumb {
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #1a1f28;
  border-radius: 4px;
}
.breadcrumb-item {
  cursor: pointer;
}
.breadcrumb-item:hover {
  color: #409eff;
}
.folder-list {
  min-height: 300px;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #262c37;
  border-radius: 4px;
  padding: 8px;
}
.folder-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}
.folder-item:hover {
  background: #232936;
}
.folder-item.selected {
  background: #1a3a52;
  border: 1px solid #409eff;
}
.folder-name {
  flex: 1;
}
</style>
