<template>
  <div class="home">
    <!-- Hero 轮播区 -->
    <div class="hero-carousel">
      <transition name="fade" mode="out-in">
        <div v-if="currentSlide" :key="currentSlide.id" class="hero" :style="{ backgroundImage: `url(${currentSlide.backdrop})` }">
          <div class="hero-overlay" />
          <div class="hero-content">
            <h1 class="hero-title">{{ currentSlide.title }}</h1>
            <div class="hero-meta">
              <span class="hero-rating">⭐ {{ currentSlide.rating.toFixed(1) }}</span>
              <span class="hero-year">{{ currentSlide.year }}</span>
              <span class="hero-type">{{ currentSlide.type === 'movie' ? '电影' : '剧集' }}</span>
            </div>
            <p class="hero-overview">{{ currentSlide.overview || '暂无简介' }}</p>
            <div class="hero-actions">
              <el-button type="primary" size="large" @click="goDetail(currentSlide)">查看详情</el-button>
            </div>
          </div>
        </div>
      </transition>
      
      <!-- 轮播指示器 -->
      <div class="carousel-indicators">
        <span
          v-for="(item, idx) in carouselItems"
          :key="item.id"
          class="indicator"
          :class="{ active: idx === currentIndex }"
          @click="goToSlide(idx)"
        />
      </div>
      
      <!-- 轮播控制 -->
      <button class="carousel-btn prev" @click="prevSlide">‹</button>
      <button class="carousel-btn next" @click="nextSlide">›</button>
    </div>

    <!-- Trending 分区 -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">🔥 本周趋势</h2>
        <el-tabs v-model="trendType" class="section-tabs" @tab-change="loadTrending">
          <el-tab-pane label="全部" name="all" />
          <el-tab-pane label="电影" name="movie" />
          <el-tab-pane label="剧集" name="tv" />
        </el-tabs>
      </div>
      <div v-loading="loading" class="scroll-row">
        <MediaCard v-for="item in items" :key="item.id" :item="item" class="scroll-card" />
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
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { tmdbApi } from '@/api/tmdb';
import type { MediaItem } from '@/types';
import MediaCard from './components/MediaCard.vue';

const router = useRouter();
const trendType = ref<'all' | 'movie' | 'tv'>('all');
const items = ref<MediaItem[]>([]);
const popularItems = ref<MediaItem[]>([]);
const nowItems = ref<MediaItem[]>([]);
const loading = ref(false);
const popularLoading = ref(false);
const nowLoading = ref(false);

// 轮播相关
const currentIndex = ref(0);
let carouselTimer: ReturnType<typeof setInterval> | null = null;

const carouselItems = computed(() => items.value.slice(0, 5));
const currentSlide = computed(() => carouselItems.value[currentIndex.value] || null);

function goToSlide(idx: number) {
  currentIndex.value = idx;
  resetTimer();
}

function prevSlide() {
  currentIndex.value = (currentIndex.value - 1 + carouselItems.value.length) % carouselItems.value.length;
  resetTimer();
}

function nextSlide() {
  currentIndex.value = (currentIndex.value + 1) % carouselItems.value.length;
  resetTimer();
}

function resetTimer() {
  if (carouselTimer) clearInterval(carouselTimer);
  carouselTimer = setInterval(() => {
    if (carouselItems.value.length > 0) {
      currentIndex.value = (currentIndex.value + 1) % carouselItems.value.length;
    }
  }, 6000);
}

function goDetail(item: MediaItem) {
  router.push(`/detail/${item.type}/${item.id}`);
}

async function loadTrending() {
  loading.value = true;
  try {
    const res = await tmdbApi.trending(trendType.value, 1);
    items.value = res.items.slice(0, 20);
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
  loadTrending();
  loadPopular();
  loadNowPlaying();
});

onUnmounted(() => {
  if (carouselTimer) clearInterval(carouselTimer);
});
</script>

<style scoped>
.home {
  margin: -16px -20px 0;
}

/* Hero 轮播区 */
.hero-carousel {
  position: relative;
  height: 480px;
  margin-bottom: 32px;
  overflow: hidden;
}

.hero {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center top;
  transition: opacity 0.3s ease;
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

/* 轮播指示器 */
.carousel-indicators {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.3s;
}

.indicator.active {
  width: 24px;
  border-radius: 4px;
  background: #fff;
}

/* 轮播按钮 */
.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s;
}

.hero-carousel:hover .carousel-btn {
  opacity: 1;
}

.carousel-btn:hover {
  background: rgba(0, 0, 0, 0.7);
}

.carousel-btn.prev {
  left: 16px;
}

.carousel-btn.next {
  right: 16px;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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

/* 响应式 */
@media (max-width: 768px) {
  .hero-carousel {
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
