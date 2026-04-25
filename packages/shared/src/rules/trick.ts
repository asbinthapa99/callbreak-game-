import type { Card, Suit } from '../types/card.js';
import type { Trick } from '../types/game.js';
import type { Seat } from '../types/player.js';
import { RANK_ORDER, TRUMP_SUIT } from './constants.js';

export function getLegalPlays(
  hand: Card[],
  leadSuit: Suit | null,
  spadesBroken: boolean,
  spadeBreakingEnabled: boolean
): Card[] {
  if (leadSuit === null) {
    // Leading a trick
    if (!spadeBreakingEnabled || spadesBroken) return hand;
    // Can't lead spades unless it's all you have
    const nonSpades = hand.filter(c => c.suit !== TRUMP_SUIT);
    return nonSpades.length > 0 ? nonSpades : hand;
  }

  // Following a trick
  const suitCards = hand.filter(c => c.suit === leadSuit);
  if (suitCards.length > 0) return suitCards; // must follow suit
  return hand; // void in lead suit — play anything
}

export function winnerOfTrick(trick: Trick): Seat {
  if (trick.plays.length === 0) throw new Error('Empty trick');

  const leadSuit = trick.plays[0].card.suit;
  let best = trick.plays[0];

  for (const play of trick.plays.slice(1)) {
    const c = play.card;
    const b = best.card;

    if (c.suit === TRUMP_SUIT && b.suit !== TRUMP_SUIT) {
      best = play; // trump beats non-trump
    } else if (c.suit === b.suit) {
      if (RANK_ORDER[c.rank] > RANK_ORDER[b.rank]) {
        best = play; // higher card of same suit
      }
    } else if (c.suit === leadSuit && b.suit !== TRUMP_SUIT && b.suit !== leadSuit) {
      best = play; // lead suit beats off-suit non-trump
    }
  }

  return best.seat;
}

export function isSpadesBroken(trick: Trick, leadSuit: Suit): boolean {
  if (leadSuit === TRUMP_SUIT) return false; // led spades ourselves — already broken
  return trick.plays.some(p => p.card.suit === TRUMP_SUIT);
}
