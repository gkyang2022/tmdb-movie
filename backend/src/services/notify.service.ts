import { getSetting } from '../settingsStore.js';
import { logger } from '../logger.js';

export type NotifyTarget = 'telegram_chat' | 'discord_channel';

/** 默认通知目标（可配置） */
export const DEFAULT_NOTIFY_TARGETS: NotifyTarget[] = ['telegram_chat', 'discord_channel'];

export function getNotificationTargets(): NotifyTarget[] {
  const raw = getSetting('notification_targets');
  if (!raw) return [...DEFAULT_NOTIFY_TARGETS];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const valid = parsed.filter((t) => t === 'telegram_chat' || t === 'discord_channel');
      if (valid.length > 0) return valid as NotifyTarget[];
    }
  } catch {
    // 忽略解析失败，用默认值
  }
  return [...DEFAULT_NOTIFY_TARGETS];
}

function parseIdList(value: string | undefined | null): string[] {
  if (!value) return [];
  return value
    .split(/[\s,，]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function sendTelegram(message: string): Promise<void> {
  const token = getSetting('telegram_bot_token');
  const chatIds = parseIdList(getSetting('telegram_chat_ids'));
  if (!token) {
    logger.warn('[Notify] 未配置 telegram_bot_token，跳过 Telegram 通知');
    return;
  }
  if (chatIds.length === 0) {
    logger.warn('[Notify] 未配置 telegram_chat_ids，跳过 Telegram 通知');
    return;
  }
  for (const chatId of chatIds) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message, disable_web_page_preview: true }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        logger.warn('[Notify] Telegram 发送失败', { chatId, status: res.status, body: body.slice(0, 200) });
      }
    } catch (e) {
      logger.warn('[Notify] Telegram 发送异常', { chatId, error: (e as Error).message });
    }
  }
}

async function sendDiscord(message: string): Promise<void> {
  const urls = parseIdList(getSetting('discord_webhook_urls'));
  if (urls.length === 0) {
    logger.warn('[Notify] 未配置 discord_webhook_urls，跳过 Discord 通知');
    return;
  }
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        logger.warn('[Notify] Discord 发送失败', { status: res.status, body: body.slice(0, 200) });
      }
    } catch (e) {
      logger.warn('[Notify] Discord 发送异常', { error: (e as Error).message });
    }
  }
}

/** 按通知目标配置发送消息 */
export async function notify(message: string): Promise<void> {
  const targets = getNotificationTargets();
  const jobs: Promise<void>[] = [];
  if (targets.includes('telegram_chat')) jobs.push(sendTelegram(message));
  if (targets.includes('discord_channel')) jobs.push(sendDiscord(message));
  if (jobs.length === 0) {
    logger.warn('[Notify] 未启用任何通知目标，跳过通知');
    return;
  }
  logger.info('[Notify] 发送通知', { targets, length: message.length });
  await Promise.allSettled(jobs);
}

/** 测试通知（发送一条测试消息到已配置目标） */
export async function sendTestNotification(): Promise<{ ok: boolean; message: string }> {
  const targets = getNotificationTargets();
  const hasTelegram = Boolean(getSetting('telegram_bot_token')) && parseIdList(getSetting('telegram_chat_ids')).length > 0;
  const hasDiscord = parseIdList(getSetting('discord_webhook_urls')).length > 0;
  if (!hasTelegram && !hasDiscord) {
    return { ok: false, message: '请先配置至少一个通知渠道（Telegram 或 Discord）' };
  }
  await notify(`✅ TMDB Movie 测试通知\n时间：${new Date().toLocaleString('zh-CN')}\n若收到此消息，说明通知配置正常。`);
  return { ok: true, message: `测试消息已发送至：${targets.join(', ')}` };
}
