import { Router, Request, Response } from 'express';
import { getSetting } from '../settingsStore.js';
import { cloudStorageService } from '../services/cloud-storage.service.js';

export const transferRouter = Router();

/**
 * 网盘转存
 * POST /api/transfer
 * body: { shareUrl: string, type?: 'quark' | '115'（自动识别兜底） }
 * 转存目标：settings 中 cookie_{type} + folder_id_{type}
 */
transferRouter.post('/', async (req: Request, res: Response) => {
  const shareUrl = String(req.body?.shareUrl || '').trim();
  if (!shareUrl) {
    res.status(400).json({ error: '请填写分享链接', code: 'BAD_REQUEST' });
    return;
  }

  const type = String(req.body?.type || '') === '115' ? '115' : 'quark';
  const cookie = getSetting(type === '115' ? 'cookie_115' : 'cookie_quark');
  const folderId = getSetting(type === '115' ? 'folder_id_115' : 'folder_id_quark') || '0';

  if (!cookie) {
    res.status(400).json({ error: `未配置${type === '115' ? '115' : '夸克'} Cookie，请先在「设置」页添加`, code: 'NOT_CONFIGURED' });
    return;
  }

  const result =
    type === '115'
      ? await cloudStorageService.saveTo115(cookie, shareUrl, folderId)
      : await cloudStorageService.saveToQuark(cookie, shareUrl, folderId);

  if (result.success) {
    res.json({
      ok: true,
      message: result.message,
      names: result.names || [],
    });
  } else {
    res.status(400).json({
      ok: false,
      error: result.message,
      errorType: result.errorType || 'system',
    });
  }
});

/** 配置状态查询（前端用于提示） */
transferRouter.get('/config', (_req: Request, res: Response) => {
  res.json({
    quark: {
      configured: Boolean(getSetting('cookie_quark')),
      folderId: getSetting('folder_id_quark') || '0',
    },
    '115': {
      configured: Boolean(getSetting('cookie_115')),
      folderId: getSetting('folder_id_115') || '0',
    },
  });
});
