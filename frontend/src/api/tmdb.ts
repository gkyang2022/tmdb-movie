import request from './request';
import type { ListResponse, MediaDetail, SettingsInfo, TransferResult, TrackerTask, SearchResource, SmartStrmStatus } from '@/types';

export const tmdbApi = {
  trending: (type = 'all', page = 1) =>
    request.get<ListResponse>('/tmdb/trending', { params: { type, page } }).then((r) => r.data),

  popular: (type = 'movie', page = 1) =>
    request.get<ListResponse>('/tmdb/popular', { params: { type, page } }).then((r) => r.data),

  topRated: (type = 'movie', page = 1) =>
    request.get<ListResponse>('/tmdb/top-rated', { params: { type, page } }).then((r) => r.data),

  nowPlaying: (page = 1) =>
    request.get<ListResponse>('/tmdb/now-playing', { params: { page } }).then((r) => r.data),

  upcoming: (page = 1) =>
    request.get<ListResponse>('/tmdb/upcoming', { params: { page } }).then((r) => r.data),

  onTheAir: (page = 1) =>
    request.get<ListResponse>('/tmdb/on-the-air', { params: { page } }).then((r) => r.data),

  search: (q: string, type = 'multi', page = 1) =>
    request.get<ListResponse>('/tmdb/search', { params: { q, type, page } }).then((r) => r.data),

  detail: (type: 'movie' | 'tv', id: string) =>
    request.get<MediaDetail>(`/tmdb/detail/${type}/${id}`).then((r) => r.data),
};

export const settingsApi = {
  get: () => request.get<SettingsInfo>('/settings').then((r) => r.data),
  save: (payload: Record<string, string>) => request.put('/settings', payload).then((r) => r.data),
  test: (api_key: string) =>
    request.post<{ valid: boolean; message: string }>('/settings/tmdb/test', { api_key }).then((r) => r.data),
  clear: () => request.delete('/settings/tmdb').then((r) => r.data),
  testNotify: () => request.post<{ ok: boolean; message: string }>('/settings/notify/test').then((r) => r.data),
};

export const transferApi = {
  save: (shareUrl: string, type?: 'quark' | '115', contentType?: 'movie' | 'tv' | 'anime') =>
    request.post<TransferResult>('/transfer', { shareUrl, type, contentType }).then((r) => r.data),
  config: () =>
    request.get<{ quark: { configured: boolean; folderId: string }; '115': { configured: boolean; folderId: string } }>(
      '/transfer/config',
    ).then((r) => r.data),
  listFolders: (type: 'quark' | '115', parentId: string = '0') =>
    request.get<{ folders: import('@/types').FolderItem[] }>('/transfer/folders', { params: { type, parentId } }).then((r) => r.data),
};

export const trackerApi = {
  list: () => request.get<{ tasks: TrackerTask[] }>('/tracker/tasks').then((r) => r.data.tasks),
  create: (payload: Record<string, unknown>) =>
    request.post<{ ok: boolean; task: TrackerTask; error?: string }>('/tracker/tasks', payload).then((r) => r.data),
  update: (id: number, payload: Record<string, unknown>) =>
    request.put<{ ok: boolean; task: TrackerTask }>(`/tracker/tasks/${id}`, payload).then((r) => r.data),
  remove: (id: number) => request.delete(`/tracker/tasks/${id}`).then((r) => r.data),
  run: (id: number) => request.post<{ ok: boolean; message: string }>(`/tracker/tasks/${id}/run`).then((r) => r.data),
};

export const authApi = {
  login: (username: string, password: string) =>
    request.post<{ token: string; username: string }>('/auth/login', { username, password }).then((r) => r.data),
  changePassword: (oldPassword: string, newPassword: string) =>
    request
      .post<{ ok: boolean; message: string }>('/auth/change-password', { oldPassword, newPassword })
      .then((r) => r.data),
};

export const pansouApi = {
  search: (keyword: string, refresh = false) =>
    request
      .get<{ ok: boolean; keyword: string; count: number; items: SearchResource[]; error?: string; code?: string }>(
        '/pansou/search',
        { params: { keyword, refresh: refresh ? 1 : 0 } },
      )
      .then((r) => r.data),
};

export const smartstrmApi = {
  status: () => request.get<SmartStrmStatus>('/smartstrm/status').then((r) => r.data),
  notify: (taskName?: string, contentType?: 'movie' | 'tv' | 'anime') =>
    request
      .post<{ success: boolean; message: string }>('/smartstrm/notify', {
        ...(taskName ? { taskName } : {}),
        ...(contentType ? { contentType } : {}),
      })
      .then((r) => r.data),
};
