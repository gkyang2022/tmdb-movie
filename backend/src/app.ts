import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authRouter, authMiddleware } from './auth.js';
import { tmdbRouter } from './routes/tmdb.routes.js';
import { settingsRouter } from './routes/settings.routes.js';

export function createApp(): express.Express {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  // 健康检查
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 认证
  app.use('/api/auth', authRouter);

  // 需要登录的接口
  app.use('/api/settings', authMiddleware, settingsRouter);
  app.use('/api/tmdb', authMiddleware, tmdbRouter);

  // 404
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
  });

  // 统一错误处理
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[app] 未处理错误', err);
    res.status(500).json({ error: '服务器内部错误' });
  });

  return app;
}
