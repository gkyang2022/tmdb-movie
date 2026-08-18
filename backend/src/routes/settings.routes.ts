import { Router, Request, Response } from 'express';
import { getSetting, getSettingMasked, setSetting } from '../settingsStore.js';
import { tmdbService } from '../services/tmdb.service.js';
import { config } from '../config.js';

export const settingsRouter = Router();

/** 当前 Key 来源：settings 库 > 环境变量 > 无 */
function keySource(): 'settings' | 'env' | 'none' {
  if (getSetting('tmdb_api_key')) return 'settings';
  if (config.tmdbApiKey) return 'env';
  return 'none';
}

/** 读取设置（脱敏回显） */
settingsRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    tmdb_api_key_masked: getSettingMasked('tmdb_api_key'),
    source: keySource(),
    language: config.tmdbLanguage,
    image_proxy_base: config.imageProxyBase || null,
  });
});

/** 保存 TMDB API Key（即时生效） */
settingsRouter.put('/', (req: Request, res: Response) => {
  const key = String(req.body?.tmdb_api_key || '').trim();
  if (key && !/^[\w.\-]{16,}$/.test(key)) {
    res.status(400).json({ error: 'API Key 格式似乎不正确（长度过短）', code: 'BAD_REQUEST' });
    return;
  }
  if (key) {
    setSetting('tmdb_api_key', key);
  } else {
    setSetting('tmdb_api_key', ''); // 清空
  }
  tmdbService.reload(); // 清缓存 + 即时生效
  res.json({ ok: true, masked: getSettingMasked('tmdb_api_key'), source: keySource() });
});

/** 测试 Key（不保存） */
settingsRouter.post('/tmdb/test', async (req: Request, res: Response) => {
  const key = String(req.body?.api_key || '').trim();
  if (!key) {
    res.status(400).json({ valid: false, message: '请先填写 API Key' });
    return;
  }
  const result = await tmdbService.testKey(key);
  res.json(result);
});

/** 清除 Key */
settingsRouter.delete('/tmdb', (_req: Request, res: Response) => {
  setSetting('tmdb_api_key', '');
  tmdbService.reload();
  res.json({ ok: true, source: keySource() });
});
