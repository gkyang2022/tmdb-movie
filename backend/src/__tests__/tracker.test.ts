import { describe, it, expect, beforeEach } from 'vitest';
import { cloudStorageService } from '../services/cloud-storage.service.js';
import { createTask, deleteTask, listTasks, updateTask, _resetForTest } from '../services/trackerStore.js';
import { getNotificationTargets, DEFAULT_NOTIFY_TARGETS } from '../services/notify.service.js';
import { setSetting } from '../settingsStore.js';

describe('CloudStorageService 链接解析', () => {
  it('识别夸克链接', () => {
    expect(cloudStorageService.resolvePanType('https://pan.quark.cn/s/abc12345')).toBe('quark');
    expect(cloudStorageService.resolvePanType('https://drive.quark.cn/s/xyz789')).toBe('quark');
  });

  it('识别 115 链接', () => {
    expect(cloudStorageService.resolvePanType('https://115.com/s/sw35vv73xw3?password=abc')).toBe('115');
    expect(cloudStorageService.resolvePanType('https://115cdn.com/s/abc123')).toBe('115');
  });

  it('无法识别的链接返回空', () => {
    expect(cloudStorageService.resolvePanType('https://example.com/foo')).toBe('');
  });

  it('提取分享码', () => {
    expect(cloudStorageService.extractShareCode('https://pan.quark.cn/s/abc12345')).toBe('abc12345');
    expect(cloudStorageService.extractShareCode('https://115.com/s/sw35vv73xw3?password=xyz')).toBe('sw35vv73xw3');
  });
});

describe('trackerStore CRUD', () => {
  beforeEach(() => {
    _resetForTest();
  });

  it('创建任务并自增 ID', () => {
    const a = createTask({ type: 'tmdb', name: '测试剧', tmdbId: 123, mediaType: 'tv', intervalValue: 6, intervalUnit: 'hour', status: 'active' });
    const b = createTask({ type: 'share', name: 'quark-abc', shareUrl: 'https://pan.quark.cn/s/abc', panType: 'quark', targetFolderId: '0', intervalValue: 1, intervalUnit: 'day', status: 'active' });
    expect(b.id).toBe(a.id + 1);
    expect(listTasks()).toHaveLength(2);
  });

  it('更新任务', () => {
    const task = createTask({ type: 'tmdb', name: 'A', tmdbId: 1, intervalValue: 6, intervalUnit: 'hour', status: 'active' });
    const updated = updateTask(task.id, { status: 'paused', lastRunStatus: 'success', lastRunMessage: '无新内容' });
    expect(updated?.status).toBe('paused');
    expect(updated?.lastRunMessage).toBe('无新内容');
  });

  it('删除任务', () => {
    const task = createTask({ type: 'tmdb', name: 'A', tmdbId: 1, intervalValue: 6, intervalUnit: 'hour', status: 'active' });
    expect(deleteTask(task.id)).toBe(true);
    expect(deleteTask(999)).toBe(false);
    expect(listTasks()).toHaveLength(0);
  });
});

describe('notify 通知目标解析', () => {
  beforeEach(() => {
    setSetting('notification_targets', '');
  });

  it('未配置时返回默认值', () => {
    expect(getNotificationTargets()).toEqual(DEFAULT_NOTIFY_TARGETS);
  });

  it('读取配置的合法目标并过滤非法项', () => {
    setSetting('notification_targets', JSON.stringify(['telegram_chat', 'wechat', 'discord_channel']));
    expect(getNotificationTargets()).toEqual(['telegram_chat', 'discord_channel']);
  });

  it('配置为空数组时回退默认值', () => {
    setSetting('notification_targets', '[]');
    expect(getNotificationTargets()).toEqual(DEFAULT_NOTIFY_TARGETS);
  });
});
