export const PORT = parseInt(process.env['PORT'] ?? '3001', 10);
export const CORS_ORIGIN = process.env['CORS_ORIGIN'] ?? 'http://localhost:5173';
export const TURN_TIMEOUT_MS = parseInt(process.env['TURN_TIMEOUT_MS'] ?? '30000', 10);
export const ROOM_TTL_MS = parseInt(process.env['ROOM_TTL_MS'] ?? '7200000', 10);
export const LOG_LEVEL = process.env['LOG_LEVEL'] ?? 'info';
