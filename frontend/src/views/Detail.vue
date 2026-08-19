<template>
  <div v-loading="loading" class="detail">
    <template v-if="detail">
      <div class="backdrop" :style="backdropStyle" />

      <div class="detail-main">
        <el-image v-if="detail.poster" :src="detail.poster" fit="cover" class="big-poster">
          <template #error>
            <div class="poster-ph">无海报</div>
          </template>
        </el-image>
        <div v-else class="big-poster poster-ph">无海报</div>

        <div class="detail-info">
          <h1 class="title">{{ detail.title }}</h1>
          <div v-if="detail.original_title && detail.original_title !== detail.title" class="original">
            {{ detail.original_title }}
          </div>

          <div class="badges">
            <el-tag type="warning" effect="dark" class="score">
              ⭐ {{ detail.rating.toFixed(1) }} <span class="votes">({{ detail.rating_count }} 人)</span>
            </el-tag>
            <el-tag v-for="g in detail.genres" :key="g" effect="plain" class="genre">{{ g }}</el-tag>
          </div>

          <div class="facts">
            <span v-if="detail.year">{{ detail.year }}</span>
            <span v-if="detail.status">{{ detail.status }}</span>
            <span v-if="detail.runtime">{{ detail.runtime }} 分钟</span>
            <span v-if="detail.countries?.length">{{ detail.countries.join(' / ') }}</span>
            <span v-if="detail.languages?.length">{{ detail.languages.join(' / ') }}</span>
          </div>

          <div v-if="detail.tagline" class="tagline">「{{ detail.tagline }}」</div>
          <p v-if="detail.overview" class="overview">{{ detail.overview }}</p>
          <div v-else class="overview muted">暂无简介</div>

          <div v-if="detail.directors.length" class="crew">
            <span class="crew-label">导演：</span>
            <span class="crew-names">{{ detail.directors.join('、') }}</span>
          </div>

          <div class="actions">
            <el-button type="primary" @click="openTmdb">在 TMDB 查看</el-button>
            <el-button type="warning" :loading="pansouLoading" @click="searchPansou">
              🔍 搜盘
            </el-button>
          </div>
        </div>
      </div>

      <!-- 预告片 -->
      <div v-if="detail.videos.length" class="section">
        <h2>🎬 预告片</h2>
        <div class="video-grid">
          <div v-for="v in detail.videos" :key="v.key" class="video-card">
            <iframe
              :src="`https://www.youtube.com/embed/${v.key}`"
              frameborder="0"
              allowfullscreen
              class="video-frame"
            />
            <div class="video-name">{{ v.name }}</div>
          </div>
        </div>
      </div>

      <!-- 演员 -->
      <div v-if="detail.cast.length" class="section">
        <h2>🎭 演员</h2>
        <div class="cast-scroll">
          <div v-for="c in detail.cast" :key="c.name" class="cast-item">
            <el-avatar :size="64" :src="c.profile || undefined" class="cast-avatar">
              {{ c.name.slice(0, 1) }}
            </el-avatar>
            <div class="cast-name">{{ c.name }}</div>
            <div class="cast-char">{{ c.character }}</div>
          </div>
        </div>
      </div>

      <!-- 推荐 -->
      <div v-if="detail.recommendations.length" class="section">
        <h2>📺 相似推荐</h2>
        <div class="grid">
          <MediaCard v-for="item in detail.recommendations" :key="item.id" :item="item" />
        </div>
      </div>
    </template>

    <!-- 盘搜结果弹窗 -->
    <el-dialog v-model="pansouVisible" title="🔍 网盘搜索结果" width="680px" top="8vh">
      <div v-if="pansouLoading" v-loading="true" class="pansou-loading">搜索中…</div>
      <template v-else>
        <el-alert
          v-if="pansouError"
          :type="pansouError.includes('未配置') ? 'warning' : 'error'"
          :closable="false"
          :title="pansouError"
          class="pansou-alert"
        />
        <el-empty v-else-if="!pansouItems.length" description="没有搜到相关网盘资源" />
        <div v-else class="pansou-list">
          <div v-for="(item, idx) in pansouItems" :key="idx" class="pansou-item">
            <div class="pansou-item-main">
              <el-tag size="small" :type="pansouTagType(item.type)" effect="dark" class="pansou-type">
                {{ pansouTypeName(item.type) }}
              </el-tag>
              <span class="pansou-name" :title="item.name">{{ item.name }}</span>
            </div>
            <div class="pansou-meta">
              <span v-if="item.size && item.size !== '未知'">📦 {{ item.size }}</span>
              <span v-if="item.source && item.source !== '未知'">🗂 {{ item.source }}</span>
              <span v-if="item.time">🕒 {{ item.time }}</span>
              <el-button
                v-if="item.url"
                type="primary"
                link
                size="small"
                @click="openPansou(item.url)"
              >
                打开
              </el-button>
              <el-button
                v-if="item.url"
                type="success"
                link
                size="small"
                :loading="pansouBusy[idx]"
                :disabled="!!pansouDone[idx]"
                @click="transferPansou(idx, item)"
              >
                {{ pansouDone[idx] ? '✓ 已转存' : '转存' }}
              </el-button>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <el-button @click="pansouVisible = false">关闭</el-button>
        <el-button v-if="pansouItems.length" @click="searchPansou(true)">刷新结果</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { tmdbApi, pansouApi, transferApi } from '@/api/tmdb';
import type { MediaDetail, SearchResource } from '@/types';
import MediaCard from './components/MediaCard.vue';

const route = useRoute();
const detail = ref<MediaDetail | null>(null);
const loading = ref(false);

const backdropStyle = computed(() => {
  if (!detail.value?.backdrop) return {};
  return {
    backgroundImage: `linear-gradient(rgba(15,17,21,0.75), #0f1115), url(${detail.value.backdrop})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center 20%',
  };
});

async function load() {
  loading.value = true;
  try {
    const type = route.params.type as 'movie' | 'tv';
    const id = route.params.id as string;
    detail.value = await tmdbApi.detail(type, id);
  } finally {
    loading.value = false;
  }
}

function openTmdb() {
  if (detail.value) window.open(detail.value.url, '_blank');
}

// ---------------- 盘搜 ----------------
const pansouVisible = ref(false);
const pansouLoading = ref(false);
const pansouItems = ref<SearchResource[]>([]);
const pansouError = ref('');

function pansouKeyword(): string {
  return (detail.value?.title || detail.value?.original_title || '').trim();
}

function pansouTagType(type: string): 'warning' | 'primary' | 'info' {
  if (type === '115') return 'warning';
  if (type === 'quark') return 'primary';
  return 'info';
}

function pansouTypeName(type: string): string {
  if (type === '115') return '115';
  if (type === 'quark') return '夸克';
  return (type || '网盘').toUpperCase();
}

function openPansou(url: string) {
  if (url) window.open(url, '_blank');
}

// ---------------- 盘搜结果直接转存 ----------------
const pansouBusy = ref<Record<number, boolean>>({});
const pansouDone = ref<Record<number, boolean>>({});

async function transferPansou(idx: number, item: SearchResource) {
  if (pansouDone.value[idx] || pansouBusy.value[idx]) return;
  const type: 'quark' | '115' = item.type === '115' ? '115' : 'quark';
  const contentType = detail.value?.type; // 'movie' 或 'tv'
  pansouBusy.value[idx] = true;
  try {
    const res = await transferApi.save(item.url, type, contentType);
    if (res.ok) {
      pansouDone.value[idx] = true;
      ElMessage.success(res.message ? `转存成功：${res.message}` : '转存成功');
    } else {
      ElMessage.error(res.error || '转存失败');
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '转存请求失败');
  } finally {
    pansouBusy.value[idx] = false;
  }
}

async function searchPansou(refresh = false) {
  const keyword = pansouKeyword();
  if (!keyword) {
    ElMessage.warning('没有可用的搜索关键词');
    return;
  }
  pansouVisible.value = true;
  pansouLoading.value = true;
  pansouItems.value = [];
  pansouError.value = '';
  try {
    const res = await pansouApi.search(keyword, refresh);
    if (res.ok) {
      pansouItems.value = res.items || [];
    } else {
      pansouError.value = res.error || '盘搜失败';
    }
  } catch (e: any) {
    pansouError.value = e?.message || '盘搜请求失败';
  } finally {
    pansouLoading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.detail {
  position: relative;
  min-height: 400px;
}
.backdrop {
  position: absolute;
  inset: -20px -24px 0;
  height: 420px;
  z-index: 0;
  pointer-events: none;
}
.detail-main {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 24px;
  padding-top: 40px;
}
.big-poster {
  width: 240px;
  height: 360px;
  border-radius: 12px;
  flex-shrink: 0;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6);
  background: #1a1e26;
}
.poster-ph {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5c6472;
  font-size: 13px;
}
.detail-info {
  flex: 1;
  min-width: 0;
}
.title {
  font-size: 28px;
  font-weight: 800;
}
.original {
  color: #8b93a1;
  font-size: 14px;
  margin: 4px 0 10px;
}
.badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.score {
  font-size: 14px;
}
.votes {
  font-size: 11px;
  opacity: 0.8;
}
.facts {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  color: #9aa3b2;
  font-size: 13px;
  margin-bottom: 12px;
}
.tagline {
  font-style: italic;
  color: #c9a86a;
  margin-bottom: 10px;
}
.overview {
  font-size: 14px;
  line-height: 1.7;
  color: #c8cdd6;
  max-width: 720px;
}
.overview.muted {
  color: #6b7280;
}
.crew {
  margin-top: 12px;
  font-size: 13px;
}
.crew-label {
  color: #8b93a1;
}
.crew-names {
  color: #c8cdd6;
}
.actions {
  margin-top: 18px;
}
.pansou-loading {
  text-align: center;
  padding: 40px;
  color: #9aa3b2;
}
.pansou-alert {
  margin-bottom: 12px;
}
.pansou-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 60vh;
  overflow-y: auto;
}
.pansou-item {
  background: #171b23;
  border: 1px solid #262c37;
  border-radius: 8px;
  padding: 10px 12px;
}
.pansou-item-main {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pansou-type {
  flex-shrink: 0;
}
.pansou-name {
  font-size: 13px;
  color: #c8cdd6;
  word-break: break-all;
}
.pansou-meta {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #8b93a1;
}
.section {
  margin-top: 40px;
  position: relative;
  z-index: 1;
}
.section h2 {
  font-size: 19px;
  margin-bottom: 14px;
}
.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}
.video-card {
  background: #171b23;
  border-radius: 10px;
  overflow: hidden;
}
.video-frame {
  width: 100%;
  aspect-ratio: 16 / 9;
}
.video-name {
  padding: 8px 12px;
  font-size: 12px;
  color: #9aa3b2;
}
.cast-scroll {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
}
.cast-item {
  text-align: center;
  width: 80px;
  flex-shrink: 0;
}
.cast-avatar {
  background: #232936;
}
.cast-name {
  font-size: 12px;
  margin-top: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cast-char {
  font-size: 11px;
  color: #8b93a1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}
</style>
