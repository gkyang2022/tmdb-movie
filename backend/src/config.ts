import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  port: Number(process.env.PORT || 8008),
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  authSecret: process.env.AUTH_SECRET || 'dev-insecure-auth-secret-change-me',
  encryptionKey: process.env.ENCRYPTION_KEY || '',
  tmdbApiKey: process.env.TMDB_API_KEY || '',
  tmdbLanguage: process.env.TMDB_LANGUAGE || 'zh-CN',
  imageProxyBase: process.env.IMAGE_PROXY_BASE || '',
  cacheTtl: Number(process.env.CACHE_TTL || 3600),
  dataDir: process.env.DATA_DIR || path.join(__dirname, '..', 'data'),
  settingsFile: process.env.SETTINGS_FILE || path.join(__dirname, '..', 'data', 'settings.json'),
};

export function warnIfInsecure(): void {
  const warnings: string[] = [];
  if (!process.env.ENCRYPTION_KEY) {
    warnings.push('ENCRYPTION_KEY 未设置：settings 中的 TMDB API Key 将以明文存储（仅限开发）。生产请设置（openssl rand -hex 32）');
  }
  if (!process.env.AUTH_SECRET) {
    warnings.push('AUTH_SECRET 未设置：使用开发默认 JWT 密钥（仅限开发）。生产请设置。');
  }
  if (!process.env.ADMIN_PASSWORD) {
    warnings.push('ADMIN_PASSWORD 未设置：使用默认密码 admin123。生产请务必修改！');
  }
  for (const w of warnings) {
    console.warn(`[config] ⚠️  ${w}`);
  }
}
