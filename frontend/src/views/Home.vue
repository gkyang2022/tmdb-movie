<template>
  <div class="home">
    <!-- Hero 区 -->
    <div v-if="heroItem" class="hero" :style="{ backgroundImage: `url(${heroItem.backdrop})` }">
      <div class="hero-overlay" />
      <div class="hero-content">
        <h1 class="hero-title">{{ heroItem.title }}</h1>
        <div class="hero-meta">
          <span class="hero-rating">⭐ {{ heroItem.rating.toFixed(1) }}</span>
          <span class="hero-year">{{ heroItem.year }}</span>
          <span class="hero-type">{{ heroItem.type === 'movie' ? '电影' : '剧集' }}</span>
        </div>
        <p class="hero-overview">{{ heroItem.overview || '暂无简介' }}</p>
        <div class="hero-actions">
          <el-button type="primary" size="large" @click="goHeroDetail">查看详情</el-button>
        </div>
      </div>
    </div>

    <!-- Trending 分区 -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">🔥 本周趋势</h2>
        <el-tabs v-model="trendType" class="section-tabs" @tab-change="loadTrending(1)">
          <el-tab-pane label="全部" name="all" />
          <el-tab-pane label="电影" name="movie" />
          <el-tab-pane label="剧集" name="tv" />
        </el-tabs>
      </div>
      <div v-loading="loading" class="scroll-row">
        <MediaCard v-for="item in items" :key="item.id" :item="item" class="scroll-card" />
      </div>
      <div v-if="totalPages > 1" class="pager">
        <el-pagination
          layout="prev, pager, next"
          :total="totalResults"
          :page-size="20"
          :current-page="page"
          @current-change="loadTrending"
        />
      </div>
    </section>

    <!-- Popular 分区 -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">📈 热门推荐</h2>
      </div>
      <div v-loading="popularLoading" class="scroll-row">
        <MediaCard v-for="item in popularItems" :key="'p' + item.id" :item="item" class="scroll-card" />
      </div>
    </section>

    <!-- NowPlaying 分区 -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">🎬 正在热映</h2>
      </div>
      <div v-loading="nowLoading" class="scroll-row">
        <MediaCard v-for="item in nowItems" :key="'n' + item.id" :item="item" class="scroll-card" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { tmdbApi } from '@/api/tmdb';
import type { MediaItem } from '@/types';
import MediaCard from './components/MediaCard.vue';

const router = useRouter();
const trendType = ref<'all' | 'movie' | 'tv'>('all');
const items = ref<MediaItem[]>([]);
const popularItems = ref<MediaItem[]>([]);
const nowItems = ref<MediaItem[]>([]);
const page = ref(1);
const totalPages = ref(1);
const totalResults = ref(0);
const loading = ref(false);
const popularLoading = ref(false);
const nowLoading = ref(false);

const heroItem = computed(() => items.value[0] || null);

function goHeroDetail() {
  if (heroItem.value) {
    router.push(`/detail/${heroItem.value.type}/${heroItem.value.id}`);
  }
}

async function loadTrending(p = 1) {
  loading.value = true;
  try {
    const res = await tmdbApi.trending(trendType.value, p);
    items.value = res.items;
    page.value = res.page;
    totalPages.value = res.totalPages;
    totalResults.value = res.totalResults;
  } finally {
    loading.value = false;
  }
}

async function loadPopular() {
  popularLoading.value = true;
  try {
    const res = await tmdbApi.popular('movie', 1);
    popularItems.value = res.items.slice(0, 20);
  } finally {
    popularLoading.value = false;
  }
}

async function loadNowPlaying() {
  nowLoading.value = true;
  try {
    const res = await tmdbApi.nowPlaying(1);
    nowItems.value = res.items.slice(0, 20);
  } finally {
    nowLoading.value = false;
  }
}

onMounted(() => {
  loadTrending(1);
  loadPopular();
  loadNowPlaying();
});
</script>

<style scoped>
.home {
  margin: -16px -20px 0;
}

/* Hero 区 */
.hero {
  position: relative;
  height: 480px;
  background-size: cover;
  background-position: center top;
  margin-bottom: 32px;
}
.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, rgba(20, 24, 31, 0.95) 0%, rgba(20, 24, 31, 0.7) 40%, rgba(20, 24, 31, 0.3) 70%, transparent 100%);
}
.hero-content {
  position: absolute;
  left: 24px;
  bottom: 48px;
  max-width: 560px;
  padding-right: 24px;
}
.hero-title {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 12px;
  line-height: 1.2;
}
.hero-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 14px;
}
.hero-rating {
  color: #f59e0b;
  font-weight: 600;
}
.hero-year {
  color: #9ca3af;
}
.hero-type {
  padding: 2px 8px;
  background: rgba(59, 130, 246, 0.85);
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
}
.hero-overview {
  font-size: 14px;
  line-height: 1.6;
  color: #d1d5db;
  margin-bottom: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.hero-actions {
  display: flex;
  gap: 12px;
}

/* 分区 */
.section {
  margin-bottom: 32px;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  margin-bottom: 16px;
}
.section-title {
  font-size: 20px;
  font-weight: 600;
}
.section-tabs {
  margin: 0;
}
.section-tabs :deep(.el-tabs__item) {
  color: #9aa3b2;
  font-size: 13px;
}
.section-tabs :deep(.el-tabs__item.is-active) {
  color: #fff;
}
.section-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

/* 横向滚动 */
.scroll-row {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding: 0 20px 16px;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: #3a4253 #171b23;
}
.scroll-row::-webkit-scrollbar {
  height: 6px;
}
.scroll-row::-webkit-scrollbar-track {
  background: #171b23;
  border-radius: 3px;
}
.scroll-row::-webkit-scrollbar-thumb {
  background: #3a4253;
  border-radius: 3px;
}
.scroll-card {
  flex: 0 0 auto;
  width: 160px;
}

/* 分页 */
.pager {
  display: flex;
  justify-content: center;
  padding: 0 20px 16px;
}

/* 响应式 */
@media (max-width: 768px) {
  .hero {
    height: 360px;
  }
  .hero-title {
    font-size: 28px;
  }
  .hero-content {
    left: 16px;
    bottom: 32px;
    max-width: calc(100% - 32px);
  }
  .scroll-card {
    width: 140px;
  }
}
</style>
