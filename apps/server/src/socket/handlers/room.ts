import { v4 as uuidv4 } from 'uuid';
import type { TypedIO, TypedSocket } from '../server.js';
import { createRoom, getRoom, touchRoom } from '../../game/room-manager.js';
import { setSocketSession } from './connection.js';
import { logger } from '../../lib/logger.js';
import type { Seat } from '@callbreak/shared';
import { DEFAULT_CONFIG, PLAYER_COUNT } from '@callbreak/shared';
import { buildRoomView } from '../../game/view.js';
import { broadcastRoomState } from './broadcast.js';

const MIN_TURN_TIMEOUT_MS = 5000;
const MAX_TURN_TIMEOUT_MS = 120000;

function sanitizeConfigUpdate(config: Partial<typeof DEFAULT_CONFIG>): Partial<typeof DEFAULT_CONFIG> {
  const next: Partial<typeof DEFAULT_CONFIG> = {};

  if (typeof config.loserPenalty === 'string') {
    next.loserPenalty = config.loserPenalty.trim().slice(0, 200);
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
    if (!name?.trim() || name.length > 16) {
      ack({ ok: false, error: 'Name must be 1–16 characters' });
      return;
    }

    const room = createRoom(sessionId, sanitizeConfigUpdate(config));
    const seat: Seat = 0;

    room.players.push({
      id: socket.id,
      sessionId,
      name: name.trim(),
      seat,
      isHost: true,
      isBot: false,
      connected: true,
      avatarUrl,
      hand: [],
    });

    socket.join(room.code);
    setSocketSession(socket.id, { sessionId, roomCode: room.code, seat });

    const view = buildRoomView(room, seat);
    socket.emit('room:state', view);
    ack({ ok: true, data: { code: room.code } });
    logger.info(`Room created: ${room.code} by ${name}`);
  });

  socket.on('room:join', ({ code, name, sessionId, avatarUrl }, ack) => {
    if (!name?.trim() || name.length > 16) {
      ack({ ok: false, error: 'Name must be 1–16 characters' });
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

    const humanSeats = room.players.filter(p => !p.isBot).length;
    if (humanSeats >= PLAYER_COUNT) {
      ack({ ok: false, error: 'Room is full' });
      return;
    }

    // Find next free seat
    const takenSeats = new Set(room.players.map(p => p.seat));
    const seat = ([0, 1, 2, 3] as Seat[]).find(s => !takenSeats.has(s))!;

    room.players.push({
      id: socket.id,
      sessionId,
      name: name.trim(),
      seat,
      isHost: false,
      isBot: false,
      connected: true,
      avatarUrl,
      hand: [],
    });

    socket.join(room.code);
    setSocketSession(socket.id, { sessionId, roomCode: room.code, seat });
    touchRoom(room.code);

    broadcastRoomState(io, room);
    ack({ ok: true, data: { seat } });
    logger.info(`Player joined: ${name} room ${code} seat ${seat}`);
  });

  socket.on('room:leave', () => {
    // Handled via disconnect
  });

  socket.on('room:updateConfig', ({ config }, ack) => {
    const session = Array.from(socket.rooms).find(r => r !== socket.id);
    if (!session) { ack({ ok: false, error: 'Not in a room' }); return; }

    const room = getRoom(session);
    if (!room) { ack({ ok: false, error: 'Room not found' }); return; }

    const hostPlayer = room.players.find(p => p.sessionId === room.hostSessionId);
    if (hostPlayer?.id !== socket.id) { ack({ ok: false, error: 'Only host can update settings' }); return; }
    if (room.game.phase !== 'waiting') { ack({ ok: false, error: 'Settings can only be changed before the game starts' }); return; }

    room.config = { ...room.config, ...sanitizeConfigUpdate(config) };
    touchRoom(room.code);
    broadcastRoomState(io, room);
    ack({ ok: true, data: {} });
  });

  socket.on('room:kick', ({ seat }) => {
    const session = Array.from(socket.rooms).find(r => r !== socket.id);
    if (!session) return;
    const room = getRoom(session);
    if (!room) return;

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

    const hostPlayer = room.players.find(p => p.sessionId === room.hostSessionId);
    if (hostPlayer?.id !== socket.id) { ack({ ok: false, error: 'Only host can add bots' }); return; }
    if (room.game.phase !== 'waiting') { ack({ ok: false, error: 'Game already started' }); return; }
    if (room.players.some(p => p.seat === seat)) { ack({ ok: false, error: 'Seat taken' }); return; }

    const botNames = ['Arjun', 'Priya', 'Rajan', 'Sita', 'Dev', 'Meena'];
    const usedNames = new Set(room.players.map(p => p.name));
    const botName = botNames.find(n => !usedNames.has(n)) ?? `Bot${seat + 1}`;

    room.players.push({
      id: `bot-${seat}`,
      sessionId: `bot-session-${seat}`,
      name: botName,
      seat: seat as Seat,
      isHost: false,
      isBot: true,
      connected: true,
      hand: [],
    });

    touchRoom(room.code);
    broadcastRoomState(io, room);
    ack({ ok: true, data: {} });
    logger.info(`Bot added to room ${room.code} seat ${seat}`);
  });
}
