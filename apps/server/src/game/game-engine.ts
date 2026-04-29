import {
  createDeck, shuffle, dealHands,
  getLegalPlays, winnerOfTrick, isSpadesBroken,
  scoreRound, cumulativeScores,
  PLAYER_COUNT, MIN_BID, MAX_BID,
} from '@callbreak/shared';
import type { Room, Seat, Card, Suit } from '@callbreak/shared';
import type { RoundState } from '@callbreak/shared';
import { botBid, botPlay } from './ai-bot.js';
import { logger } from '../lib/logger.js';
import { fillEmptySeatsWithBots } from './seating.js';

type Emit = (room: Room) => void;
const turnTimers = new Map<string, ReturnType<typeof setTimeout>>();
const dealTimers = new Map<string, ReturnType<typeof setTimeout>>();
const botActionTimers = new Map<string, ReturnType<typeof setTimeout>>();
const roundAdvanceTimers = new Map<string, ReturnType<typeof setTimeout>>();
const trickSettleTimers = new Map<string, ReturnType<typeof setTimeout>>();
export const SHUFFLE_ANIMATION_MS = 1800;
export const TRICK_SETTLE_MS = 900;

// nextSeat anti-clockwise (decrement mod 4)
function prevSeat(seat: Seat): Seat {
  return ((seat + 3) % 4) as Seat;
}

function allSeats(): Seat[] { return [0, 1, 2, 3]; }

function clearTurnTimer(roomCode: string): void {
  const timer = turnTimers.get(roomCode);
  if (timer) {
    clearTimeout(timer);
    turnTimers.delete(roomCode);
  }
}

function clearDealTimer(roomCode: string): void {
  const timer = dealTimers.get(roomCode);
  if (timer) {
    clearTimeout(timer);
    dealTimers.delete(roomCode);
  }
}

function clearBotActionTimer(roomCode: string): void {
  const timer = botActionTimers.get(roomCode);
  if (timer) {
    clearTimeout(timer);
    botActionTimers.delete(roomCode);
  }
}

function clearRoundAdvanceTimer(roomCode: string): void {
  const timer = roundAdvanceTimers.get(roomCode);
  if (timer) {
    clearTimeout(timer);
    roundAdvanceTimers.delete(roomCode);
  }
}

function clearTrickSettleTimer(roomCode: string): void {
  const timer = trickSettleTimers.get(roomCode);
  if (timer) {
    clearTimeout(timer);
    trickSettleTimers.delete(roomCode);
  }
}

function clearRoomTimers(roomCode: string): void {
  clearTurnTimer(roomCode);
  clearDealTimer(roomCode);
  clearBotActionTimer(roomCode);
  clearRoundAdvanceTimer(roomCode);
  clearTrickSettleTimer(roomCode);
}

function scheduleTurnTimer(room: Room, emit: Emit): void {
  clearTurnTimer(room.code);

  const seat = room.game.currentTurnSeat;
  const deadline = room.game.turnDeadline;
  if (seat === null || deadline === null) return;

  const delay = Math.max(0, deadline - Date.now());
  turnTimers.set(room.code, setTimeout(() => {
    turnTimers.delete(room.code);

    if (room.game.currentTurnSeat !== seat) return;
    if (room.game.turnDeadline !== deadline) return;

    logger.info(`Turn timed out in room ${room.code} for seat ${seat}`);
    autoAction(room, emit);
  }, delay));
}

function initRound(room: Room, roundIndex: number): RoundState {
  const dealerSeat = (roundIndex % PLAYER_COUNT) as Seat;
  return {
    index: roundIndex,
    dealerSeat,
    bids: { 0: null, 1: null, 2: null, 3: null },
    tricksWon: { 0: 0, 1: 0, 2: 0, 3: 0 },
    currentTrick: null,
    completedTricks: [],
    leadSuit: null,
    spadesBroken: false,
  };
}

export function startGame(room: Room, emit: Emit): void {
  if (room.config.fillWithBots) {
    fillEmptySeatsWithBots(room);
  }

  room.game.scores = [];
  beginDealing(room, 0, emit);
}

function beginDealing(room: Room, roundIndex: number, emit: Emit): void {
  clearRoomTimers(room.code);
  room.game.phase = 'dealing';
  room.game.round = null;
  room.game.currentTurnSeat = null;
  room.game.turnDeadline = null;
  emit(room);

  const timer = setTimeout(() => {
    dealTimers.delete(room.code);
    if (room.game.phase !== 'dealing') return;
    dealRound(room, roundIndex, emit);
  }, SHUFFLE_ANIMATION_MS);
  dealTimers.set(room.code, timer);
}

function dealRound(room: Room, roundIndex: number, emit: Emit): void {
  room.game.round = initRound(room, roundIndex);

  const deck = shuffle(createDeck());
  const [h0, h1, h2, h3] = dealHands(deck);
  const hands = [h0, h1, h2, h3];

  for (const player of room.players) {
    player.hand = hands[player.seat];
  }

  room.game.phase = 'bidding';
  // First bidder: anti-clockwise from dealer = prevSeat(dealer)
  const firstBidder = prevSeat(room.game.round.dealerSeat);
  room.game.currentTurnSeat = firstBidder;
  room.game.turnDeadline = Date.now() + room.config.turnTimeoutMs;

  emit(room);
  scheduleTurnTimer(room, emit);
  scheduleBotActionIfNeeded(room, emit);
}

export function placeBid(room: Room, seat: Seat, bid: number, emit: Emit): string | null {
  const round = room.game.round;
  if (!round || room.game.phase !== 'bidding') return 'Not in bidding phase';
  if (room.game.currentTurnSeat !== seat) return 'Not your turn';
  if (!Number.isInteger(bid)) return 'Invalid bid';
  if (bid < MIN_BID || bid > MAX_BID) return `Bid must be ${MIN_BID}–${MAX_BID}`;

  round.bids[seat] = bid;

  // Find next bidder
  const nextSeat = prevSeat(seat);
  const allBid = allSeats().every(s => round.bids[s] !== null);

  if (allBid) {
    startPlaying(room, emit);
  } else {
    room.game.currentTurnSeat = nextSeat;
    room.game.turnDeadline = Date.now() + room.config.turnTimeoutMs;
    emit(room);
    scheduleTurnTimer(room, emit);
    scheduleBotActionIfNeeded(room, emit);
  }

  return null;
}

function startPlaying(room: Room, emit: Emit): void {
  const round = room.game.round!;
  room.game.phase = 'playing';
  // First leader = first bidder (prevSeat of dealer)
  const firstLeader = prevSeat(round.dealerSeat);
  round.currentTrick = { leaderSeat: firstLeader, plays: [] };
  round.leadSuit = null;
  room.game.currentTurnSeat = firstLeader;
  room.game.turnDeadline = Date.now() + room.config.turnTimeoutMs;
  emit(room);
  scheduleTurnTimer(room, emit);
  scheduleBotActionIfNeeded(room, emit);
}

export function playCard(room: Room, seat: Seat, cardId: string, emit: Emit): string | null {
  const round = room.game.round;
  if (!round || room.game.phase !== 'playing') return 'Not in playing phase';
  if (room.game.currentTurnSeat !== seat) return 'Not your turn';

  const player = room.players.find(p => p.seat === seat);
  if (!player) return 'Player not found';

  const card = player.hand.find(c => c.id === cardId);
  if (!card) return 'Card not in hand';

  // Validate legal play
  const legal = getLegalPlays(
    player.hand,
    round.leadSuit,
    round.spadesBroken,
    room.config.spadeBreakingEnabled
  );
  if (!legal.some(c => c.id === cardId)) return 'Illegal play';

  // Remove from hand
  player.hand = player.hand.filter(c => c.id !== cardId);

  const trick = round.currentTrick!;
  if (trick.plays.length === 0) {
    round.leadSuit = card.suit;
  }
  trick.plays.push({ seat, card });

  // Track spades broken
  if (!round.spadesBroken && isSpadesBroken(trick, round.leadSuit as Suit)) {
    round.spadesBroken = true;
  }

  if (trick.plays.length === PLAYER_COUNT) {
    const winnerSeat = winnerOfTrick(trick);
    trick.winnerSeat = winnerSeat;

    // Broadcast the full four-card trick before advancing so clients can
    // render the final played card and winner animation consistently.
    room.game.currentTurnSeat = null;
    room.game.turnDeadline = null;
    clearTurnTimer(room.code);
    clearBotActionTimer(room.code);
    emit(room);
    scheduleTrickSettle(room, trick, emit);
    return null;
  } else {
    // Next player in anti-clockwise order
    room.game.currentTurnSeat = prevSeat(seat);
  }

  room.game.turnDeadline = Date.now() + room.config.turnTimeoutMs;
  emit(room);
  scheduleTurnTimer(room, emit);
  scheduleBotActionIfNeeded(room, emit);
  return null;
}

function scheduleTrickSettle(room: Room, trick: NonNullable<RoundState['currentTrick']>, emit: Emit): void {
  clearTrickSettleTimer(room.code);

  const timer = setTimeout(() => {
    trickSettleTimers.delete(room.code);
    const round = room.game.round;
    if (!round || room.game.phase !== 'playing') return;
    if (round.currentTrick !== trick) return;
    if (trick.plays.length !== PLAYER_COUNT || trick.winnerSeat === undefined) return;

    const winnerSeat = trick.winnerSeat;
    round.tricksWon[winnerSeat]++;
    round.completedTricks.push({ ...trick, plays: [...trick.plays] });
    round.currentTrick = null;
    round.leadSuit = null;

    if (round.completedTricks.length === 13) {
      endRound(room, emit);
      return;
    }

    round.currentTrick = { leaderSeat: winnerSeat, plays: [] };
    room.game.currentTurnSeat = winnerSeat;
    room.game.turnDeadline = Date.now() + room.config.turnTimeoutMs;
    emit(room);
    scheduleTurnTimer(room, emit);
    scheduleBotActionIfNeeded(room, emit);
  }, TRICK_SETTLE_MS);
  trickSettleTimers.set(room.code, timer);
}

function endRound(room: Room, emit: Emit): void {
  const round = room.game.round!;
  room.game.phase = 'scoring';
  room.game.currentTurnSeat = null;
  room.game.turnDeadline = null;
  clearTurnTimer(room.code);
  clearBotActionTimer(room.code);

  const row = scoreRound(round.bids, round.tricksWon, round.index);
  room.game.scores.push(row);

  emit(room);

  // Auto-advance to next round or end after 5 seconds
  clearRoundAdvanceTimer(room.code);
  const timer = setTimeout(() => {
    roundAdvanceTimers.delete(room.code);
    if (round.index + 1 < room.config.totalRounds) {
      beginDealing(room, round.index + 1, emit);
    } else {
      endGame(room, emit);
    }
  }, 5000);
  roundAdvanceTimers.set(room.code, timer);
}

function endGame(room: Room, emit: Emit): void {
  room.game.phase = 'ended';
  room.game.currentTurnSeat = null;
  room.game.turnDeadline = null;
  clearRoomTimers(room.code);
  emit(room);
}

function scheduleBotActionIfNeeded(room: Room, emit: Emit): void {
  const seat = room.game.currentTurnSeat;
  if (seat === null) return;

  const player = room.players.find(p => p.seat === seat);
  if (!player?.isBot) return;

  const phase = room.game.phase;
  const deadline = room.game.turnDeadline;
  const delay = 700 + Math.random() * 600;
  clearBotActionTimer(room.code);
  const timer = setTimeout(() => {
    botActionTimers.delete(room.code);
    // Check still the same turn (game might have progressed)
    if (room.game.currentTurnSeat !== seat) return;
    if (room.game.turnDeadline !== deadline) return;
    if (room.game.phase !== phase) return;

    if (room.game.phase === 'bidding') {
      const bid = botBid(player.hand);
      placeBid(room, seat, bid, emit);
    } else if (room.game.phase === 'playing') {
      const round = room.game.round!;
      const cardToPlay = botPlay(
        player.hand,
        round.leadSuit,
        round.spadesBroken,
        room.config.spadeBreakingEnabled,
        round.currentTrick?.plays ?? []
      );
      playCard(room, seat, cardToPlay.id, emit);
    }
  }, delay);
  botActionTimers.set(room.code, timer);
}

export function autoAction(room: Room, emit: Emit): void {
  const seat = room.game.currentTurnSeat;
  if (seat === null) return;

  if (room.game.phase === 'bidding') {
    placeBid(room, seat, MIN_BID, emit);
  } else if (room.game.phase === 'playing') {
    const player = room.players.find(p => p.seat === seat);
    if (!player) return;
    const round = room.game.round!;
    const legal = getLegalPlays(player.hand, round.leadSuit, round.spadesBroken, room.config.spadeBreakingEnabled);
    if (legal.length > 0) playCard(room, seat, legal[0].id, emit);
  }
}

export function rematch(room: Room, emit: Emit): void {
  // Keep players, reset game
  for (const p of room.players) p.hand = [];
  clearRoomTimers(room.code);
  room.game = { phase: 'waiting', round: null, scores: [], currentTurnSeat: null, turnDeadline: null };
  emit(room);
}

export function getCumulativeScores(room: Room): Record<Seat, number> {
  return cumulativeScores(room.game.scores) as Record<Seat, number>;
}

export function getWinnerAndLoser(room: Room): { winnerSeat: Seat; loserSeat: Seat } {
  const cum = getCumulativeScores(room);
  let winnerSeat: Seat = 0;
  let loserSeat: Seat = 0;
  let maxScore = -Infinity;
  let minScore = Infinity;

  for (const s of allSeats()) {
    if (cum[s] > maxScore) { maxScore = cum[s]; winnerSeat = s; }
    if (cum[s] < minScore) { minScore = cum[s]; loserSeat = s; }
  }

  return { winnerSeat, loserSeat };
}
