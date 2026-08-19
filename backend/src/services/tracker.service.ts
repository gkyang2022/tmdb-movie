import cron, { ScheduledTask } from 'node-cron';
import { logger } from '../logger.js';
import { getSetting } from '../settingsStore.js';
import { cloudStorageService, QuarkFile } from './cloud-storage.service.js';
import { tmdbService } from './tmdb.service.js';
import { notify } from './notify.service.js';
import { TrackerTask, listTasks, updateTask } from './trackerStore.js';

/**
 * 追剧提醒服务（定时任务）
 * - share 型：追踪夸克分享链接，发现新文件 → 自动转存到网盘 → 通知
 * - tmdb 型：订阅 TMDB 剧集，发现新集/新季 → 通知
 */
export class TrackerService {
  private static instance: TrackerService;
  private scheduleTask: ScheduledTask | null = null;
  private running = false;

  private constructor() {}

  public static getInstance(): TrackerService {
    if (!TrackerService.instance) {
      TrackerService.instance = new TrackerService();
    }
    return TrackerService.instance;
  }

  public start(): void {
    if (this.scheduleTask) return;
    logger.info('[TrackerService] 启动追剧调度器（每 10 分钟检查一次）');
    this.scheduleTask = cron.schedule('*/10 * * * *', () => {
      void this.checkAllTasks().catch((err: any) => {
        logger.error('[TrackerService] 调度检查失败', { error: err });
      });
    });
  }

  public stop(): void {
    if (this.scheduleTask) {
      this.scheduleTask.stop();
      this.scheduleTask = null;
    }
  }

  /** 计算任务间隔（毫秒） */
  private intervalMs(task: TrackerTask): number {
    const value = task.intervalValue || 6;
    const unit = task.intervalUnit || 'hour';
    if (unit === 'minute') return value * 60 * 1000;
    if (unit === 'day') return value * 24 * 60 * 60 * 1000;
    return value * 60 * 60 * 1000;
  }

  async checkAllTasks(): Promise<void> {
    if (this.running) return; // 防止重入
    this.running = true;
    try {
      const tasks = listTasks().filter((t) => t.status === 'active');
      const now = Date.now();
      for (const task of tasks) {
        const lastRun = task.lastRunAt ? new Date(task.lastRunAt).getTime() : 0;
        if (now - lastRun >= this.intervalMs(task)) {
          logger.info('[TrackerService] 执行任务', { id: task.id, name: task.name, type: task.type });
          await this.executeTask(task);
        }
      }
    } catch (error: any) {
      logger.error('[TrackerService] 批量检查失败', { error });
    } finally {
      this.running = false;
    }
  }

  async executeTask(task: TrackerTask): Promise<void> {
    const updateRun = async (status: 'success' | 'failed' | 'skipped', message: string) => {
      updateTask(task.id, {
        lastRunAt: new Date().toLocaleString('sv-SE'),
        lastRunStatus: status,
        lastRunMessage: message,
      });
    };

    try {
      if (task.type === 'tmdb') {
        await this.executeTmdbTask(task, updateRun);
      } else {
        await this.executeShareTask(task, updateRun);
      }
    } catch (error: any) {
      logger.error('[TrackerService] 任务执行失败', { id: task.id, name: task.name, error });
      await updateRun('failed', error.message || '运行失败');
    }
  }

  // ---------------- TMDB 剧集订阅 ----------------

  private async executeTmdbTask(
    task: TrackerTask,
    updateRun: (status: 'success' | 'failed' | 'skipped', message: string) => Promise<void>,
  ): Promise<void> {
    if (!task.tmdbId) {
      await updateRun('failed', '缺少 TMDB ID');
      return;
    }
    const info = await tmdbService.getTvTrackingInfo(task.tmdbId);
    const lastEpisode = info.last_episode_to_air;
    const nextEpisode = info.next_episode_to_air;

    if (!lastEpisode) {
      // 还没有播出任何一集（未开播/刚官宣）
      if (nextEpisode) {
        const label = `S${nextEpisode.season_number}E${nextEpisode.episode_number}`;
        if (task.lastKnownEpisode !== `next:${label}`) {
          await notify(
            `📺 追剧提醒：${info.name} 即将开播\n下一集：${label} ${nextEpisode.name || ''}\n播出日期：${nextEpisode.air_date || '待定'}\n${info.url}`,
          );
          updateTask(task.id, { lastKnownEpisode: `next:${label}` });
          await updateRun('success', `已提醒即将开播 ${label}`);
          return;
        }
        await updateRun('success', `待开播（${label}）`);
        return;
      }
      await updateRun('skipped', '暂无播出信息');
      return;
    }

    const label = `S${lastEpisode.season_number}E${lastEpisode.episode_number}`;
    // 首次运行：仅初始化已播状态，不触发通知
    if (!task.lastKnownEpisode) {
      updateTask(task.id, { lastKnownEpisode: label });
      await updateRun('success', `已订阅，当前最新 ${label}`);
      return;
    }
    if (task.lastKnownEpisode === label) {
      await updateRun('success', `无新集（最新 ${label}）`);
      return;
    }

    // 有新集
    const extra: string[] = [];
    if (task.lastKnownEpisode) {
      extra.push(`上一集：${task.lastKnownEpisode}`);
    }
    extra.push(`最新：${label} ${lastEpisode.name || ''}（${lastEpisode.air_date || '日期未知'}）`);
    if (nextEpisode) {
      extra.push(`下一集预告：S${nextEpisode.season_number}E${nextEpisode.episode_number} ${nextEpisode.name || ''}（${nextEpisode.air_date || '待定'}）`);
    }
    await notify(`📺 追剧提醒：${info.name} 更新了！\n${extra.join('\n')}\n${info.url}`);
    updateTask(task.id, { lastKnownEpisode: label });
    await updateRun('success', `发现新集 ${label}`);
  }

  // ---------------- 网盘分享链接追踪 ----------------

  private async executeShareTask(
    task: TrackerTask,
    updateRun: (status: 'success' | 'failed' | 'skipped', message: string) => Promise<void>,
  ): Promise<void> {
    if (!task.shareUrl) {
      await updateRun('failed', '分享链接为空');
      return;
    }

    const cookie = getSetting('cookie_quark');
    if (!cookie) {
      await updateRun('failed', '未配置夸克 Cookie');
      return;
    }
    if (!task.targetFolderId) {
      await updateRun('failed', '未配置目标目录');
      return;
    }

    // 当前分享快照（递归全量）
    const currentFiles = await cloudStorageService.getShareSnap('quark', cookie, task.shareUrl);
    if (currentFiles.length === 0) {
      await updateRun('failed', '分享链接无内容或无法访问');
      return;
    }

    let lastFileIds: string[] = [];
    try {
      lastFileIds = JSON.parse(task.lastFileIds || '[]');
    } catch {
      lastFileIds = [];
    }

    const newFiles = currentFiles.filter((f) => !lastFileIds.includes(f.id));

    if (newFiles.length === 0) {
      await updateRun('success', '无新内容');
      return;
    }

    // 过滤掉父目录也是新文件的项，避免重复转存（转存父目录会自动包含子项）
    const topLevelNewFiles = newFiles.filter((file) => !newFiles.some((p) => p.id === file.pid));

    logger.info('[TrackerService] 发现新内容', { taskId: task.id, name: task.name, count: topLevelNewFiles.length });

    // 转存（仅顶级新项）
    const transferRes = await cloudStorageService.saveToQuark(cookie, task.shareUrl, task.targetFolderId, topLevelNewFiles);

    if (!transferRes.success) {
      await updateRun('failed', transferRes.message || '转存失败');
      return;
    }

    // 更新已转存 ID 列表
    const updatedIds = [...new Set([...lastFileIds, ...currentFiles.map((f) => f.id)])];
    updateTask(task.id, { lastFileIds: JSON.stringify(updatedIds) });

    // 通知（通知失败不影响转存成功的判定）
    const fileNames = transferRes.names || [];
    const filesText = fileNames.length > 0 ? `（${fileNames.join(' | ')}）` : '';
    void notify(
      `🎬 追剧成功：${task.name} 发现 ${newFiles.length} 个新内容${filesText}\n已自动转存到夸克网盘`,
    ).catch((e: any) => logger.warn('[TrackerService] 通知发送失败，不影响任务状态', { e }));

    const successMessage = transferRes.message
      ? `${transferRes.message}，共${topLevelNewFiles.length}项`
      : `已转存${topLevelNewFiles.length}项`;
    await updateRun('success', successMessage);
  }
}

export const trackerService = TrackerService.getInstance();

export type { QuarkFile };
