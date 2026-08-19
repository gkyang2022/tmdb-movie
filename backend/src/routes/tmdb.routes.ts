import { Router, Request, Response } from 'express';
import { tmdbService, TmdbKeyError } from '../services/tmdb.service.js';
import { logger } from '../logger.js';

export const tmdbRouter = Router();

function handleError(res: Response, e: unknown): void {
  if (e instanceof TmdbKeyError) {
    res.status(e.code === 'TMDB_NOT_CONFIGURED' ? 400 : 502).json({ error: e.message, code: e.code });
    return;
  }
  logger.error('[tmdb] 未预期错误', e);
  res.status(500).json({ error: '服务器内部错误' });
}

function parseType(v: unknown, def: 'movie' | 'tv' = 'movie'): 'movie' | 'tv' {
  return v === 'tv' ? 'tv' : def;
}

tmdbRouter.get('/trending', async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as string) || 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const data = await tmdbService.getTrending(type as 'movie' | 'tv' | 'all', page);
    res.json(data);
  } catch (e) { handleError(res, e); }
});

tmdbRouter.get('/popular', async (req: Request, res: Response) => {
  try {
    const type = parseType(req.query.type);
    const page = Math.max(1, Number(req.query.page) || 1);
    res.json(await tmdbService.getPopular(type, page));
  } catch (e) { handleError(res, e); }
});

tmdbRouter.get('/top-rated', async (req: Request, res: Response) => {
  try {
    const type = parseType(req.query.type);
    const page = Math.max(1, Number(req.query.page) || 1);
    res.json(await tmdbService.getTopRated(type, page));
  } catch (e) { handleError(res, e); }
});

tmdbRouter.get('/now-playing', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    res.json(await tmdbService.getNowPlaying(page));
  } catch (e) { handleError(res, e); }
});

tmdbRouter.get('/upcoming', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    res.json(await tmdbService.getUpcoming(page));
  } catch (e) { handleError(res, e); }
});

tmdbRouter.get('/on-the-air', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    res.json(await tmdbService.getOnTheAir(page));
  } catch (e) { handleError(res, e); }
});

tmdbRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) {
      res.status(400).json({ error: '缺少搜索关键词 q', code: 'BAD_REQUEST' });
      return;
    }
    const type = (req.query.type as string) || 'multi';
    const page = Math.max(1, Number(req.query.page) || 1);
    res.json(await tmdbService.search(q, type as 'movie' | 'tv' | 'multi', page));
  } catch (e) { handleError(res, e); }
});

tmdbRouter.get('/detail/:type/:id', async (req: Request, res: Response) => {
  try {
    const type = parseType(req.params.type);
    const id = String(req.params.id);
    if (!/^\d+$/.test(id)) {
      res.status(400).json({ error: 'ID 格式错误', code: 'BAD_REQUEST' });
      return;
    }
    res.json(await tmdbService.getDetail(type, id));
  } catch (e) { handleError(res, e); }
});
