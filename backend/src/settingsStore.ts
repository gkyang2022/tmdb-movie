import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import { logger } from './logger.js';

// ---------------- AES-256-GCM 加密 ----------------

function getEncryptionKey(): Buffer {
  if (config.encryptionKey) {
    const buf = Buffer.from(config.encryptionKey, 'hex');
    if (buf.length === 32) return buf;
    logger.warn('ENCRYPTION_KEY 不是 64 位 hex，回退为 sha256 派生（不推荐）');
  }
  // 开发默认：从 authSecret 派生。生产必须显式设置 ENCRYPTION_KEY。
  return crypto.createHash('sha256').update(config.authSecret).digest();
}

export function encryptSecret(plain: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptSecret(payload: string): string {
  const key = getEncryptionKey();
  const [ivHex, tagHex, dataHex] = payload.split(':');
  if (!ivHex || !tagHex || !dataHex) throw new Error('加密数据格式错误');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]).toString('utf8');
}

// ---------------- settings.json 存储 ----------------

interface SettingsFile {
  [key: string]: string; // 加密后的值或明文值
}

let cache: SettingsFile | null = null;

function load(): SettingsFile {
  if (cache) return cache;
  try {
    if (fs.existsSync(config.settingsFile)) {
      cache = JSON.parse(fs.readFileSync(config.settingsFile, 'utf8')) as SettingsFile;
    } else {
      cache = {};
    }
  } catch (e) {
    logger.error('读取 settings.json 失败', e);
    cache = {};
  }
  return cache;
}

function persist(): void {
  try {
    fs.mkdirSync(path.dirname(config.settingsFile), { recursive: true });
    fs.writeFileSync(config.settingsFile, JSON.stringify(cache, null, 2), 'utf8');
  } catch (e) {
    logger.error('写入 settings.json 失败', e);
  }
}

/** 读取设置项（自动解密） */
export function getSetting(key: string): string {
  const raw = load()[key];
  if (!raw) return '';
  try {
    return decryptSecret(raw);
  } catch {
    // 兼容历史明文存储
    return raw;
  }
}

/** 写入设置项（自动加密） */
export function setSetting(key: string, value: string): void {
  const store = load();
  store[key] = value ? encryptSecret(value) : '';
  persist();
}

/** 读取脱敏值（仅用于前端回显，如 sk_****1234） */
export function getSettingMasked(key: string): string {
  const val = getSetting(key);
  if (!val) return '';
  if (val.length <= 8) return '****';
  return `${val.slice(0, 3)}****${val.slice(-4)}`;
}
