import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Card, Room, Player, Seat } from '@callbreak/shared';
import { DEFAULT_CONFIG } from '@callbreak/shared';
import { SHUFFLE_ANIMATION_MS, TRICK_SETTLE_MS, startGame, placeBid, playCard, rematch } from './game-engine.js';

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

function card(id: string, rank: Card['rank'], suit: Card['suit']): Card {
  return { id, rank, suit };
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

  it('keeps the fourth played card visible before advancing to the next trick', () => {
    vi.useFakeTimers();

    const emit = vi.fn();
    const players = [
      makePlayer(0, { hand: [card('hA', 'A', 'hearts')] }),
      makePlayer(1, { hand: [card('hJ', 'J', 'hearts')] }),
      makePlayer(2, { hand: [card('hQ', 'Q', 'hearts')] }),
      makePlayer(3, { hand: [card('hK', 'K', 'hearts')] }),
    ];
    const room = makeRoom({ fillWithBots: false }, players);
    room.game.phase = 'playing';
    room.game.round = {
      index: 0,
      dealerSeat: 1,
      bids: { 0: 1, 1: 1, 2: 1, 3: 1 },
      tricksWon: { 0: 0, 1: 0, 2: 0, 3: 0 },
      currentTrick: { leaderSeat: 0, plays: [] },
      completedTricks: [],
      leadSuit: null,
      spadesBroken: false,
    };
    room.game.currentTurnSeat = 0;
    room.game.turnDeadline = Date.now() + room.config.turnTimeoutMs;

    expect(playCard(room, 0, 'hA', emit)).toBeNull();
    expect(playCard(room, 3, 'hK', emit)).toBeNull();
    expect(playCard(room, 2, 'hQ', emit)).toBeNull();
    expect(playCard(room, 1, 'hJ', emit)).toBeNull();

    expect(room.game.round.currentTrick?.plays).toHaveLength(4);
    expect(room.game.round.currentTrick?.winnerSeat).toBe(0);
    expect(room.game.round.completedTricks).toHaveLength(0);
    expect(room.game.currentTurnSeat).toBeNull();
    expect(room.game.turnDeadline).toBeNull();

    vi.advanceTimersByTime(TRICK_SETTLE_MS);

    expect(room.game.round.completedTricks).toHaveLength(1);
    expect(room.game.round.completedTricks[0].plays).toHaveLength(4);
    expect(room.game.round.currentTrick).toEqual({ leaderSeat: 0, plays: [] });
    expect(room.game.currentTurnSeat).toBe(0);
    expect(room.game.turnDeadline).not.toBeNull();
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
