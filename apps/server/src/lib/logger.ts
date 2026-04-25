import { LOG_LEVEL } from '../config.js';

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const current = LEVELS[LOG_LEVEL as keyof typeof LEVELS] ?? 1;

function log(level: keyof typeof LEVELS, ...args: unknown[]) {
  if (LEVELS[level] >= current) {
    const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}]`;
    console[level === 'debug' ? 'log' : level](prefix, ...args);
  }
}

export const logger = {
  debug: (...a: unknown[]) => log('debug', ...a),
  info: (...a: unknown[]) => log('info', ...a),
  warn: (...a: unknown[]) => log('warn', ...a),
  error: (...a: unknown[]) => log('error', ...a),
};
