import NodeCache from 'node-cache';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { getSetting } from '../settingsStore.js';

export const TMDB_API_BASE = 'https://api.themoviedb.org/3';
export const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p';

export class TmdbKeyError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export interface MediaItem {
  id: string;
  title: string;
  type: 'movie' | 'tv';
  rating: number;
  rating_count: number;
  poster: string;
  backdrop: string;
  year: string;
  genres: string[];
  overview: string;
  original_title: string;
  url: string;
}

export interface MediaDetail extends MediaItem {
  tagline?: string;
  status?: string;
  runtime?: number;
  languages?: string[];
  countries?: string[];
  directors: string[];
  cast: { name: string; character: string; profile: string }[];
  videos: { key: string; name: string; site: string; type: string }[];
  recommendations: MediaItem[];
}

export interface ListResponse {
  items: MediaItem[];
  page: number;
  totalPages: number;
  totalResults: number;
}

interface TmdbResult {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  vote_average?: number;
  vote_count?: number;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  overview?: string;
  media_type?: string;
  adult?: boolean;
}

const GENRE_NAMES: Record<string, string> = {
  28: '动作', 12: '冒险', 16: '动画', 35: '喜剧', 80: '犯罪',
  99: '纪录', 18: '剧情', 10751: '家庭', 14: '奇幻', 36: '历史',
  27: '恐怖', 10402: '音乐', 9648: '悬疑', 10749: '爱情', 878: '科幻',
  10770: '电视电影', 53: '惊悚', 10752: '战争', 37: '西部',
  10759: '动作冒险', 10762: '儿童', 10763: '新闻', 10764: '真人秀',
  10765: '科幻奇幻', 10766: '肥皂剧', 10767: '脱口秀', 10768: '战争政治',
};

export class TmdbService {
  private static instance: TmdbService;
  private cache: NodeCache;

  private constructor() {
    this.cache = new NodeCache({ stdTTL: config.cacheTtl, checkperiod: 600 });
  }

  public static getInstance(): TmdbService {
    if (!TmdbService.instance) {
      TmdbService.instance = new TmdbService();
    }
    return TmdbService.instance;
  }

  // ---------------- Key 管理（设置页 > 环境变量） ----------------

  getApiKey(): string {
    return getSetting('tmdb_api_key') || config.tmdbApiKey;
  }

  hasApiKey(): boolean {
    return this.getApiKey().length > 0;
  }

  /** 保存后调用：清缓存 + 即时生效 */
  reload(): void {
    this.cache.flushAll();
  }

  // ---------------- 内部请求 ----------------

  private async request<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
    const key = this.getApiKey();
    if (!key) {
      throw new TmdbKeyError('TMDB_NOT_CONFIGURED', '未配置 TMDB API Key，请在「设置」页填写');
    }

    const query = new URLSearchParams();
    // v4 Access Token 是 JWT 格式（eyJ...），走 Bearer 头；v3 Key 走 api_key 参数
    if (key.startsWith('eyJ')) {
      query.set('language', config.tmdbLanguage);
    } else {
      query.set('api_key', key);
      query.set('language', config.tmdbLanguage);
    }
    for (const [k, v] of Object.entries(params)) {
      query.set(k, String(v));
    }

    const headers: Record<string, string> = { accept: 'application/json' };
    if (key.startsWith('eyJ')) {
      headers.authorization = `Bearer ${key}`;
    }

    let res: Response;
    try {
      res = await fetch(`${TMDB_API_BASE}${path}?${query.toString()}`, { headers });
    } catch (e) {
      logger.error('[TmdbService] 网络请求失败', (e as Error).message);
      throw new TmdbKeyError('TMDB_NETWORK_ERROR', '无法连接 TMDB API，请检查服务器网络');
    }

    if (res.status === 401 || res.status === 403) {
      throw new TmdbKeyError('TMDB_KEY_INVALID', 'TMDB API Key 无效或已失效，请在「设置」页更新');
    }
    if (res.status === 429) {
      throw new TmdbKeyError('TMDB_RATE_LIMITED', 'TMDB API 请求过于频繁，请稍后重试（免费层限速）');
    }
    if (!res.ok) {
      throw new TmdbKeyError('TMDB_ERROR', `TMDB API 错误：HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  }

  // ---------------- 数据映射 ----------------

  private posterUrl(posterPath: string | null | undefined): string {
    if (!posterPath) return '';
    const full = `${TMDB_IMG_BASE}/w500${posterPath}`;
    if (config.imageProxyBase) {
      return full.replace(/^https?:\/\/[^/]+\//, config.imageProxyBase);
    }
    return full;
  }

  private mapItem(r: TmdbResult, type: 'movie' | 'tv'): MediaItem {
    return {
      id: String(r.id),
      title: (r.title || r.name || '').trim(),
      type,
      rating: Number((r.vote_average || 0).toFixed(1)),
      rating_count: r.vote_count || 0,
      poster: this.posterUrl(r.poster_path),
      backdrop: this.posterUrl(r.backdrop_path),
      year: (r.release_date || r.first_air_date || '').slice(0, 4),
      genres: (r.genre_ids || []).map((g) => GENRE_NAMES[String(g)] || String(g)),
      overview: (r.overview || '').trim(),
      original_title: (r.original_title || r.original_name || '').trim(),
      url: `https://www.themoviedb.org/${type}/${r.id}`,
    };
  }

  private async list(path: string, params: Record<string, string | number>, type: 'movie' | 'tv', cacheKey: string): Promise<ListResponse> {
    const cached = this.cache.get<ListResponse>(cacheKey);
    if (cached) return cached;

    const data = await this.request<{ page: number; total_pages: number; total_results: number; results: TmdbResult[] }>(path, params);
    const result: ListResponse = {
      items: data.results.map((r) => this.mapItem(r, r.media_type === 'tv' ? 'tv' : type)),
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
    };
    this.cache.set(cacheKey, result);
    return result;
  }

  // ---------------- 公开 API ----------------

  /** 趋势（首页默认） */
  getTrending(type: 'movie' | 'tv' | 'all' = 'all', page = 1): Promise<ListResponse> {
    const params: Record<string, string | number> = { page };
    const cacheKey = `trending_${type}_${page}`;
    return this.list(`/trending/${type}/week`, params, type === 'tv' ? 'tv' : 'movie', cacheKey);
  }

  /** 热门 */
  getPopular(type: 'movie' | 'tv' = 'movie', page = 1): Promise<ListResponse> {
    const cacheKey = `popular_${type}_${page}`;
    return this.list(`/${type}/popular`, { page }, type, cacheKey);
  }

  /** 高分榜 */
  getTopRated(type: 'movie' | 'tv' = 'movie', page = 1): Promise<ListResponse> {
    const cacheKey = `top_${type}_${page}`;
    return this.list(`/${type}/top_rated`, { page }, type, cacheKey);
  }

  /** 正在上映（电影） */
  getNowPlaying(page = 1): Promise<ListResponse> {
    const cacheKey = `nowplaying_${page}`;
    return this.list('/movie/now_playing', { page, region: 'CN' }, 'movie', cacheKey);
  }

  /** 即将上映（电影） */
  getUpcoming(page = 1): Promise<ListResponse> {
    const cacheKey = `upcoming_${page}`;
    return this.list('/movie/upcoming', { page, region: 'CN' }, 'movie', cacheKey);
  }

  /** 搜索 */
  search(query: string, type: 'movie' | 'tv' | 'multi' = 'multi', page = 1): Promise<ListResponse> {
    const cacheKey = `search_${query}_${type}_${page}`;
    return this.list(`/search/${type}`, { query, page, include_adult: 'false' }, type === 'tv' ? 'tv' : 'movie', cacheKey);
  }

  /** 详情 */
  async getDetail(type: 'movie' | 'tv', id: string): Promise<MediaDetail> {
    const cacheKey = `detail_${type}_${id}`;
    const cached = this.cache.get<MediaDetail>(cacheKey);
    if (cached) return cached;

    const data = await this.request<any>(`/${type}/${id}`, {
      append_to_response: 'credits,videos,recommendations',
    });

    const base = this.mapItem(data, type);
    const detail: MediaDetail = {
      ...base,
      title: (data.title || data.name || '').trim(),
      rating: Number((data.vote_average || 0).toFixed(1)),
      genres: (data.genres || []).map((g: { name: string }) => g.name),
      tagline: data.tagline || '',
      status: data.status || '',
      runtime: data.runtime || data.episode_run_time?.[0] || undefined,
      languages: (data.spoken_languages || []).map((l: { english_name: string }) => l.english_name),
      countries: (data.production_countries || []).map((c: { name: string }) => c.name),
      directors: (data.credits?.crew || [])
        .filter((c: { job: string }) => c.job === 'Director')
        .map((c: { name: string }) => c.name),
      cast: (data.credits?.cast || []).slice(0, 20).map((c: any) => ({
        name: c.name || '',
        character: c.character || '',
        profile: this.posterUrl(c.profile_path),
      })),
      videos: (data.videos?.results || [])
        .filter((v: { site: string; type: string }) => v.site === 'YouTube' && v.type === 'Trailer')
        .slice(0, 3)
        .map((v: any) => ({ key: v.key, name: v.name, site: v.site, type: v.type })),
      recommendations: (data.recommendations?.results || [])
        .slice(0, 12)
        .map((r: TmdbResult) => this.mapItem(r, type)),
    };
    this.cache.set(cacheKey, detail);
    return detail;
  }

  /** 测试 Key 有效性（调 /configuration 轻量接口） */
  async testKey(key: string): Promise<{ valid: boolean; message: string }> {
    // 仅用传入的 key 测试，不写入存储
    const query = new URLSearchParams();
    if (key.startsWith('eyJ')) {
      query.set('language', config.tmdbLanguage);
    } else {
      query.set('api_key', key);
      query.set('language', config.tmdbLanguage);
    }
    const headers: Record<string, string> = { accept: 'application/json' };
    if (key.startsWith('eyJ')) {
      headers.authorization = `Bearer ${key}`;
    }

    try {
      const res = await fetch(`${TMDB_API_BASE}/configuration?${query.toString()}`, { headers });
      if (res.ok) {
        return { valid: true, message: 'Key 有效 ✅，可以开始使用了' };
      }
      if (res.status === 401 || res.status === 403) {
        return { valid: false, message: 'Key 无效（401/403），请检查是否复制完整' };
      }
      if (res.status === 429) {
        return { valid: false, message: '请求过于频繁（429），稍后再试' };
      }
      return { valid: false, message: `HTTP ${res.status}` };
    } catch (e) {
      return { valid: false, message: `网络错误：${(e as Error).message}` };
    }
  }
}

export const tmdbService = TmdbService.getInstance();
