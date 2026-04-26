import type { TypedIO, TypedSocket } from '../server.js';
import { findRoomBySessionId, touchRoom } from '../../game/room-manager.js';
import { buildRoomView } from '../../game/view.js';
import { logger } from '../../lib/logger.js';
import type { Seat } from '@callbreak/shared';
import { broadcastRoomState } from './broadcast.js';

// Map socketId -> { sessionId, roomCode, seat }
const socketSessions = new Map<string, { sessionId: string; roomCode: string; seat: Seat }>();

export function registerConnectionHandlers(io: TypedIO, socket: TypedSocket): void {
  socket.on('session:resume', ({ sessionId }, ack) => {
    const room = findRoomBySessionId(sessionId);
    if (!room) {
      ack({ ok: true, data: {} });
      return;
    }

    const player = room.players.find(p => p.sessionId === sessionId);
    if (!player) {
      ack({ ok: true, data: {} });
      return;
    }

    // Reattach socket
    player.id = socket.id;
    player.connected = true;
    socket.join(room.code);
    socketSessions.set(socket.id, { sessionId, roomCode: room.code, seat: player.seat });
    touchRoom(room.code);

    const view = buildRoomView(room, player.seat);
    socket.emit('room:state', view);
    broadcastRoomState(io, room);
    ack({ ok: true, data: { code: room.code, seat: player.seat } });
    logger.info(`Session resumed: ${sessionId} in room ${room.code} seat ${player.seat}`);
  });

  socket.on('disconnect', () => {
    const session = socketSessions.get(socket.id);
    if (!session) return;
    socketSessions.delete(socket.id);

    const room = findRoomBySessionId(session.sessionId);
    if (!room) return;

    const player = room.players.find(p => p.sessionId === session.sessionId);
    if (player) {
      player.connected = false;
      logger.info(`Player disconnected: ${player.name} from room ${room.code}`);
      touchRoom(room.code);
      broadcastRoomState(io, room);

      // Broadcast disconnect to room (other players see connection dot change)
      const othersInRoom = room.players
        .filter(p => p.sessionId !== session.sessionId && p.connected && !p.isBot)
        .map(p => p.id);

      for (const id of othersInRoom) {
        io.to(id).emit('room:playerLeft', { seat: player.seat });
      }
    }
  });
}

export function getSocketSession(socketId: string) {
  return socketSessions.get(socketId);
}

export function setSocketSession(socketId: string, data: { sessionId: string; roomCode: string; seat: Seat }) {
  socketSessions.set(socketId, data);
}

export function clearSocketSession(socketId: string) {
  socketSessions.delete(socketId);
}
