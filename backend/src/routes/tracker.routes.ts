import { Router, Request, Response } from 'express';
import { cloudStorageService } from '../services/cloud-storage.service.js';
import { trackerService } from '../services/tracker.service.js';
import { createTask, deleteTask, getTask, listTasks, updateTask, TrackerTask } from '../services/trackerStore.js';

export const trackerRouter = Router();

function validateShareTask(body: any): string | null {
  const shareUrl = String(body?.shareUrl || '').trim();
  if (!shareUrl) return '请填写分享链接';
  const panType = cloudStorageService.resolvePanType(shareUrl);
  if (!panType) return '仅支持夸克网盘（quark.cn）分享链接追踪';
  if (panType === '115') return '115 快照无法检测更新，暂不支持追剧追踪（可手动转存）';
  return null;
}

function normalizeInterval(body: any): { value: number; unit: 'minute' | 'hour' | 'day' } {
  const value = Number(body?.intervalValue ?? 6);
  const unit = String(body?.intervalUnit || 'hour');
  const validUnit = unit === 'minute' || unit === 'day' ? unit : 'hour';
  return { value: value > 0 ? value : 6, unit: validUnit };
}

/** 任务列表 */
trackerRouter.get('/tasks', (_req: Request, res: Response) => {
  res.json({ tasks: listTasks() });
});

/** 创建任务 */
trackerRouter.post('/tasks', (req: Request, res: Response) => {
  const body = req.body || {};
  const type = body.type === 'tmdb' ? 'tmdb' : 'share';
  const interval = normalizeInterval(body);

  if (type === 'tmdb') {
    const tmdbId = Number(body.tmdbId);
    if (!tmdbId) {
      res.status(400).json({ error: '缺少 TMDB ID', code: 'BAD_REQUEST' });
      return;
    }
    const name = String(body.name || '').trim() || `TMDB #${tmdbId}`;
    const existing = listTasks().find((t) => t.type === 'tmdb' && t.tmdbId === tmdbId && t.status === 'active');
    if (existing) {
      res.status(400).json({ error: `已在追剧「${existing.name}」，请勿重复订阅`, code: 'DUPLICATE' });
      return;
    }
    const task = createTask({
      type: 'tmdb',
      name,
      tmdbId,
      mediaType: 'tv',
      intervalValue: interval.value,
      intervalUnit: interval.unit,
      status: 'active',
    });
    // 立即跑一次，初始化 lastKnownEpisode（不触发首次通知）
    void trackerService.executeTask(task).catch(() => {});
    res.json({ ok: true, task });
    return;
  }

  // share 型
  const err = validateShareTask(body);
  if (err) {
    res.status(400).json({ error: err, code: 'BAD_REQUEST' });
    return;
  }
  const shareUrl = String(body.shareUrl).trim();
  const shareCode = cloudStorageService.extractShareCode(shareUrl);
  const panType = cloudStorageService.resolvePanType(shareUrl) as 'quark';
  const name = String(body.name || '').trim() || `quark-${shareCode}`;
  const targetFolderId = String(body.targetFolderId || '0');

  const existing = listTasks().find((t) => t.type === 'share' && t.shareUrl === shareUrl && t.status === 'active');
  if (existing) {
    res.status(400).json({ error: `该分享链接已在追踪中（任务 #${existing.id}）`, code: 'DUPLICATE' });
    return;
  }

  const task = createTask({
    type: 'share',
    name,
    shareUrl,
    panType,
    targetFolderId,
    intervalValue: interval.value,
    intervalUnit: interval.unit,
    status: 'active',
  });
  // 立即初始化快照（记录当前已有文件，避免首次运行误转存全部内容）
  void (async () => {
    try {
      const cookie = (await import('../settingsStore.js')).getSetting('cookie_quark');
      if (cookie) {
        const snap = await cloudStorageService.getShareSnap('quark', cookie, shareUrl);
        updateTask(task.id, { lastFileIds: JSON.stringify(snap.map((f) => f.id)) });
      }
    } catch (e) {
      // 快照初始化失败不阻塞任务创建
    }
  })();
  res.json({ ok: true, task });
});

/** 更新任务（间隔/名称/状态） */
trackerRouter.put('/tasks/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const task = getTask(id);
  if (!task) {
    res.status(404).json({ error: '任务不存在', code: 'NOT_FOUND' });
    return;
  }
  const patch: Partial<TrackerTask> = {};
  if (req.body?.name !== undefined) patch.name = String(req.body.name).trim() || task.name;
  if (req.body?.status !== undefined) {
    patch.status = req.body.status === 'paused' ? 'paused' : 'active';
  }
  if (req.body?.intervalValue !== undefined || req.body?.intervalUnit !== undefined) {
    const interval = normalizeInterval(req.body);
    patch.intervalValue = interval.value;
    patch.intervalUnit = interval.unit;
  }
  const updated = updateTask(id, patch);
  res.json({ ok: true, task: updated });
});

/** 删除任务 */
trackerRouter.delete('/tasks/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!deleteTask(id)) {
    res.status(404).json({ error: '任务不存在', code: 'NOT_FOUND' });
    return;
  }
  res.json({ ok: true });
});

/** 手动立即运行 */
trackerRouter.post('/tasks/:id/run', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const task = getTask(id);
  if (!task) {
    res.status(404).json({ error: '任务不存在', code: 'NOT_FOUND' });
    return;
  }
  res.json({ ok: true, message: '任务已启动' });
  void trackerService.executeTask(task).catch(() => {});
});
