import type { Rank, Suit } from '../types/card.js';

export const TOTAL_ROUNDS = 5;
export const CARDS_PER_PLAYER = 13;
export const PLAYER_COUNT = 4;
export const MIN_BID = 1;
export const MAX_BID = 8;
export const TRUMP_SUIT: Suit = 'spades';

export const RANK_ORDER: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

export const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};
