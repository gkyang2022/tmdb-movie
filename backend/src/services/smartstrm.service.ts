import axios from 'axios';
import { getSetting } from '../settingsStore.js';
import { logger } from '../logger.js';

/**
 * SmartStrm Webhook 触发服务
 * 文档：https://smartstrm.github.io/settings/webhook
 *
 * SmartStrm 接收 POST webhook 后：
 *   1. 根据 task.name 找到对应任务
 *   2. 根据 task.storage_path 定位到具体存储路径
 *   3. 扫描该路径下所有文件，生成 .strm
 */

interface SmartStrmPayload {
  event: 'a_task';
  task: {
    name: string;
    storage_path?: string;
    dir_time_check?: boolean;
    incremental?: boolean;
    keep_local_asset?: boolean;
    plugins?: Record<string, unknown>;
  };
  delay?: number;
  strm?: {
    media_ext?: string[];
    url_encode?: boolean;
    media_size?: number;
    copy_ext?: string[];
  };
}

/**
 * 触发 SmartStrm 扫描指定任务
 * @param taskName SmartStrm 中的任务名（如 "movie"、"tv"）
 * @param storagePath 可选，覆盖任务的扫描路径
 */
export async function triggerSmartStrm(
  taskName: string,
  storagePath?: string,
): Promise<{ success: boolean; message: string }> {
  const webhookUrl = getSetting('smartstrm_webhook_url');

  if (!webhookUrl) {
    return { success: false, message: '未配置 SmartStrm Webhook 地址，请在设置页填写' };
  }

  const url = webhookUrl.trim();
  if (!url.startsWith('http')) {
    return { success: false, message: 'SmartStrm Webhook 地址格式错误（需以 http/https 开头）' };
  }

  const payload: SmartStrmPayload = {
    event: 'a_task',
    task: {
      name: taskName,
      ...(storagePath ? { storage_path: storagePath } : {}),
      dir_time_check: false,
      incremental: true,
    },
    delay: 3, // 等待 3 秒让网盘写入完成
    strm: {
      media_ext: ['mp4', 'mkv', 'mov', 'avi', 'flv', 'm4v', 'ts'],
      url_encode: true,
    },
  };

  try {
    const res = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    // SmartStrm 成功时返回 { success: true } 或 { code: 0 }
    const data = res.data;
    if (data?.success === false) {
      logger.warn('[SmartStrm] Webhook returned error', { message: data.message });
      return { success: false, message: data.message || 'SmartStrm 触发失败' };
    }

    logger.info('[SmartStrm] Webhook triggered', { taskName, storagePath });
    return { success: true, message: `已通知 SmartStrm 刷新「${taskName}」任务` };
  } catch (e: any) {
    const status = e?.response?.status;
    const errMsg = e?.response?.data?.message || e?.message;

    if (status === 401 || status === 403) {
      return { success: false, message: 'SmartStrm Webhook Token 无效，请检查设置页的 Webhook 地址是否正确' };
    }
    if (status === 404) {
      return { success: false, message: `SmartStrm 中未找到任务「${taskName}」，请先在 SmartStrm 创建对应任务` };
    }

    logger.error('[SmartStrm] Webhook request failed', { error: e, status });
    return { success: false, message: `SmartStrm 请求失败: ${errMsg}` };
  }
}

/**
 * 根据内容类型推断 SmartStrm 任务名
 */
export function inferTaskName(contentType: 'movie' | 'tv' | 'anime' | undefined): string {
  if (contentType === 'tv') return 'tv';
  if (contentType === 'anime') return 'anime';
  return 'movie';
}
