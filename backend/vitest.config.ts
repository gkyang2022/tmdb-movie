import { defineConfig } from 'vitest/config';
import path from 'node:path';

// 测试数据隔离：所有测试写入 .test-data 临时目录，避免污染真实 data/
export default defineConfig({
  test: {
    env: {
      DATA_DIR: path.join(process.cwd(), '.test-data'),
      SETTINGS_FILE: path.join(process.cwd(), '.test-data', 'settings.json'),
      TRACKER_FILE: path.join(process.cwd(), '.test-data', 'tracker.json'),
      ENCRYPTION_KEY: '0'.repeat(64),
    },
  },
});
