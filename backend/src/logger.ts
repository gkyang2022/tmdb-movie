export const logger = {
  info: (msg: string, meta?: unknown): void => {
    console.log(`[${new Date().toISOString()}] [info] ${msg}`, meta ? JSON.stringify(meta) : '');
  },
  warn: (msg: string, meta?: unknown): void => {
    console.warn(`[${new Date().toISOString()}] [warn] ${msg}`, meta ? JSON.stringify(meta) : '');
  },
  error: (msg: string, meta?: unknown): void => {
    console.error(`[${new Date().toISOString()}] [error] ${msg}`, meta ? JSON.stringify(meta) : '');
  },
  debug: (msg: string, meta?: unknown): void => {
    if (process.env.DEBUG) {
      console.debug(`[${new Date().toISOString()}] [debug] ${msg}`, meta ? JSON.stringify(meta) : '');
    }
  },
};
