import { DEFAULT_CONFIG, generateRoomCode } from '@callbreak/shared';
import type { Room } from '@callbreak/shared';
import { ROOM_TTL_MS } from '../config.js';
import { logger } from '../lib/logger.js';

const rooms = new Map<string, Room>();

export function createRoom(hostSessionId: string, config: Partial<typeof DEFAULT_CONFIG>): Room {
  let code: string;
  do { code = generateRoomCode(); } while (rooms.has(code));

  const room: Room = {
    code,
    hostSessionId,
    config: { ...DEFAULT_CONFIG, ...config },
    players: [],
    game: { phase: 'waiting', round: null, scores: [], currentTurnSeat: null, turnDeadline: null },
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };
  rooms.set(code, room);
  logger.info(`Room created: ${code}`);
  return room;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code);
}

export function deleteRoom(code: string): void {
  rooms.delete(code);
  logger.info(`Room deleted: ${code}`);
}

export function touchRoom(code: string): void {
  const r = rooms.get(code);
  if (r) r.lastActivity = Date.now();
}

export function findRoomBySessionId(sessionId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.players.some(p => p.sessionId === sessionId)) return room;
  }
  return undefined;
}

// Sweep rooms inactive beyond TTL every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.lastActivity > ROOM_TTL_MS) {
      rooms.delete(code);
      logger.info(`Room expired: ${code}`);
    }
  }
}, 5 * 60 * 1000);
