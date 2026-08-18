<template>
  <div class="search">
    <div class="search-bar">
      <el-input
        v-model="keyword"
        placeholder="搜索电影 / 剧集 / 演员……"
        size="large"
        clearable
        :prefix-icon="Search"
        @keyup.enter="doSearch(1)"
        @clear="clearSearch"
      >
        <template #append>
          <el-button :loading="loading" @click="doSearch(1)">搜索</el-button>
        </template>
      </el-input>
    </div>

    <el-radio-group v-model="searchType" class="type-switch" @change="doSearch(1)">
      <el-radio-button value="multi">全部</el-radio-button>
      <el-radio-button value="movie">电影</el-radio-button>
      <el-radio-button value="tv">剧集</el-radio-button>
    </el-radio-group>

    <div v-if="searched" class="result-count">共找到 {{ totalResults }} 条结果</div>

    <div v-loading="loading" class="grid">
      <MediaCard v-for="item in items" :key="item.type + item.id" :item="item" />
    </div>

    <el-empty v-if="searched && !loading && items.length === 0" description="没有找到相关内容" />

    <div v-if="totalPages > 1" class="pager">
      <el-pagination
        layout="prev, pager, next"
        :total="totalResults"
        :page-size="20"
        :current-page="page"
        @current-change="doSearch"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { tmdbApi } from '@/api/tmdb';
import type { MediaItem } from '@/types';
import MediaCard from './components/MediaCard.vue';

const keyword = ref('');
const searchType = ref<'multi' | 'movie' | 'tv'>('multi');
const items = ref<MediaItem[]>([]);
const page = ref(1);
const totalPages = ref(1);
const totalResults = ref(0);
const loading = ref(false);
const searched = ref(false);

async function doSearch(p = 1) {
  const q = keyword.value.trim();
  if (!q) {
    searched.value = false;
    items.value = [];
    return;
  }
  loading.value = true;
  try {
    const res = await tmdbApi.search(q, searchType.value, p);
    items.value = res.items;
    page.value = res.page;
    totalPages.value = res.totalPages;
    totalResults.value = res.totalResults;
    searched.value = true;
  } finally {
    loading.value = false;
  }
}

function clearSearch() {
  searched.value = false;
  items.value = [];
}
</script>

<style scoped>
.search-bar {
  max-width: 640px;
  margin: 8px 0 14px;
}
.type-switch {
  margin-bottom: 16px;
}
.result-count {
  color: #8b93a1;
  font-size: 12px;
  margin-bottom: 12px;
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
</style>
