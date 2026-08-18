import { Router, Request, Response } from 'express';
import { pansouService } from '../services/pansou.service.js';

export const pansouRouter = Router();

/** GET /api/pansou/search?keyword=片名&refresh=1 */
pansouRouter.get('/search', async (req: Request, res: Response) => {
  const keyword = String(req.query.keyword || '').trim();
  if (!keyword) {
    res.status(400).json({ ok: false, error: '缺少搜索关键词', code: 'BAD_REQUEST' });
    return;
  }
  try {
    const refresh = req.query.refresh === '1' || req.query.refresh === 'true';
    const items = await pansouService.search(keyword, refresh);
    res.json({ ok: true, keyword, count: items.length, items });
  } catch (e: any) {
    const status = e.code === 'PANSOU_NOT_CONFIGURED' ? 400 : 502;
    res.status(status).json({ ok: false, error: e.message, code: e.code || 'PANSOU_ERROR' });
  }
});
