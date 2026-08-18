<template>
  <div class="media-card" @click="goDetail">
    <div class="poster-wrap">
      <el-image
        v-if="item.poster"
        :src="item.poster"
        fit="cover"
        class="poster"
        lazy
        :preview-src-list="[item.poster]"
        preview-teleported
      >
        <template #error>
          <div class="poster-fallback">
            <el-icon :size="40"><Picture /></el-icon>
          </div>
        </template>
      </el-image>
      <div v-else class="poster-fallback">
        <el-icon :size="40"><Picture /></el-icon>
      </div>
      <span v-if="item.rating > 0" class="rating-badge">{{ item.rating.toFixed(1) }}</span>
      <span class="type-badge" :class="item.type">{{ item.type === 'movie' ? '电影' : '剧集' }}</span>
    </div>
    <div class="card-info">
      <div class="title" :title="item.title">{{ item.title || '未知片名' }}</div>
      <div class="meta">
        <span>{{ item.year || '—' }}</span>
        <span v-if="item.genres.length" class="genres">{{ item.genres.slice(0, 2).join(' / ') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { Picture } from '@element-plus/icons-vue';
import type { MediaItem } from '@/types';

const props = defineProps<{ item: MediaItem }>();
const router = useRouter();

function goDetail() {
  router.push(`/detail/${props.item.type}/${props.item.id}`);
}
</script>

<style scoped>
.media-card {
  cursor: pointer;
  transition: transform 0.2s;
}
.media-card:hover {
  transform: translateY(-4px);
}
.poster-wrap {
  position: relative;
  aspect-ratio: 2 / 3;
  border-radius: 8px;
  overflow: hidden;
  background: #1a1e26;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}
.poster {
  width: 100%;
  height: 100%;
}
.poster-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4a5260;
}
.rating-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  background: rgba(245, 158, 11, 0.92);
  color: #111;
  font-weight: 700;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 6px;
}
.type-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  backdrop-filter: blur(4px);
}
.type-badge.tv {
  background: rgba(59, 130, 246, 0.85);
}
.card-info {
  padding: 8px 2px 0;
}
.title {
  font-size: 13px;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.meta {
  font-size: 11px;
  color: #8b93a1;
  margin-top: 2px;
  display: flex;
  gap: 6px;
}
.genres {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
