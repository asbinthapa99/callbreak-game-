import { v4 as uuidv4 } from 'uuid';
import type { TypedIO, TypedSocket } from '../server.js';
import { createRoom, deleteRoom, getRoom, touchRoom } from '../../game/room-manager.js';
import { clearSocketSession, getSocketSession, setSocketSession } from './connection.js';
import { logger } from '../../lib/logger.js';
import type { Seat } from '@callbreak/shared';
import { DEFAULT_CONFIG } from '@callbreak/shared';
import { buildRoomView } from '../../game/view.js';
import { broadcastRoomState } from './broadcast.js';
import { fillEmptySeatsWithBots, findSeatForHuman, isSeat, makeBot } from '../../game/seating.js';

const MIN_TURN_TIMEOUT_MS = 5000;
const MAX_TURN_TIMEOUT_MS = 120000;
const MIN_TOTAL_ROUNDS = 1;
const MAX_TOTAL_ROUNDS = 10;
const MAX_AVATAR_URL_LENGTH = 10000;

function sanitizeName(name: string | undefined): string | null {
  const trimmed = name?.trim();
  if (!trimmed || trimmed.length > 16) return null;
  return trimmed;
}

function sanitizeSessionId(sessionId: string | undefined): string | null {
  const trimmed = sessionId?.trim();
  if (!trimmed || trimmed.length > 80) return null;
  return trimmed;
}

function sanitizeAvatarUrl(avatarUrl: string | undefined): string | undefined {
  if (typeof avatarUrl !== 'string') return undefined;
  if (avatarUrl.length > MAX_AVATAR_URL_LENGTH) return undefined;
  if (!avatarUrl.startsWith('data:image/') && !avatarUrl.startsWith('https://')) return undefined;
  return avatarUrl;
}

function sanitizeConfigUpdate(config: Partial<typeof DEFAULT_CONFIG> = {}): Partial<typeof DEFAULT_CONFIG> {
  const next: Partial<typeof DEFAULT_CONFIG> = {};

  if (typeof config.loserPenalty === 'string') {
    next.loserPenalty = config.loserPenalty.trim().slice(0, 200);
  }

  if (typeof config.customSettingsEnabled === 'boolean') {
    next.customSettingsEnabled = config.customSettingsEnabled;
  }

  if (typeof config.totalRounds === 'number' && Number.isFinite(config.totalRounds)) {
    next.totalRounds = Math.max(MIN_TOTAL_ROUNDS, Math.min(MAX_TOTAL_ROUNDS, Math.round(config.totalRounds)));
  }

  if (typeof config.turnTimeoutMs === 'number' && Number.isFinite(config.turnTimeoutMs)) {
    next.turnTimeoutMs = Math.max(MIN_TURN_TIMEOUT_MS, Math.min(MAX_TURN_TIMEOUT_MS, Math.round(config.turnTimeoutMs)));
  }

  if (typeof config.fillWithBots === 'boolean') {
    next.fillWithBots = config.fillWithBots;
  }

  if (typeof config.spadeBreakingEnabled === 'boolean') {
    next.spadeBreakingEnabled = config.spadeBreakingEnabled;
  }

  return next;
}

export function registerRoomHandlers(io: TypedIO, socket: TypedSocket): void {
  socket.on('room:create', ({ name, sessionId, avatarUrl, config }, ack) => {
    const cleanName = sanitizeName(name);
    if (!cleanName) {
      ack({ ok: false, error: 'Name must be 1–16 characters' });
      return;
    }
    const cleanSessionId = sanitizeSessionId(sessionId);
    if (!cleanSessionId) {
      ack({ ok: false, error: 'Invalid session' });
      return;
    }

    const room = createRoom(cleanSessionId, sanitizeConfigUpdate(config));
    const seat: Seat = 0;

    room.players.push({
      id: socket.id,
      sessionId: cleanSessionId,
      name: cleanName,
      seat,
      isHost: true,
      isBot: false,
      connected: true,
      avatarUrl: sanitizeAvatarUrl(avatarUrl),
      hand: [],
    });

    socket.join(room.code);
    setSocketSession(socket.id, { sessionId: cleanSessionId, roomCode: room.code, seat });

    const view = buildRoomView(room, seat);
    socket.emit('room:state', view);
    ack({ ok: true, data: { code: room.code } });
    logger.info(`Room created: ${room.code} by ${cleanName}`);
  });

  socket.on('room:join', ({ code, name, sessionId, avatarUrl }, ack) => {
    const cleanName = sanitizeName(name);
    if (!cleanName) {
      ack({ ok: false, error: 'Name must be 1–16 characters' });
      return;
    }
    const cleanSessionId = sanitizeSessionId(sessionId);
    if (!cleanSessionId) {
      ack({ ok: false, error: 'Invalid session' });
      return;
    }

    const room = getRoom(code.toUpperCase());
    if (!room) {
      ack({ ok: false, error: 'Room not found' });
      return;
    }

    if (room.game.phase !== 'waiting') {
      ack({ ok: false, error: 'Game already in progress' });
      return;
    }

    const seat = findSeatForHuman(room);
    if (seat === null) {
      ack({ ok: false, error: 'Room is full' });
      return;
    }

    room.players = room.players.filter(player => !(player.isBot && player.seat === seat));

    room.players.push({
      id: socket.id,
      sessionId: cleanSessionId,
      name: cleanName,
      seat,
      isHost: false,
      isBot: false,
      connected: true,
      avatarUrl: sanitizeAvatarUrl(avatarUrl),
      hand: [],
    });

    socket.join(room.code);
    setSocketSession(socket.id, { sessionId: cleanSessionId, roomCode: room.code, seat });
    touchRoom(room.code);

    broadcastRoomState(io, room);
    ack({ ok: true, data: { seat } });
    logger.info(`Player joined: ${cleanName} room ${code} seat ${seat}`);
  });

  socket.on('room:leave', () => {
    const session = getSocketSession(socket.id);
    if (!session) return;

    const room = getRoom(session.roomCode);
    clearSocketSession(socket.id);
    socket.leave(session.roomCode);
    if (!room) return;

    const player = room.players.find(p => p.sessionId === session.sessionId);
    if (!player) return;

    if (room.game.phase === 'waiting') {
      room.players = room.players.filter(p => p.sessionId !== session.sessionId);

      if (room.players.length === 0) {
        deleteRoom(room.code);
        return;
      }

      if (room.hostSessionId === session.sessionId) {
        const nextHost = room.players.find(p => !p.isBot) ?? room.players[0];
        room.hostSessionId = nextHost.sessionId;
        room.players = room.players.map(p => ({ ...p, isHost: p.sessionId === nextHost.sessionId }));
      }
    } else {
      player.connected = false;
    }

    touchRoom(room.code);
    broadcastRoomState(io, room);
  });

  socket.on('room:updateConfig', ({ config }, ack) => {
    const session = Array.from(socket.rooms).find(r => r !== socket.id);
    if (!session) { ack({ ok: false, error: 'Not in a room' }); return; }

    const room = getRoom(session);
    if (!room) { ack({ ok: false, error: 'Room not found' }); return; }

    const hostPlayer = room.players.find(p => p.sessionId === room.hostSessionId);
    if (hostPlayer?.id !== socket.id) { ack({ ok: false, error: 'Only host can update settings' }); return; }
    if (room.game.phase !== 'waiting') { ack({ ok: false, error: 'Settings can only be changed before the game starts' }); return; }

    const sanitized = sanitizeConfigUpdate(config);
    room.config = sanitized.customSettingsEnabled === false
      ? { ...DEFAULT_CONFIG }
      : { ...room.config, ...sanitized };
    touchRoom(room.code);
    broadcastRoomState(io, room);
    ack({ ok: true, data: {} });
  });

  socket.on('room:kick', ({ seat }) => {
    const session = Array.from(socket.rooms).find(r => r !== socket.id);
    if (!session) return;
    const room = getRoom(session);
    if (!room) return;
    if (!isSeat(seat)) return;

    const hostPlayer = room.players.find(p => p.sessionId === room.hostSessionId);
    if (hostPlayer?.id !== socket.id) return;

    const idx = room.players.findIndex(p => p.seat === seat && !p.isHost);
    if (idx === -1) return;
    room.players.splice(idx, 1);
    touchRoom(room.code);
    broadcastRoomState(io, room);
  });

  socket.on('room:addBot', ({ seat }, ack) => {
    const session = Array.from(socket.rooms).find(r => r !== socket.id);
    if (!session) { ack({ ok: false, error: 'Not in a room' }); return; }
    const room = getRoom(session);
    if (!room) { ack({ ok: false, error: 'Room not found' }); return; }
    if (!isSeat(seat)) { ack({ ok: false, error: 'Invalid seat' }); return; }

    const hostPlayer = room.players.find(p => p.sessionId === room.hostSessionId);
    if (hostPlayer?.id !== socket.id) { ack({ ok: false, error: 'Only host can add bots' }); return; }
    if (room.game.phase !== 'waiting') { ack({ ok: false, error: 'Game already started' }); return; }
    if (room.players.some(p => p.seat === seat)) { ack({ ok: false, error: 'Seat taken' }); return; }

    const usedNames = new Set(room.players.map(p => p.name));
    room.players.push(makeBot(seat, usedNames));

    touchRoom(room.code);
    broadcastRoomState(io, room);
    ack({ ok: true, data: {} });
    logger.info(`Bot added to room ${room.code} seat ${seat}`);
  });

  socket.on('room:fillBots', (ack) => {
    const session = Array.from(socket.rooms).find(r => r !== socket.id);
    if (!session) { ack({ ok: false, error: 'Not in a room' }); return; }
    const room = getRoom(session);
    if (!room) { ack({ ok: false, error: 'Room not found' }); return; }

    const hostPlayer = room.players.find(p => p.sessionId === room.hostSessionId);
    if (hostPlayer?.id !== socket.id) { ack({ ok: false, error: 'Only host can add bots' }); return; }
    if (room.game.phase !== 'waiting') { ack({ ok: false, error: 'Game already started' }); return; }

    const added = fillEmptySeatsWithBots(room);
    touchRoom(room.code);
    broadcastRoomState(io, room);
    ack({ ok: true, data: { added } });
  });
}
