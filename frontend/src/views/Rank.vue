<template>
  <div class="rank">
    <div class="rank-header">
      <h1>{{ mediaType === 'movie' ? '🎬 电影' : '📺 剧集' }}</h1>
      <p class="subtitle">{{ mediaType === 'movie' ? '正在上映' : '正在播出' }}</p>
    </div>

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
          
          <!-- 类型标签 -->
          <div class="type-badge" :class="mediaType">
            {{ mediaType === 'movie' ? '电影' : '剧集' }}
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
        :page-size="80"
        :current-page="page"
        @current-change="load"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { tmdbApi } from '@/api/tmdb';
import type { MediaItem } from '@/types';

const route = useRoute();
const router = useRouter();

// 根据 URL 路径决定类型：/rank/movie 或 /rank/tv
const mediaType = ref<'movie' | 'tv'>(route.path.includes('/tv') ? 'tv' : 'movie');
const items = ref<MediaItem[]>([]);
const page = ref(1);
const totalPages = ref(1);
const totalResults = ref(0);
const loading = ref(false);

async function load(p = 1) {
  loading.value = true;
  try {
    // 电影分类用 nowPlaying，剧集分类用 onTheAir
    const res = mediaType.value === 'movie' 
      ? await tmdbApi.nowPlaying(p)
      : await tmdbApi.onTheAir(p);
    
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

// 监听路由变化切换类型
watch(() => route.path, (newPath) => {
  mediaType.value = newPath.includes('/tv') ? 'tv' : 'movie';
  load(1);
});

onMounted(() => load(1));
</script>

<style scoped>
.rank {
  padding: 0 20px;
}

.rank-header {
  margin-bottom: 20px;
}

.rank-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 14px;
  color: #8b93a1;
}

/* 网格布局：固定 8 列 */
.grid-container {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 16px;
  min-height: 200px;
  margin-bottom: 20px;
}

@media (max-width: 1600px) {
  .grid-container {
    grid-template-columns: repeat(6, 1fr);
  }
}

@media (max-width: 1200px) {
  .grid-container {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (max-width: 900px) {
  .grid-container {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 600px) {
  .grid-container {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
}

/* 卡片样式 */
.media-card {
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  border-radius: 8px;
  overflow: hidden;
}

.media-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.4);
}

.poster-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  border-radius: 8px;
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
  top: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.75);
  color: #fbbf24;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  backdrop-filter: blur(4px);
}

/* 类型标签 */
.type-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.type-badge.movie {
  background: rgba(59, 130, 246, 0.85);
  color: #fff;
}

.type-badge.tv {
  background: rgba(139, 92, 246, 0.85);
  color: #fff;
}

/* 卡片信息 */
.card-info {
  padding: 8px 4px;
}

.title {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 3px;
}

.meta {
  font-size: 11px;
  color: #8b93a1;
}

.pager {
  display: flex;
  justify-content: center;
  margin: 28px 0;
}
</style>
