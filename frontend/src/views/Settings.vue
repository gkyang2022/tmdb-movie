<template>
  <div class="settings">
    <!-- 顶部标题栏 -->
    <div class="settings-header">
      <div class="header-left">
        <h1 class="page-title">⚙️ 设置</h1>
        <span class="page-subtitle">QuarkCine 配置中心</span>
      </div>
      <div class="status-badge" :class="hasKey ? 'ok' : 'warn'">
        <span class="status-dot" />
        {{ hasKey ? '数据源已配置' : '数据源未配置' }}
      </div>
    </div>

    <!-- 警告提示 -->
    <el-alert
      v-if="!hasKey"
      type="warning"
      show-icon
      :closable="false"
      title="尚未配置 TMDB API Key，影片数据暂不可用"
      class="top-alert"
    />

    <!-- 主 Tab 区 -->
    <el-tabs v-model="activeTab" class="settings-tabs" tab-position="left">

      <!-- ========== Tab 1: 数据源 ========== -->
      <el-tab-pane name="source">
        <template #label>
          <span class="tab-label"><span class="tab-icon">🎬</span> 数据源</span>
        </template>

        <div class="tab-content">
          <div class="section-card">
            <div class="section-title">TMDB API Key</div>
            <p class="section-desc">用于获取电影 / 剧集的封面、评分、简介等信息。免费申请，约 2 分钟。</p>

            <el-form label-width="110px" class="form">
              <el-form-item label="API Key">
                <el-input
                  v-model="apiKey"
                  type="password"
                  show-password
                  placeholder="粘贴 TMDB API Key（v3 Key 或 v4 Token 均可）"
                  class="full-input"
                />
                <span v-if="info?.tmdb_api_key_masked" class="field-hint">
                  当前已配置：{{ info.tmdb_api_key_masked }}
                </span>
              </el-form-item>
              <el-form-item label="API 语言">
                <el-select v-model="tmdbLanguage" placeholder="默认 zh-CN" style="width: 200px">
                  <el-option label="中文 (zh-CN)" value="zh-CN" />
                  <el-option label="英文 (en-US)" value="en-US" />
                  <el-option label="日语 (ja-JP)" value="ja-JP" />
                  <el-option label="韩语 (ko-KR)" value="ko-KR" />
                </el-select>
              </el-form-item>
              <el-form-item label=" ">
                <el-button type="primary" :loading="saving" @click="saveKey">保存</el-button>
                <el-button :loading="testing" @click="testKey">测试连接</el-button>
                <el-button v-if="hasKey" type="danger" plain :loading="saving" @click="clearKey">清除</el-button>
              </el-form-item>
            </el-form>
          </div>

          <div class="section-card howto">
            <div class="section-title">📖 如何获取 TMDB API Key</div>
            <ol class="howto-list">
              <li>打开 <el-link type="primary" href="https://www.themoviedb.org/signup" target="_blank">themoviedb.org</el-link> 注册账号（邮箱即可）</li>
              <li>登录后进入 <el-link type="primary" href="https://www.themoviedb.org/settings/api" target="_blank">Settings → API</el-link></li>
              <li>点击「Create」→ 类型选「Developer」</li>
              <li>复制 <b>API Key (v3)</b> 或 <b>API Read Access Token (v4)</b> 粘贴上方</li>
            </ol>
            <p class="howto-note">
              💡 v3 Key（纯字母数字）自动走 <code>api_key</code> 参数；v4 Token（<code>eyJ</code> 开头）自动走 <code>Authorization: Bearer</code> 头。
            </p>
          </div>

          <el-descriptions :column="2" size="small" border class="info-table">
            <el-descriptions-item label="Key 来源">{{ sourceLabel }}</el-descriptions-item>
            <el-descriptions-item label="图片 CDN">
              {{ info?.image_proxy_base || 'TMDB 官方直链' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-tab-pane>

      <!-- ========== Tab 2: 网盘 ========== -->
      <el-tab-pane name="storage">
        <template #label>
          <span class="tab-label"><span class="tab-icon">☁️</span> 网盘</span>
        </template>

        <div class="tab-content">
          <!-- 夸克网盘 -->
          <div class="section-card">
            <div class="section-title">夸克网盘</div>
            <p class="section-desc">配置 Cookie 后可从详情页一键转存影片到夸克网盘。</p>
            <el-form label-width="110px" class="form">
              <el-form-item label="夸克 Cookie">
                <el-input
                  v-model="cookieQuark"
                  type="password"
                  show-password
                  placeholder="登录 pan.quark.cn → F12 → 复制请求头 Cookie"
                  class="full-input"
                />
                <span v-if="info?.cookie_quark_masked" class="field-hint ok">
                  ✓ 已配置：{{ info.cookie_quark_masked }}
                </span>
              </el-form-item>
              <el-form-item label="默认目录 ID">
                <el-input v-model="folderIdQuark" placeholder="留空为根目录（0）" class="full-input" />
              </el-form-item>
              <el-form-item label="分类目录">
                <div class="folder-chips">
                  <div class="chip-row">
                    <span class="chip-label">电影</span>
                    <el-input v-model="quarkFolders.movie" placeholder="目录 ID" size="small" style="width:200px" />
                    <el-button size="small" @click="openFolderPicker('quark', 'movie')">浏览</el-button>
                  </div>
                  <div class="chip-row">
                    <span class="chip-label">剧集</span>
                    <el-input v-model="quarkFolders.tv" placeholder="目录 ID" size="small" style="width:200px" />
                    <el-button size="small" @click="openFolderPicker('quark', 'tv')">浏览</el-button>
                  </div>
                  <div class="chip-row">
                    <span class="chip-label">默认</span>
                    <el-input v-model="quarkFolders.default" placeholder="未匹配时使用" size="small" style="width:200px" />
                    <el-button size="small" @click="openFolderPicker('quark', 'default')">浏览</el-button>
                  </div>
                </div>
              </el-form-item>
            </el-form>
          </div>

          <!-- 115网盘 -->
          <div class="section-card">
            <div class="section-title">115 网盘</div>
            <p class="section-desc">可选。配置后转存时可在电影和剧集间切换目标网盘。</p>
            <el-form label-width="110px" class="form">
              <el-form-item label="115 Cookie">
                <el-input
                  v-model="cookie115"
                  type="password"
                  show-password
                  placeholder="登录 115.com → F12 → 复制请求头 Cookie"
                  class="full-input"
                />
                <span v-if="info?.cookie_115_masked" class="field-hint ok">
                  ✓ 已配置：{{ info.cookie_115_masked }}
                </span>
              </el-form-item>
              <el-form-item label="默认目录 ID">
                <el-input v-model="folderId115" placeholder="留空为根目录（0）" class="full-input" />
              </el-form-item>
              <el-form-item label="分类目录">
                <div class="folder-chips">
                  <div class="chip-row">
                    <span class="chip-label">电影</span>
                    <el-input v-model="folders115.movie" placeholder="目录 ID" size="small" style="width:200px" />
                    <el-button size="small" @click="openFolderPicker('115', 'movie')">浏览</el-button>
                  </div>
                  <div class="chip-row">
                    <span class="chip-label">剧集</span>
                    <el-input v-model="folders115.tv" placeholder="目录 ID" size="small" style="width:200px" />
                    <el-button size="small" @click="openFolderPicker('115', 'tv')">浏览</el-button>
                  </div>
                </div>
              </el-form-item>
            </el-form>
          </div>

          <el-button type="primary" :loading="saving" @click="saveAll">保存网盘配置</el-button>
        </div>
      </el-tab-pane>

      <!-- ========== Tab 3: 通知 ========== -->
      <el-tab-pane name="notify">
        <template #label>
          <span class="tab-label"><span class="tab-icon">🔔</span> 通知</span>
        </template>

        <div class="tab-content">
          <!-- Telegram -->
          <div class="section-card">
            <div class="section-title">Telegram 通知</div>
            <el-form label-width="130px" class="form">
              <el-form-item label="Bot Token">
                <el-input
                  v-model="telegramToken"
                  type="password"
                  show-password
                  placeholder="从 @BotFather 获取"
                  class="full-input"
                />
                <span v-if="info?.telegram_bot_token_masked" class="field-hint ok">
                  ✓ {{ info.telegram_bot_token_masked }}
                </span>
              </el-form-item>
              <el-form-item label="接收人 Chat ID">
                <el-input
                  v-model="telegramChatIds"
                  placeholder="向 @userinfobot 发消息可查，多个逗号分隔"
                  class="full-input"
                />
              </el-form-item>
            </el-form>
          </div>

          <!-- Discord -->
          <div class="section-card">
            <div class="section-title">Discord Webhook</div>
            <el-form label-width="130px" class="form">
              <el-form-item label="Webhook URL">
                <el-input
                  v-model="discordWebhooks"
                  placeholder="频道设置 → 集成 → Webhook → 复制 URL"
                  class="full-input"
                />
              </el-form-item>
            </el-form>
          </div>

          <!-- SmartStrm -->
          <div class="section-card">
            <div class="section-title">🤖 SmartStrm STRM 生成</div>
            <p class="section-desc">
              转存成功后自动通知 SmartStrm 刷新指定任务，自动生成 STRM 文件供飞牛影视播放。
            </p>
            <el-form label-width="130px" class="form">
              <el-form-item label="Webhook 地址">
                <el-input
                  v-model="smartstrmWebhookUrl"
                  placeholder="http://10.0.0.191:8024/webhook/xxxxx"
                  class="full-input"
                />
              </el-form-item>
              <el-form-item label="存储映射">
                <el-input
                  v-model="smartstrmMapping"
                  type="textarea"
                  :rows="2"
                  placeholder='留空自动匹配，或填写 {"movie":"my_quark","tv":"my_quark"}'
                  class="full-input"
                />
                <span class="field-hint">
                  留空时按任务名（movie / tv / anime）自动匹配；仅在存储名不一致时填写
                </span>
              </el-form-item>
              <el-form-item label=" ">
                <el-button :loading="testingSmartstrm" @click="testSmartstrm">测试触发</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 盘搜 -->
          <div class="section-card">
            <div class="section-title">🔍 盘搜（Pansou）</div>
            <p class="section-desc">
              详情页「搜盘」按钮依赖此服务。需自部署
              <el-link type="primary" href="https://github.com/fish2018/pansou" target="_blank" :underline="false">fish2018/pansou</el-link>
              并填写实例地址。
            </p>
            <el-form label-width="130px" class="form">
              <el-form-item label="Pansou 地址">
                <el-input
                  v-model="pansouUrl"
                  placeholder="http://你的-pansou地址:port"
                  class="full-input"
                />
                <span v-if="info?.pansou_url" class="field-hint">
                  当前：{{ info.pansou_url }}
                </span>
              </el-form-item>
            </el-form>
          </div>

          <el-button type="primary" :loading="saving" @click="saveAll">保存通知配置</el-button>
          <el-button :loading="testingNotify" @click="testNotify">发送测试消息</el-button>
        </div>
      </el-tab-pane>

      <!-- ========== Tab 4: 工具 ========== -->
      <el-tab-pane name="tools">
        <template #label>
          <span class="tab-label"><span class="tab-icon">🛠</span> 工具</span>
        </template>

        <div class="tab-content">
          <!-- 手动转存 -->
          <div class="section-card">
            <div class="section-title">☁️ 手动转存</div>
            <p class="section-desc">
              从外部拿到网盘分享链接（不是从详情页搜出来的）时，在这里直接转存。
            </p>
            <el-button type="primary" plain @click="goTransfer">
              打开转存页 →
            </el-button>
          </div>

          <!-- 修改密码 -->
          <div class="section-card">
            <div class="section-title">🔑 修改登录密码</div>
            <el-form label-width="100px" class="form">
              <el-form-item label="旧密码">
                <el-input v-model="pwdForm.oldPassword" type="password" show-password placeholder="当前密码" class="half-input" />
              </el-form-item>
              <el-form-item label="新密码">
                <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="至少 6 位" class="half-input" />
              </el-form-item>
              <el-form-item label="确认密码">
                <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="再输一次" class="half-input" />
              </el-form-item>
              <el-form-item label=" ">
                <el-button type="primary" :loading="changingPwd" @click="changePassword">修改密码</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 关于 -->
          <div class="section-card about">
            <div class="about-logo">
              <img src="/logo.svg" alt="QuarkCine" class="about-logo-img" />
            </div>
            <div class="about-info">
              <div class="about-name">QuarkCine</div>
              <div class="about-desc">影视发现 · 一键转存 · STRM 生成</div>
              <div class="about-meta">
                基于 <el-link type="primary" href="https://www.themoviedb.org" target="_blank" :underline="false">TMDB</el-link>
                数据 · 支持夸克 / 115 · SmartStrm 集成
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 目录选择器弹窗 -->
    <el-dialog v-model="folderPickerVisible" title="选择目录" width="580px">
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
          <el-icon size="18"><Folder /></el-icon>
          <span class="folder-name">{{ folder.name }}</span>
        </div>
        <el-empty v-if="!folderLoading && folderList.length === 0" description="此目录为空" />
      </div>

      <template #footer>
        <el-button @click="folderPickerVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!selectedFolder" @click="confirmFolderSelection">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Folder } from '@element-plus/icons-vue';
import { authApi, settingsApi, smartstrmApi } from '@/api/tmdb';
import { useUserStore } from '@/stores/user';
import type { SettingsInfo } from '@/types';

const activeTab = ref('source');
const apiKey = ref('');
const info = ref<SettingsInfo | null>(null);
const saving = ref(false);
const testing = ref(false);
const testingNotify = ref(false);
const testingSmartstrm = ref(false);
const tmdbLanguage = ref('zh-CN');

// 网盘
const cookieQuark = ref('');
const folderIdQuark = ref('');
const cookie115 = ref('');
const folderId115 = ref('');

// 分类目录
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

// 盘搜 & SmartStrm
const pansouUrl = ref('');
const smartstrmWebhookUrl = ref('');
const smartstrmMapping = ref('');

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
  apiKey.value = '';
  folderIdQuark.value = info.value.folder_id_quark || '';
  folderId115.value = info.value.folder_id_115 || '';
  tmdbLanguage.value = info.value.language || 'zh-CN';

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
  pansouUrl.value = info.value.pansou_url || '';
  smartstrmWebhookUrl.value = info.value.smartstrm_webhook_url || '';
  smartstrmMapping.value = info.value.smartstrm_storage_mapping || '';
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
      quark_folders: JSON.stringify(quarkFolders.value),
      '115_folders': JSON.stringify(folders115.value),
      telegram_bot_token: telegramToken.value.trim(),
      telegram_chat_ids: telegramChatIds.value.trim(),
      discord_webhook_urls: discordWebhooks.value.trim(),
      pansou_url: pansouUrl.value.trim(),
      smartstrm_webhook_url: smartstrmWebhookUrl.value.trim(),
      smartstrm_storage_mapping: smartstrmMapping.value.trim(),
    });
    ElMessage.success('配置已保存');
    await load();
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
    if (res.valid) ElMessage.success(res.message);
    else ElMessage.error(res.message);
  } finally {
    testing.value = false;
  }
}

async function testNotify() {
  testingNotify.value = true;
  try {
    const res = await settingsApi.testNotify();
    if (res.ok) ElMessage.success(res.message);
    else ElMessage.error(res.message);
  } finally {
    testingNotify.value = false;
  }
}

async function testSmartstrm() {
  testingSmartstrm.value = true;
  try {
    const res = await smartstrmApi.notify(undefined, 'movie');
    if (res.success) ElMessage.success(res.message);
    else ElMessage.error(res.message);
  } finally {
    testingSmartstrm.value = false;
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
/* === 页面布局 === */
.settings {
  padding: 0;
  min-height: 100%;
}

/* 顶部栏 */
.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
}
.header-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.page-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
}
.page-subtitle {
  color: #8b93a1;
  font-size: 13px;
}

/* 状态徽章 */
.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}
.status-badge.ok {
  background: rgba(64, 158, 255, 0.12);
  color: #409eff;
  border: 1px solid rgba(64, 158, 255, 0.3);
}
.status-badge.warn {
  background: rgba(230, 162, 60, 0.12);
  color: #e6a23c;
  border: 1px solid rgba(230, 162, 60, 0.3);
}
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

/* 警告 */
.top-alert {
  margin: 16px 24px 0;
}

/* === Tabs === */
.settings-tabs {
  margin-top: 16px;
  padding: 0 24px 24px;
}

.settings-tabs :deep(.el-tabs__header) {
  min-width: 160px;
}

.settings-tabs :deep(.el-tabs__content) {
  padding-left: 24px;
  border-left: 1px solid #262c37;
  margin-left: 0;
  min-height: 600px;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}
.tab-icon {
  font-size: 16px;
}

/* === Tab 内容 === */
.tab-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 40px;
}

/* 区块卡片 */
.section-card {
  background: #171b23;
  border: 1px solid #262c37;
  border-radius: 10px;
  padding: 20px 24px;
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 6px;
}
.section-desc {
  color: #8b93a1;
  font-size: 13px;
  margin: 0 0 16px;
  line-height: 1.6;
}

/* 表单 */
.form {
  max-width: 680px;
}
.full-input {
  max-width: 480px;
}
.half-input {
  max-width: 260px;
}
.field-hint {
  display: block;
  font-size: 12px;
  color: #8b93a1;
  margin-top: 4px;
}
.field-hint.ok {
  color: #67c23a;
}

/* 分类目录行 */
.folder-chips {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.chip-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.chip-label {
  width: 40px;
  font-size: 13px;
  color: #8b93a1;
  flex-shrink: 0;
}

/* 信息表格 */
.info-table {
  margin-top: 0;
}

/* 教程 */
.howto-list {
  padding-left: 20px;
  color: #c8cdd6;
  font-size: 13px;
  line-height: 2.2;
  margin: 0 0 10px;
}
.howto-note {
  color: #8b93a1;
  font-size: 12px;
  line-height: 1.7;
  margin: 0;
}
.howto-note code {
  background: #232936;
  padding: 1px 5px;
  border-radius: 3px;
  color: #f0b429;
}

/* 关于卡片 */
.about {
  display: flex;
  align-items: center;
  gap: 20px;
}
.about-logo-img {
  width: 56px;
  height: 56px;
  border-radius: 12px;
}
.about-name {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
}
.about-desc {
  color: #c8cdd6;
  font-size: 13px;
  margin-bottom: 4px;
}
.about-meta {
  color: #8b93a1;
  font-size: 12px;
}

/* 目录选择器 */
.breadcrumb {
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #1a1f28;
  border-radius: 4px;
}
.breadcrumb-item {
  cursor: pointer;
  font-size: 13px;
}
.breadcrumb-item:hover {
  color: #409eff;
}
.folder-list {
  min-height: 260px;
  max-height: 360px;
  overflow-y: auto;
  border: 1px solid #262c37;
  border-radius: 6px;
  padding: 8px;
}
.folder-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
  font-size: 13px;
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
