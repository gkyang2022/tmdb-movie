import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { logger } from '../logger.js';

export type TrackerTaskType = 'share' | 'tmdb';
export type TrackerStatus = 'active' | 'paused';

export interface TrackerTask {
  id: number;
  type: TrackerTaskType; // share: 网盘分享链接追踪；tmdb: TMDB 剧集订阅
  name: string;
  // share 型
  shareUrl?: string;
  panType?: 'quark' | '115';
  targetFolderId?: string;
  lastFileIds?: string; // JSON array of file IDs（上次快照）
  // tmdb 型
  tmdbId?: number;
  mediaType?: 'tv';
  lastKnownEpisode?: string; // 上次已知进度，如 "S2E5"
  // 通用
  intervalValue: number; // 默认 6
  intervalUnit: 'minute' | 'hour' | 'day'; // 默认 hour
  lastRunAt?: string;
  lastRunStatus?: 'success' | 'failed' | 'skipped';
  lastRunMessage?: string;
  status: TrackerStatus;
  createdAt: string;
}

interface TrackerFile {
  tasks: TrackerTask[];
  nextId: number;
}

const filePath = process.env.TRACKER_FILE || path.join(config.dataDir, 'tracker.json');

let cache: TrackerFile | null = null;

function load(): TrackerFile {
  if (cache) return cache;
  try {
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as TrackerFile;
      cache = {
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        nextId: typeof parsed.nextId === 'number' ? parsed.nextId : (parsed.tasks?.length || 0) + 1,
      };
    } else {
      cache = { tasks: [], nextId: 1 };
    }
  } catch (e) {
    logger.error('读取 tracker.json 失败', e);
    cache = { tasks: [], nextId: 1 };
  }
  return cache;
}

function persist(): void {
  try {
    fs.mkdirSync(config.dataDir, { recursive: true });
    // 原子写：先写临时文件再 rename，避免崩溃损坏
    const tmp = `${filePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(cache, null, 2), 'utf8');
    fs.renameSync(tmp, filePath);
  } catch (e) {
    logger.error('写入 tracker.json 失败', e);
  }
}

/** 任务列表（按创建时间倒序） */
export function listTasks(): TrackerTask[] {
  return [...load().tasks].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
}

export function getTask(id: number): TrackerTask | null {
  return load().tasks.find((t) => t.id === id) || null;
}

export function createTask(task: Omit<TrackerTask, 'id' | 'createdAt'>): TrackerTask {
  const store = load();
  const now = new Date().toLocaleString('sv-SE');
  const created: TrackerTask = {
    ...task,
    id: store.nextId,
    createdAt: now,
  };
  store.nextId += 1;
  store.tasks.push(created);
  persist();
  return created;
}

export function updateTask(id: number, patch: Partial<TrackerTask>): TrackerTask | null {
  const store = load();
  const task = store.tasks.find((t) => t.id === id);
  if (!task) return null;
  Object.assign(task, patch);
  persist();
  return task;
}

export function deleteTask(id: number): boolean {
  const store = load();
  const idx = store.tasks.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  store.tasks.splice(idx, 1);
  persist();
  return true;
}

/** 仅测试用：重置内存缓存 + 清空磁盘状态 */
export function _resetForTest(): void {
  cache = { tasks: [], nextId: 1 };
  persist();
}
