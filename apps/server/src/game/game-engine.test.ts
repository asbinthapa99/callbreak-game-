import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Room, Player, Seat } from '@callbreak/shared';
import { DEFAULT_CONFIG } from '@callbreak/shared';
import { SHUFFLE_ANIMATION_MS, startGame, placeBid, rematch } from './game-engine.js';

function makePlayer(seat: Seat, overrides: Partial<Player> = {}): Player {
  return {
    id: `socket-${seat}`,
    sessionId: `session-${seat}`,
    name: `Player ${seat + 1}`,
    seat,
    isHost: seat === 0,
    isBot: false,
    connected: true,
    hand: [],
    ...overrides,
  };
}

function makeRoom(config: Partial<Room['config']> = {}, players: Player[] = [makePlayer(0)]): Room {
  return {
    code: 'TEST',
    hostSessionId: players[0]?.sessionId ?? 'session-0',
    config: { ...DEFAULT_CONFIG, ...config },
    players,
    game: { phase: 'waiting', round: null, scores: [], currentTurnSeat: null, turnDeadline: null },
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('game engine', () => {
  it('fills empty seats with bots when fillWithBots is enabled', () => {
    vi.useFakeTimers();
    const room = makeRoom({ fillWithBots: true }, [makePlayer(0), makePlayer(1)]);

    startGame(room, vi.fn());

    expect(room.players).toHaveLength(4);
    expect(room.players.filter(player => player.isBot)).toHaveLength(2);
  });

  it('auto-places a minimum bid when a turn deadline expires', () => {
    vi.useFakeTimers();

    const emit = vi.fn();
    const room = makeRoom(
      { fillWithBots: true, turnTimeoutMs: 25 },
      [makePlayer(0), makePlayer(1, { connected: false }), makePlayer(2, { connected: false }), makePlayer(3, { connected: false })],
    );

    startGame(room, emit);
    vi.advanceTimersByTime(SHUFFLE_ANIMATION_MS);

    const currentSeat = room.game.currentTurnSeat;
    expect(currentSeat).not.toBeNull();
    expect(room.game.round?.bids[currentSeat as Seat]).toBeNull();

    vi.advanceTimersByTime(30);

    expect(room.game.round?.bids[currentSeat as Seat]).toBe(1);
    expect(emit).toHaveBeenCalled();
  });

  it('rejects malformed bids before they can affect scoring', () => {
    vi.useFakeTimers();

    const emit = vi.fn();
    const room = makeRoom(
      { fillWithBots: true },
      [makePlayer(0), makePlayer(1), makePlayer(2), makePlayer(3)],
    );

    startGame(room, emit);
    vi.advanceTimersByTime(SHUFFLE_ANIMATION_MS);

    const currentSeat = room.game.currentTurnSeat as Seat;
    expect(placeBid(room, currentSeat, Number.NaN, emit)).toBe('Invalid bid');
    expect(room.game.round?.bids[currentSeat]).toBeNull();
  });

  it('rematch resets the game back to waiting state', () => {
    const emit = vi.fn();
    const room = makeRoom({ fillWithBots: true }, [makePlayer(0)]);

    startGame(room, emit);
    room.game.phase = 'ended';
    room.game.scores = [{ roundIndex: 0, perSeat: { 0: 10, 1: 0, 2: 0, 3: 0 } }];

    rematch(room, emit);

    expect(room.game.phase).toBe('waiting');
    expect(room.game.round).toBeNull();
    expect(room.game.scores).toEqual([]);
    expect(room.game.currentTurnSeat).toBeNull();
    expect(room.game.turnDeadline).toBeNull();
  });
});
