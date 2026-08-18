import { getSetting } from '../settingsStore.js';
import { logger } from '../logger.js';

export interface SearchResource {
  name: string;
  url: string;
  size?: string;
  source: string;
  time?: string;
  type: string; // 网盘类型：115 / quark / unknown
}

export class PansouService {
  private static instance: PansouService;

  private constructor() {}

  public static getInstance(): PansouService {
    if (!PansouService.instance) {
      PansouService.instance = new PansouService();
    }
    return PansouService.instance;
  }

  async search(keyword: string, refresh = false): Promise<SearchResource[]> {
    const pansouUrlSetting = getSetting('pansou_url');
    if (!pansouUrlSetting || !pansouUrlSetting.trim()) {
      logger.error('[PansouService] pansou_url not configured');
      const err: any = new Error('未配置盘搜 API，请在「设置」页填写 pansou_url');
      err.code = 'PANSOU_NOT_CONFIGURED';
      throw err;
    }

    let baseUrl = pansouUrlSetting.trim();
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    const apiUrl = baseUrl.includes('/api/search') ? baseUrl : `${baseUrl}/api/search`;

    const trimmedKeyword = keyword.slice(0, 80);
    try {
      logger.info('[PansouService] Searching', { apiUrl, keyword: trimmedKeyword, refresh });
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          kw: trimmedKeyword,
          cloud_types: ['115', 'quark'],
          ...(refresh ? { refresh: true } : {}),
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const respBody: any = await res.json();

      // fish2018/pansou 结构：{ code: 0, message, data: { merged_by_type / results } }
      if (respBody && typeof respBody.code !== 'undefined' && respBody.code !== 0) {
        throw new Error(respBody.message || 'API 返回错误');
      }

      const items: SearchResource[] = [];
      if (respBody && respBody.data) {
        const data = respBody.data;

        const buildUrlWithPassword = (url: string, password: string, type: string): string => {
          if (!url || !password) return url;
          const normalizedType = (type || '').toLowerCase();
          const key = normalizedType === '115' ? 'password' : normalizedType === 'quark' ? 'pwd' : '';
          if (!key) return url;
          if (new RegExp(`[?&]${key}=`, 'i').test(url)) return url;
          const separator = url.includes('?') ? '&' : '?';
          return `${url}${separator}${key}=${encodeURIComponent(password)}`;
        };

        if (data.merged_by_type && typeof data.merged_by_type === 'object') {
          // { "115": [...], "quark": [...] } -> 拍平并保留 type
          Object.entries(data.merged_by_type).forEach(([type, val]: [string, any]) => {
            if (Array.isArray(val)) {
              items.push(
                ...val.map((item: any) => ({
                  name: item.title || item.name || item.note || '未知文件名',
                  url: buildUrlWithPassword(item.link || item.url || '', item.password || '', type),
                  size: item.size || '未知',
                  source: item.sitename || item.source || item.from || '未知',
                  time: item.time || item.date || item.datetime || '',
                  type,
                })),
              );
            }
          });
        } else if (Array.isArray(data.results)) {
          items.push(
            ...data.results.map((item: any) => ({
              name: item.title || item.name || item.note || '未知文件名',
              url: buildUrlWithPassword(item.link || item.url || '', item.password || '', item.cloud_type || item.type || item.cloudType || ''),
              size: item.size || '未知',
              source: item.sitename || item.source || item.from || '未知',
              time: item.time || item.date || item.datetime || '',
              type: 'unknown',
            })),
          );
        }
      }

      logger.info('[PansouService] Parsed items', { keyword: trimmedKeyword, count: items.length });
      return items;
    } catch (error: any) {
      const errorDetail = error.message || String(error);
      logger.error('[PansouService] Search error', { keyword: keyword.slice(0, 80), error: errorDetail });
      throw new Error(`盘搜 API 查询失败: ${errorDetail}`);
    }
  }
}

export const pansouService = PansouService.getInstance();
