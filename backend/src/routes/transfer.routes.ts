import { Router, Request, Response } from 'express';
import { getSetting, getFolderId } from '../settingsStore.js';
import { cloudStorageService } from '../services/cloud-storage.service.js';
import { triggerSmartStrm, inferTaskName } from '../services/smartstrm.service.js';
import { logger } from '../logger.js';

export const transferRouter = Router();

/**
 * 网盘转存
 * POST /api/transfer
 * body: { shareUrl: string, type?: 'quark' | '115', contentType?: 'movie' | 'tv' | 'anime' }
 * 转存目标：根据 contentType 路由到对应分类目录
 */
transferRouter.post('/', async (req: Request, res: Response) => {
  const shareUrl = String(req.body?.shareUrl || '').trim();
  if (!shareUrl) {
    res.status(400).json({ error: '请填写分享链接', code: 'BAD_REQUEST' });
    return;
  }

  const type = String(req.body?.type || '') === '115' ? '115' : 'quark';
  const contentType = req.body?.contentType as 'movie' | 'tv' | 'anime' | undefined;
  const cookie = getSetting(type === '115' ? 'cookie_115' : 'cookie_quark');
  const folderId = getFolderId(type, contentType);

  if (!cookie) {
    res.status(400).json({ error: `未配置${type === '115' ? '115' : '夸克'} Cookie，请先在「设置」页添加`, code: 'NOT_CONFIGURED' });
    return;
  }

  const result =
    type === '115'
      ? await cloudStorageService.saveTo115(cookie, shareUrl, folderId)
      : await cloudStorageService.saveToQuark(cookie, shareUrl, folderId);

  if (result.success) {
    // 转存成功后，异步触发 SmartStrm 刷新（不阻塞转存结果）
    triggerSmartStrm(inferTaskName(contentType))
      .then(({ success, message }) => {
        if (success) {
          logger.info('[transfer] SmartStrm triggered', { contentType });
        } else {
          logger.warn('[transfer] SmartStrm trigger skipped', { reason: message });
        }
      })
      .catch((e) => logger.error('[transfer] SmartStrm trigger error', { e }));

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

/** 获取网盘目录列表 */
transferRouter.get('/folders', async (req: Request, res: Response) => {
  try {
    const type = req.query.type === '115' ? '115' : 'quark';
    const parentId = String(req.query.parentId || '0');
    const cookie = getSetting(type === '115' ? 'cookie_115' : 'cookie_quark');

    if (!cookie) {
      res.status(400).json({ error: `未配置${type === '115' ? '115' : '夸克'} Cookie`, code: 'NOT_CONFIGURED' });
      return;
    }

    const folders = await cloudStorageService.listFolders(type, cookie, parentId);
    res.json({ folders });
  } catch (error: any) {
    res.status(500).json({ error: error.message || '获取目录失败' });
  }
});
