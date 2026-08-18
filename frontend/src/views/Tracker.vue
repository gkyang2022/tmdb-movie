<template>
  <div class="tracker">
    <div class="header-row">
      <h1 class="page-title">📺 追剧提醒</h1>
      <div>
        <el-button type="primary" @click="openCreate('share')">＋ 追踪分享链接</el-button>
        <el-button @click="openCreate('tmdb')">＋ 订阅 TMDB 剧集</el-button>
      </div>
    </div>

    <el-alert
      type="info"
      show-icon
      :closable="false"
      title="说明"
      description="分享链接追踪：定期检查夸克分享，发现新文件自动转存到你的网盘并发送通知；TMDB 订阅：剧集更新（新集/新季）时发送通知。检查间隔最小 10 分钟。"
      class="alert"
    />

    <el-card class="card" shadow="never">
      <el-table :data="tasks" v-loading="loading" empty-text="暂无追剧任务" class="table">
        <el-table-column label="任务" min-width="200">
          <template #default="{ row }">
            <div class="task-name">
              <el-icon v-if="row.type === 'tmdb'" class="task-icon"><Film /></el-icon>
              <el-icon v-else class="task-icon"><Link /></el-icon>
              <span>{{ row.name }}</span>
            </div>
            <div class="task-sub">
              {{ row.type === 'tmdb' ? `TMDB #${row.tmdbId}` : row.shareUrl }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="row.type === 'tmdb' ? 'primary' : 'warning'" effect="plain">
              {{ row.type === 'tmdb' ? '剧集订阅' : '分享追踪' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="间隔" width="110">
          <template #default="{ row }">
            {{ row.intervalValue }}{{ unitLabel(row.intervalUnit) }}
          </template>
        </el-table-column>
        <el-table-column label="上次运行" width="170">
          <template #default="{ row }">
            <span v-if="row.lastRunAt">{{ row.lastRunAt }}</span>
            <span v-else class="dim">从未运行</span>
            <div v-if="row.lastRunMessage" class="run-msg">
              <el-tag size="small" :type="statusTagType(row.lastRunStatus)" effect="plain">
                {{ row.lastRunMessage }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '运行中' : '已暂停' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="runNow(row)">立即运行</el-button>
            <el-button link :type="row.status === 'active' ? 'warning' : 'success'" size="small" @click="toggle(row)">
              {{ row.status === 'active' ? '暂停' : '恢复' }}
            </el-button>
            <el-popconfirm title="确认删除该任务？" @confirm="remove(row)">
              <template #reference>
                <el-button link type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新建任务对话框 -->
    <el-dialog v-model="dialogVisible" :title="createMode === 'tmdb' ? '订阅 TMDB 剧集' : '追踪分享链接'" width="520px">
      <el-form label-width="110px" v-if="createMode === 'share'">
        <el-form-item label="分享链接" required>
          <el-input
            v-model="form.shareUrl"
            type="textarea"
            :rows="2"
            placeholder="https://pan.quark.cn/s/xxxx（仅支持夸克）"
          />
        </el-form-item>
        <el-form-item label="任务名称">
          <el-input v-model="form.name" placeholder="留空自动生成（quark-分享码）" />
        </el-form-item>
        <el-form-item label="目标目录 ID">
          <el-input v-model="form.targetFolderId" placeholder="留空为网盘根目录（0）" />
        </el-form-item>
        <el-form-item label="检查间隔">
          <el-input-number v-model="form.intervalValue" :min="1" :max="720" />
          <el-select v-model="form.intervalUnit" class="unit-select">
            <el-option label="分钟" value="minute" />
            <el-option label="小时" value="hour" />
            <el-option label="天" value="day" />
          </el-select>
        </el-form-item>
        <el-alert
          type="warning"
          :closable="false"
          title="首次创建会自动初始化快照，之后仅转存新增内容"
          class="dialog-tip"
        />
      </el-form>

      <el-form label-width="110px" v-else>
        <el-form-item label="剧集名称" required>
          <el-input
            v-model="form.tmdbName"
            placeholder="输入剧名，从 TMDB 搜索选择（如：星际穿越的剧版、怪奇物语）"
            @input="debouncedSearch"
          />
        </el-form-item>
        <div v-if="searchResults.length" class="search-results">
          <div
            v-for="item in searchResults"
            :key="item.id"
            class="search-item"
            :class="{ selected: form.tmdbId !== '' && String(form.tmdbId) === item.id }"
            @click="selectTv(item)"
          >
            <img :src="item.poster" class="search-poster" />
            <div class="search-info">
              <div class="search-title">{{ item.title }}（{{ item.year || '—' }}）</div>
              <div class="search-overview">{{ item.overview || '暂无简介' }}</div>
            </div>
          </div>
        </div>
        <el-form-item v-if="form.tmdbId" label="已选择">
          <el-tag type="primary" effect="plain">{{ selectedName }}</el-tag>
        </el-form-item>
        <el-form-item label="检查间隔">
          <el-input-number v-model="form.intervalValue" :min="1" :max="720" />
          <el-select v-model="form.intervalUnit" class="unit-select">
            <el-option label="分钟" value="minute" />
            <el-option label="小时" value="hour" />
            <el-option label="天" value="day" />
          </el-select>
        </el-form-item>
        <el-alert
          type="info"
          :closable="false"
          title="剧集更新（新集播出）时会通过已配置的通知渠道提醒你"
          class="dialog-tip"
        />
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="create">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Film, Link } from '@element-plus/icons-vue';
import { settingsApi, tmdbApi, trackerApi } from '@/api/tmdb';
import type { ListResponse, MediaItem, TrackerTask } from '@/types';

const tasks = ref<TrackerTask[]>([]);
const loading = ref(false);
const creating = ref(false);
const dialogVisible = ref(false);
const createMode = ref<'share' | 'tmdb'>('share');

const form = ref({
  shareUrl: '',
  name: '',
  targetFolderId: '',
  tmdbId: '' as number | '',
  tmdbName: '',
  intervalValue: 6,
  intervalUnit: 'hour' as 'minute' | 'hour' | 'day',
});

const searchResults = ref<MediaItem[]>([]);
const selectedName = ref('');

function unitLabel(unit: string) {
  return { minute: '分钟', hour: '小时', day: '天' }[unit] || '';
}

function statusTagType(s?: string) {
  if (s === 'success') return 'success';
  if (s === 'failed') return 'danger';
  return 'info';
}

async function load() {
  loading.value = true;
  try {
    tasks.value = await trackerApi.list();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || '加载任务失败');
  } finally {
    loading.value = false;
  }
}

function openCreate(mode: 'share' | 'tmdb') {
  createMode.value = mode;
  form.value = { shareUrl: '', name: '', targetFolderId: '', tmdbId: '', tmdbName: '', intervalValue: 6, intervalUnit: 'hour' };
  searchResults.value = [];
  selectedName.value = '';
  dialogVisible.value = true;
}

let searchTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(doSearch, 400);
}

async function doSearch() {
  const q = form.value.tmdbName.trim();
  if (!q || q.length < 1) {
    searchResults.value = [];
    return;
  }
  try {
    const res: ListResponse = await tmdbApi.search(q, 'tv', 1);
    searchResults.value = res.items.slice(0, 6);
  } catch {
    searchResults.value = [];
  }
}

function selectTv(item: MediaItem) {
  form.value.tmdbId = Number(item.id);
  form.value.tmdbName = item.title;
  selectedName.value = item.title;
  searchResults.value = [];
}

async function create() {
  const payload: Record<string, unknown> = {
    type: createMode.value,
    name: form.value.name,
    intervalValue: form.value.intervalValue,
    intervalUnit: form.value.intervalUnit,
  };
  if (createMode.value === 'share') {
    payload.shareUrl = form.value.shareUrl.trim();
    payload.targetFolderId = form.value.targetFolderId.trim() || '0';
  } else {
    if (!form.value.tmdbId) {
      ElMessage.warning('请先搜索并选择一部剧集');
      return;
    }
    payload.tmdbId = form.value.tmdbId;
  }
  creating.value = true;
  try {
    const res = await trackerApi.create(payload);
    if (res.ok) {
      ElMessage.success('任务已创建');
      dialogVisible.value = false;
      await load();
    } else {
      ElMessage.error(res.error || '创建失败');
    }
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || '创建失败');
  } finally {
    creating.value = false;
  }
}

async function runNow(row: TrackerTask) {
  try {
    await trackerApi.run(row.id);
    ElMessage.success('任务已启动，运行结果稍后刷新');
    setTimeout(load, 3000);
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || '启动失败');
  }
}

async function toggle(row: TrackerTask) {
  await trackerApi.update(row.id, { status: row.status === 'active' ? 'paused' : 'active' });
  ElMessage.success(row.status === 'active' ? '已暂停' : '已恢复');
  await load();
}

async function remove(row: TrackerTask) {
  await trackerApi.remove(row.id);
  ElMessage.success('已删除');
  await load();
}

onMounted(() => {
  load();
  // 确保设置页接口可用（登录态由 request 拦截器保证）
  settingsApi.get().catch(() => {});
});
</script>

<style scoped>
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.page-title {
  font-size: 24px;
  margin: 0;
}
.alert {
  margin-bottom: 16px;
}
.card {
  background: #171b23;
  border-color: #262c37;
}
.card :deep(.el-card__header) {
  border-bottom-color: #262c37;
}
.table :deep(.el-table__row) {
  background: #171b23;
}
.table :deep(.el-table tr) {
  background: #171b23;
}
.table :deep(.el-table th.el-table__cell) {
  background: #1c212b;
  color: #9aa3b2;
}
.task-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}
.task-icon {
  color: #2a5bd7;
}
.task-sub {
  color: #6b7280;
  font-size: 12px;
  margin-top: 2px;
  word-break: break-all;
}
.run-msg {
  margin-top: 4px;
}
.dim {
  color: #6b7280;
}
.unit-select {
  width: 100px;
  margin-left: 8px;
}
.dialog-tip {
  margin-top: 6px;
}
.search-results {
  margin: 0 0 12px 110px;
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid #262c37;
  border-radius: 8px;
}
.search-item {
  display: flex;
  gap: 10px;
  padding: 8px 10px;
  cursor: pointer;
  border-bottom: 1px solid #222834;
}
.search-item:hover {
  background: #1f2530;
}
.search-item.selected {
  background: #1a2440;
}
.search-poster {
  width: 40px;
  height: 56px;
  object-fit: cover;
  border-radius: 4px;
  background: #262c37;
}
.search-title {
  font-size: 13px;
  font-weight: 600;
}
.search-overview {
  font-size: 12px;
  color: #8b93a1;
  margin-top: 2px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
