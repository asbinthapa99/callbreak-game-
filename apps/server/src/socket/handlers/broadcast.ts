import type { TypedIO } from '../server.js';
import { buildRoomView } from '../../game/view.js';
import type { Room } from '@callbreak/shared';

export function broadcastRoomState(io: TypedIO, room: Room): void {
  for (const player of room.players) {
    if (!player.isBot && player.connected) {
      const view = buildRoomView(room, player.seat);
      io.to(player.id).emit('room:state', view);
    }
  }
}
