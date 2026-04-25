import type { Room } from '@callbreak/shared';
import type { PublicRoomView } from '@callbreak/shared';
import type { Seat } from '@callbreak/shared';

export function buildRoomView(room: Room, forSeat: Seat): PublicRoomView {
  const hostPlayer = room.players.find(p => p.sessionId === room.hostSessionId);
  const hostSeat = hostPlayer?.seat ?? 0;

  const players = room.players.map(p => {
    const { hand: _hand, ...pub } = p;
    return { ...pub, handCount: p.hand.length };
  });

  const forPlayer = room.players.find(p => p.seat === forSeat);
  const yourHand = forPlayer?.hand ?? [];

  return {
    code: room.code,
    config: room.config,
    players,
    hostSeat,
    game: room.game,
    yourSeat: forSeat,
    yourHand,
  };
}
