const CHARS = '0123456789';

export function generateRoomCode(length = 4): string {
  const buf = new Uint32Array(length);
  globalThis.crypto.getRandomValues(buf);
  return Array.from(buf, n => CHARS[n % CHARS.length]).join('');
}
