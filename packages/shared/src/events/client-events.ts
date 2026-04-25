import type { RoomConfig } from '../types/room.js';

export type AckResult<T = Record<string, never>> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export interface ClientToServerEvents {
  'room:create': (
    payload: { name: string; sessionId: string; avatarUrl?: string; config: Partial<RoomConfig> },
    ack: (r: AckResult<{ code: string }>) => void
  ) => void;

  'room:join': (
    payload: { code: string; name: string; sessionId: string; avatarUrl?: string },
    ack: (r: AckResult<{ seat: number }>) => void
  ) => void;

  'room:leave': () => void;

  'room:updateConfig': (
    payload: { config: Partial<RoomConfig> },
    ack: (r: AckResult) => void
  ) => void;

  'room:kick': (payload: { seat: number }) => void;

  'room:addBot': (payload: { seat: number }, ack: (r: AckResult) => void) => void;

  'game:start': (ack: (r: AckResult) => void) => void;

  'game:bid': (
    payload: { bid: number },
    ack: (r: AckResult) => void
  ) => void;

  'game:play': (
    payload: { cardId: string },
    ack: (r: AckResult) => void
  ) => void;

  'game:rematch': () => void;

  'chat:send': (payload: { text: string }) => void;

  'session:resume': (
    payload: { sessionId: string },
    ack: (r: AckResult<{ code?: string; seat?: number }>) => void
  ) => void;
}
