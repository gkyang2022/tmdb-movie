import { describe, it, expect } from 'vitest';
import { encryptSecret, decryptSecret } from '../settingsStore.js';
import { config } from '../config.js';

describe('settingsStore 加密', () => {
  it('AES-256-GCM 加解密往返一致', () => {
    const secret = 'eyJhbGciOiJIUzI1NiJ9.test-token-1234567890';
    const enc = encryptSecret(secret);
    expect(enc).not.toContain(secret);
    expect(enc.split(':')).toHaveLength(3);
    expect(decryptSecret(enc)).toBe(secret);
  });

  it('同一明文两次加密结果不同（随机 IV）', () => {
    const a = encryptSecret('same-value');
    const b = encryptSecret('same-value');
    expect(a).not.toBe(b);
  });

  it('篡改数据后解密失败', () => {
    const enc = encryptSecret('secret-data');
    const parts = enc.split(':');
    const tampered = `${parts[0]}:${parts[1]}:${parts[2].slice(0, -4)}ffff`;
    expect(() => decryptSecret(tampered)).toThrow();
  });
});

describe('config 默认值', () => {
  it('开发默认值存在', () => {
    expect(config.port).toBeGreaterThan(0);
    expect(config.cacheTtl).toBeGreaterThan(0);
  });
});
