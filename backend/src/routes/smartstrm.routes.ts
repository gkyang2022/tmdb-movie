import { Router, Request, Response } from 'express';
import { triggerSmartStrm } from '../services/smartstrm.service.js';

export const smartstrmRouter = Router();

/**
 * POST /api/smartstrm/notify
 * 手动触发 SmartStrm 刷新指定任务
 * body: { taskName?: string, contentType?: 'movie' | 'tv' | 'anime' }
 */
smartstrmRouter.post('/notify', async (req: Request, res: Response) => {
  const taskName = req.body?.taskName as string | undefined;
  const contentType = req.body?.contentType as 'movie' | 'tv' | 'anime' | undefined;

  if (!taskName && !contentType) {
    res.status(400).json({ ok: false, error: '请提供 taskName 或 contentType 参数' });
    return;
  }

  const target = taskName || (contentType === 'tv' ? 'tv' : contentType === 'anime' ? 'anime' : 'movie');
  const result = await triggerSmartStrm(target);
  res.json(result);
});

/**
 * GET /api/smartstrm/status
 * 查询 SmartStrm 是否已配置
 */
smartstrmRouter.get('/status', (_req: Request, res: Response) => {
  const { getSetting } = require('../settingsStore.js');
  const webhookUrl = getSetting('smartstrm_webhook_url');
  res.json({ configured: Boolean(webhookUrl) });
});
