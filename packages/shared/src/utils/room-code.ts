// Excludes 0, O, 1, I, L to avoid confusion
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateRoomCode(length = 4): string {
  const buf = new Uint32Array(length);
  globalThis.crypto.getRandomValues(buf);
  return Array.from(buf, n => CHARS[n % CHARS.length]).join('');
}
