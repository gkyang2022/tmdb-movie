import { Router, Request, Response } from 'express';
import { getSetting, getSettingMasked, setSetting } from '../settingsStore.js';
import { tmdbService } from '../services/tmdb.service.js';
import { sendTestNotification } from '../services/notify.service.js';
import { config } from '../config.js';

export const settingsRouter = Router();

/** 当前 Key 来源：settings 库 > 环境变量 > 无 */
function keySource(): 'settings' | 'env' | 'none' {
  if (getSetting('tmdb_api_key')) return 'settings';
  if (config.tmdbApiKey) return 'env';
  return 'none';
}

/** 敏感设置键（密文存储，回显脱敏） */
const SENSITIVE_KEYS = ['tmdb_api_key', 'cookie_quark', 'cookie_115', 'telegram_bot_token'];

/** 非敏感设置键（明文存储，原样回显） */
const PLAIN_KEYS = ['pansou_url', 'folder_id_quark', 'folder_id_115', 'telegram_chat_ids', 'discord_webhook_urls', 'notification_targets'];

/** 读取设置（脱敏回显） */
settingsRouter.get('/', (_req: Request, res: Response) => {
  const targets = getSetting('notification_targets');
  res.json({
    tmdb_api_key_masked: getSettingMasked('tmdb_api_key'),
    source: keySource(),
    language: config.tmdbLanguage,
    image_proxy_base: config.imageProxyBase || null,
    // 网盘转存
    cookie_quark_masked: getSettingMasked('cookie_quark'),
    cookie_115_masked: getSettingMasked('cookie_115'),
    folder_id_quark: getSetting('folder_id_quark') || '',
    folder_id_115: getSetting('folder_id_115') || '',
    // 通知
    telegram_bot_token_masked: getSettingMasked('telegram_bot_token'),
    telegram_chat_ids: getSetting('telegram_chat_ids') || '',
    discord_webhook_urls: getSetting('discord_webhook_urls') || '',
    notification_targets: targets ? JSON.parse(targets) : ['telegram_chat', 'discord_channel'],
    pansou_url: getSetting('pansou_url') || '',
  });
});

/** 保存 TMDB API Key（即时生效） */
settingsRouter.put('/', (req: Request, res: Response) => {
  const body = req.body || {};

  // TMDB Key（特殊：格式校验 + 清缓存）
  if (body.tmdb_api_key !== undefined) {
    const key = String(body.tmdb_api_key || '').trim();
    if (key && !/^[\w.\-]{16,}$/.test(key)) {
      res.status(400).json({ error: 'API Key 格式似乎不正确（长度过短）', code: 'BAD_REQUEST' });
      return;
    }
    setSetting('tmdb_api_key', key);
    tmdbService.reload();
  }

  // 网盘/通知敏感键
  for (const key of SENSITIVE_KEYS) {
    if (body[key] !== undefined) {
      setSetting(key, String(body[key] || '').trim());
    }
  }

  // 非敏感键
  for (const key of PLAIN_KEYS) {
    if (body[key] !== undefined) {
      const value = String(body[key] || '').trim();
      if (key === 'notification_targets') {
        // 校验为合法数组
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            setSetting(key, JSON.stringify(parsed.filter((t) => t === 'telegram_chat' || t === 'discord_channel')));
          }
        } catch {
          // 非法 JSON 忽略
        }
      } else {
        setSetting(key, value);
      }
    }
  }

  res.json({
    ok: true,
    masked: {
      tmdb_api_key: getSettingMasked('tmdb_api_key'),
      cookie_quark: getSettingMasked('cookie_quark'),
      cookie_115: getSettingMasked('cookie_115'),
      telegram_bot_token: getSettingMasked('telegram_bot_token'),
    },
    source: keySource(),
  });
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

/** 测试通知（发送测试消息到已配置渠道） */
settingsRouter.post('/notify/test', async (_req: Request, res: Response) => {
  const result = await sendTestNotification();
  res.json(result);
});

/** 清除 Key */
settingsRouter.delete('/tmdb', (_req: Request, res: Response) => {
  setSetting('tmdb_api_key', '');
  tmdbService.reload();
  res.json({ ok: true, source: keySource() });
});
