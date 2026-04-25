import { v4 as uuidv4 } from 'uuid';
import type { TypedIO, TypedSocket } from '../server.js';
import { getRoom } from '../../game/room-manager.js';

const chatRateLimits = new Map<string, number>(); // socketId -> last msg timestamp

export function registerChatHandlers(io: TypedIO, socket: TypedSocket): void {
  socket.on('chat:send', ({ text }) => {
    // Rate limit: 1 message per second
    const last = chatRateLimits.get(socket.id) ?? 0;
    const now = Date.now();
    if (now - last < 1000) return;
    chatRateLimits.set(socket.id, now);

    const trimmed = text?.trim().slice(0, 200);
    if (!trimmed) return;

    const roomCode = Array.from(socket.rooms).find(r => r !== socket.id);
    if (!roomCode) return;

    const room = getRoom(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    const msg = {
      id: uuidv4(),
      seat: player.seat,
      name: player.name,
      text: trimmed,
      ts: now,
    };

    io.to(roomCode).emit('chat:message', msg);
  });
}
