import { describe, expect, it } from 'vitest';
import type { Player, Room, Seat } from '@callbreak/shared';
import { DEFAULT_CONFIG } from '@callbreak/shared';
import { fillEmptySeatsWithBots, findSeatForHuman, isSeat, validateSeating } from './seating.js';

function player(seat: Seat, overrides: Partial<Player> = {}): Player {
  return {
    id: `socket-${seat}`,
    sessionId: `session-${seat}`,
    name: `Player ${seat}`,
    seat,
    isHost: seat === 0,
    isBot: false,
    connected: true,
    hand: [],
    ...overrides,
  };
}

function room(players: Player[]): Room {
  return {
    code: 'TEST',
    hostSessionId: players[0]?.sessionId ?? 'session-0',
    config: DEFAULT_CONFIG,
    players,
    game: { phase: 'waiting', round: null, scores: [], currentTurnSeat: null, turnDeadline: null },
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };
}

describe('seating', () => {
  it('fills only empty seats with bots', () => {
    const r = room([player(0)]);

    expect(fillEmptySeatsWithBots(r)).toBe(3);
    expect(r.players).toHaveLength(4);
    expect(r.players.filter(p => p.isBot)).toHaveLength(3);
    expect(validateSeating(r)).toBeNull();
  });

  it('does not add duplicate bots when fill is called twice', () => {
    const r = room([player(0)]);

    fillEmptySeatsWithBots(r);

    expect(fillEmptySeatsWithBots(r)).toBe(0);
    expect(r.players).toHaveLength(4);
    expect(validateSeating(r)).toBeNull();
  });

  it('allows a real player to replace a bot when all seats are occupied', () => {
    const r = room([player(0)]);
    fillEmptySeatsWithBots(r);

    expect(findSeatForHuman(r)).toBe(1);
  });

  it('rejects invalid and duplicate seating', () => {
    expect(isSeat(4)).toBe(false);
    expect(isSeat(2)).toBe(true);
    expect(validateSeating(room([player(0), player(0, { sessionId: 'dupe' }), player(1), player(2)]))).toBe('Duplicate player seat');
  });
});
