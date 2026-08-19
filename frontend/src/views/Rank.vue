<template>
  <div class="rank">
    <div class="rank-header">
      <h1>🏆 {{ mediaType === 'movie' ? '电影 Top' : '剧集 Top' }}</h1>
    </div>

    <el-radio-group v-model="mediaType" class="type-switch" @change="load(1)">
      <el-radio-button value="movie">电影</el-radio-button>
      <el-radio-button value="tv">剧集</el-radio-button>
    </el-radio-group>

    <div v-loading="loading" class="grid-container">
      <div
        v-for="(item, idx) in items"
        :key="item.id"
        class="media-card"
        @click="goDetail(item)"
      >
        <div class="poster-wrapper">
          <el-image
            v-if="item.poster"
            :src="item.poster"
            fit="cover"
            class="poster"
            lazy
          >
            <template #error>
              <div class="poster-placeholder">无海报</div>
            </template>
          </el-image>
          <div v-else class="poster poster-placeholder">无海报</div>
          
          <!-- 评分徽章 -->
          <div v-if="item.rating > 0" class="rating-badge">
            ⭐ {{ item.rating.toFixed(1) }}
          </div>
          
          <!-- 排名徽章 -->
          <div v-if="idx < 3" class="rank-badge" :class="`rank-${idx + 1}`">
            {{ idx + 1 }}
          </div>
        </div>
        
        <div class="card-info">
          <div class="title">{{ item.title }}</div>
          <div class="meta">
            <span>{{ item.year }}</span>
          </div>
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
.rank {
  padding: 0 20px;
}

.rank-header h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #fff;
}

.type-switch {
  margin-bottom: 24px;
}

/* 网格布局 */
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
  min-height: 200px;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 14px;
  }
}

/* 卡片样式 */
.media-card {
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  border-radius: 12px;
  overflow: hidden;
}

.media-card:hover {
  transform: translateY(-8px) scale(1.03);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
}

.poster-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  border-radius: 12px;
  overflow: hidden;
  background: #1a1e26;
}

.poster {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.poster-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #5c6472;
  background: linear-gradient(135deg, #1a1e26 0%, #252b38 100%);
}

/* 评分徽章 */
.rating-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.75);
  color: #fbbf24;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  backdrop-filter: blur(4px);
}

/* 排名徽章 */
.rank-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 800;
  font-style: italic;
}

.rank-badge.rank-1 {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #000;
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.4);
}

.rank-badge.rank-2 {
  background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
  color: #000;
  box-shadow: 0 2px 8px rgba(209, 213, 219, 0.3);
}

.rank-badge.rank-3 {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.3);
}

/* 卡片信息 */
.card-info {
  padding: 10px 4px;
}

.title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.meta {
  font-size: 12px;
  color: #8b93a1;
}

.pager {
  display: flex;
  justify-content: center;
  margin: 28px 0;
}
</style>
