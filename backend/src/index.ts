import { createApp } from './app.js';
import { config, warnIfInsecure } from './config.js';
import { logger } from './logger.js';
import fs from 'node:fs';

warnIfInsecure();

// 确保 data 目录存在
fs.mkdirSync(config.dataDir, { recursive: true });

const app = createApp();

app.listen(config.port, () => {
  logger.info(`TMDB Movie backend 已启动: http://0.0.0.0:${config.port}`);
  logger.info(`数据目录: ${config.dataDir}`);
});
