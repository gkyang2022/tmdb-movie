import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { logger } from './logger.js';

const TOKEN_TTL = '7d';

export interface AuthRequest extends Request {
  user?: { username: string };
}

export function signToken(username: string): string {
  return jwt.sign({ username }, config.authSecret, { expiresIn: TOKEN_TTL });
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

  if (username === config.adminUsername && password === config.adminPassword) {
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
