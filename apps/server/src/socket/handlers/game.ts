import type { TypedIO, TypedSocket } from '../server.js';
import { getRoom, touchRoom } from '../../game/room-manager.js';
import { startGame, placeBid, playCard, rematch } from '../../game/game-engine.js';
import type { Seat } from '@callbreak/shared';
import { PLAYER_COUNT } from '@callbreak/shared';
import { logger } from '../../lib/logger.js';
import { broadcastRoomState } from './broadcast.js';
import { fillEmptySeatsWithBots, validateSeating } from '../../game/seating.js';

function getPlayerRoom(socket: TypedSocket) {
  const roomCode = Array.from(socket.rooms).find(r => r !== socket.id);
  if (!roomCode) return null;
  return getRoom(roomCode);
}

export function registerGameHandlers(io: TypedIO, socket: TypedSocket): void {
  socket.on('game:start', (ack) => {
    const room = getPlayerRoom(socket);
    if (!room) { ack({ ok: false, error: 'Not in a room' }); return; }

    const hostPlayer = room.players.find(p => p.sessionId === room.hostSessionId);
    if (hostPlayer?.id !== socket.id) { ack({ ok: false, error: 'Only host can start' }); return; }

    if (room.game.phase !== 'waiting') { ack({ ok: false, error: 'Game already started' }); return; }
    if (!room.config.fillWithBots && room.players.length < PLAYER_COUNT) {
      ack({ ok: false, error: 'Four seated players are required when auto-fill bots is disabled' });
      return;
    }

    if (room.config.fillWithBots) {
      fillEmptySeatsWithBots(room);
    }

    const seatingError = validateSeating(room);
    if (seatingError) {
      ack({ ok: false, error: seatingError });
      return;
    }

    startGame(room, (r) => broadcastRoomState(io, r));
    touchRoom(room.code);
    ack({ ok: true, data: {} });
    logger.info(`Game started in room ${room.code}`);
  });

  socket.on('game:bid', ({ bid }, ack) => {
    const room = getPlayerRoom(socket);
    if (!room) { ack({ ok: false, error: 'Not in a room' }); return; }

    const player = room.players.find(p => p.id === socket.id);
    if (!player) { ack({ ok: false, error: 'Not a player' }); return; }

    const error = placeBid(room, player.seat as Seat, bid, (r) => broadcastRoomState(io, r));
    if (error) { ack({ ok: false, error }); return; }

    touchRoom(room.code);
    ack({ ok: true, data: {} });
  });

  socket.on('game:play', ({ cardId }, ack) => {
    const room = getPlayerRoom(socket);
    if (!room) { ack({ ok: false, error: 'Not in a room' }); return; }

    const player = room.players.find(p => p.id === socket.id);
    if (!player) { ack({ ok: false, error: 'Not a player' }); return; }

    const error = playCard(room, player.seat as Seat, cardId, (r) => broadcastRoomState(io, r));
    if (error) { ack({ ok: false, error }); return; }

    touchRoom(room.code);
    ack({ ok: true, data: {} });
  });

  socket.on('game:rematch', () => {
    const room = getPlayerRoom(socket);
    if (!room) return;
    if (room.game.phase !== 'ended') return;

    const hostPlayer = room.players.find(p => p.sessionId === room.hostSessionId);
    if (hostPlayer?.id !== socket.id) return;

    rematch(room, (r) => broadcastRoomState(io, r));
    touchRoom(room.code);
  });
}
