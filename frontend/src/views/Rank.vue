<template>
  <div class="rank">
    <div class="hero">
      <h1>🏆 排行榜</h1>
    </div>

    <el-radio-group v-model="mediaType" class="type-switch" @change="load(1)">
      <el-radio-button value="movie">电影 Top</el-radio-button>
      <el-radio-button value="tv">剧集 Top</el-radio-button>
    </el-radio-group>

    <div v-loading="loading" class="list">
      <div v-for="(item, idx) in items" :key="item.id" class="rank-row" @click="goDetail(item)">
        <span class="rank-num" :class="{ top1: idx === 0, top2: idx === 1, top3: idx === 2 }">{{ idx + 1 }}</span>
        <el-image
          v-if="item.poster"
          :src="item.poster"
          fit="cover"
          class="row-poster"
          lazy
        >
          <template #error>
            <div class="poster-ph">无海报</div>
          </template>
        </el-image>
        <div v-else class="row-poster poster-ph">无海报</div>
        <div class="row-info">
          <div class="row-title">{{ item.title }}</div>
          <div class="row-meta">
            <span>{{ item.year }}</span>
            <span>{{ item.genres.slice(0, 3).join(' / ') }}</span>
            <span>评分 {{ item.rating.toFixed(1) }}（{{ item.rating_count }} 人）</span>
          </div>
          <div class="row-overview">{{ item.overview || '暂无简介' }}</div>
        </div>
      </div>
    </div>

    <div v-if="totalPages > 1" class="pager">
      <el-pagination
        layout="prev, pager, next"
        :total="totalResults"
        :page-size="20"
        :current-page="page"
        @current-change="load"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { tmdbApi } from '@/api/tmdb';
import type { MediaItem } from '@/types';

const mediaType = ref<'movie' | 'tv'>('movie');
const items = ref<MediaItem[]>([]);
const page = ref(1);
const totalPages = ref(1);
const totalResults = ref(0);
const loading = ref(false);
const router = useRouter();

async function load(p = 1) {
  loading.value = true;
  try {
    const res = await tmdbApi.topRated(mediaType.value, p);
    items.value = res.items;
    page.value = res.page;
    totalPages.value = res.totalPages;
    totalResults.value = res.totalResults;
  } finally {
    loading.value = false;
  }
}

function goDetail(item: MediaItem) {
  router.push(`/detail/${item.type}/${item.id}`);
}

onMounted(() => load(1));
</script>

<style scoped>
.hero h1 {
  font-size: 24px;
  margin-bottom: 12px;
}
.type-switch {
  margin-bottom: 16px;
}
.list {
  min-height: 200px;
}
.rank-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
}
.rank-row:hover {
  background: #1a1f29;
}
.rank-num {
  width: 34px;
  text-align: center;
  font-size: 20px;
  font-weight: 800;
  color: #6b7280;
  font-style: italic;
}
.rank-num.top1 { color: #f59e0b; }
.rank-num.top2 { color: #c0c8d4; }
.rank-num.top3 { color: #d97706; }
.row-poster {
  width: 60px;
  height: 90px;
  border-radius: 6px;
  flex-shrink: 0;
  background: #1a1e26;
}
.poster-ph {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #5c6472;
}
.row-info {
  flex: 1;
  min-width: 0;
}
.row-title {
  font-size: 15px;
  font-weight: 600;
}
.row-meta {
  font-size: 12px;
  color: #8b93a1;
  margin: 3px 0;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.row-overview {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pager {
  display: flex;
  justify-content: center;
  margin: 24px 0;
}
</style>
