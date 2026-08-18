import request from './request';
import type { ListResponse, MediaDetail, SettingsInfo } from '@/types';

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

  search: (q: string, type = 'multi', page = 1) =>
    request.get<ListResponse>('/tmdb/search', { params: { q, type, page } }).then((r) => r.data),

  detail: (type: 'movie' | 'tv', id: string) =>
    request.get<MediaDetail>(`/tmdb/detail/${type}/${id}`).then((r) => r.data),
};

export const settingsApi = {
  get: () => request.get<SettingsInfo>('/settings').then((r) => r.data),
  save: (tmdb_api_key: string) =>
    request.put('/settings', { tmdb_api_key }).then((r) => r.data),
  test: (api_key: string) =>
    request.post<{ valid: boolean; message: string }>('/settings/tmdb/test', { api_key }).then((r) => r.data),
  clear: () => request.delete('/settings/tmdb').then((r) => r.data),
};

export const authApi = {
  login: (username: string, password: string) =>
    request.post<{ token: string; username: string }>('/auth/login', { username, password }).then((r) => r.data),
};
