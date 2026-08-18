<template>
  <div class="home">
    <div class="hero">
      <h1>本周趋势 <span class="hero-sub">Trending</span></h1>
    </div>

    <el-tabs v-model="trendType" class="tabs" @tab-change="loadTrending(1)">
      <el-tab-pane label="全部" name="all" />
      <el-tab-pane label="电影" name="movie" />
      <el-tab-pane label="剧集" name="tv" />
    </el-tabs>

    <div v-loading="loading" class="grid">
      <MediaCard v-for="item in items" :key="item.id" :item="item" />
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

    <div class="section-title">
      <h2>🔥 正在热映</h2>
    </div>
    <div v-loading="nowLoading" class="grid">
      <MediaCard v-for="item in nowItems" :key="'n' + item.id" :item="item" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { tmdbApi } from '@/api/tmdb';
import type { MediaItem } from '@/types';
import MediaCard from './components/MediaCard.vue';

const trendType = ref<'all' | 'movie' | 'tv'>('all');
const items = ref<MediaItem[]>([]);
const nowItems = ref<MediaItem[]>([]);
const page = ref(1);
const totalPages = ref(1);
const totalResults = ref(0);
const loading = ref(false);
const nowLoading = ref(false);

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

async function loadNowPlaying() {
  nowLoading.value = true;
  try {
    const res = await tmdbApi.nowPlaying(1);
    nowItems.value = res.items.slice(0, 10);
  } finally {
    nowLoading.value = false;
  }
}

onMounted(() => {
  loadTrending(1);
  loadNowPlaying();
});
</script>

<style scoped>
.hero h1 {
  font-size: 24px;
  margin-bottom: 4px;
}
.hero-sub {
  font-size: 13px;
  color: #8b93a1;
  font-weight: 400;
}
.tabs {
  margin: 8px 0;
}
.tabs :deep(.el-tabs__item) {
  color: #9aa3b2;
}
.tabs :deep(.el-tabs__item.is-active) {
  color: #fff;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
  min-height: 120px;
}
.pager {
  display: flex;
  justify-content: center;
  margin: 24px 0;
}
.section-title {
  margin: 32px 0 16px;
}
.section-title h2 {
  font-size: 19px;
}
</style>
