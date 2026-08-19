import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { logger } from './logger.js';
import { getSetting, setSetting } from './settingsStore.js';

const TOKEN_TTL = '7d';
const ADMIN_PASSWORD_KEY = 'admin_password';

export interface AuthRequest extends Request {
  user?: { username: string };
}

export function signToken(username: string): string {
  return jwt.sign({ username }, config.authSecret, { expiresIn: TOKEN_TTL });
}

/** 获取当前生效的管理员密码（运行时设置的 > 环境变量） */
function getEffectiveAdminPassword(): string {
  const stored = getSetting(ADMIN_PASSWORD_KEY);
  if (stored && typeof stored === 'string' && stored.length > 0) {
    return stored;
  }
  return config.adminPassword;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    res.status(401).json({ error: '未登录' });
    return;
  }

  try {
    const payload = jwt.verify(token, config.authSecret) as { username: string };
    req.user = { username: payload.username };
    next();
  } catch {
    res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

export const authRouter = Router();

authRouter.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body || {};

  if (username === config.adminUsername && password === getEffectiveAdminPassword()) {
    const token = signToken(username);
    logger.info('管理员登录成功');
    res.json({
      token,
      username,
      token_expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    });
    return;
  }

  res.status(401).json({ error: '用户名或密码错误' });
});

// 修改当前管理员密码（已登录状态下）
authRouter.post('/change-password', authMiddleware, (req: AuthRequest, res: Response) => {
  if (req.user?.username !== config.adminUsername) {
    res.status(403).json({ error: '无权限' });
    return;
  }
  const { oldPassword, newPassword } = req.body || {};
  if (typeof oldPassword !== 'string' || typeof newPassword !== 'string') {
    res.status(400).json({ error: '参数不完整' });
    return;
  }
  if (newPassword.length < 6 || newPassword.length > 128) {
    res.status(400).json({ error: '新密码长度需在 6-128 之间' });
    return;
  }
  if (oldPassword !== getEffectiveAdminPassword()) {
    res.status(401).json({ error: '旧密码错误' });
    return;
  }
  if (oldPassword === newPassword) {
    res.status(400).json({ error: '新密码不能与旧密码相同' });
    return;
  }
  try {
    setSetting(ADMIN_PASSWORD_KEY, newPassword);
    logger.info('管理员密码已更新');
    res.json({ ok: true, message: '密码已更新' });
  } catch (e: any) {
    logger.error('保存新密码失败', e);
    res.status(500).json({ error: '保存失败' });
  }
});
