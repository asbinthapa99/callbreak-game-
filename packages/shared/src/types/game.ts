import type { Card, Suit } from './card.js';
import type { Seat } from './player.js';

export type Phase = 'waiting' | 'dealing' | 'bidding' | 'playing' | 'scoring' | 'ended';

export interface TrickPlay {
  seat: Seat;
  card: Card;
}

export interface Trick {
  leaderSeat: Seat;
  plays: TrickPlay[];
  winnerSeat?: Seat;
}

export interface RoundState {
  index: number;
  dealerSeat: Seat;
  bids: Record<Seat, number | null>;
  tricksWon: Record<Seat, number>;
  currentTrick: Trick | null;
  completedTricks: Trick[];
  leadSuit: Suit | null;
  spadesBroken: boolean;
}

export interface ScoreRow {
  roundIndex: number;
  perSeat: Record<Seat, number>; // stored as integer tenths (32 = 3.2 points)
}

export interface GameState {
  phase: Phase;
  round: RoundState | null;
  scores: ScoreRow[];
  currentTurnSeat: Seat | null;
  turnDeadline: number | null; // epoch ms
}
