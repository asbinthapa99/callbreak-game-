import type { Card } from '@callbreak/shared';
import { getLegalPlays, RANK_ORDER, TRUMP_SUIT, MIN_BID, MAX_BID } from '@callbreak/shared';
import type { Suit } from '@callbreak/shared';

export function botBid(hand: Card[]): number {
  let score = 0;
  for (const card of hand) {
    if (card.rank === 'A') score += 2;
    else if (card.rank === 'K') score += 1.5;
    else if (card.rank === 'Q') score += 1;
  }
  // Bonus for spades beyond 3
  const spadeCount = hand.filter(c => c.suit === TRUMP_SUIT).length;
  if (spadeCount > 3) score += (spadeCount - 3) * 0.5;

  const bid = Math.round(score);
  return Math.max(MIN_BID, Math.min(MAX_BID, bid));
}

export function botPlay(
  hand: Card[],
  leadSuit: Suit | null,
  spadesBroken: boolean,
  spadeBreakingEnabled: boolean,
  currentTrickPlays: { card: Card }[]
): Card {
  const legal = getLegalPlays(hand, leadSuit, spadesBroken, spadeBreakingEnabled);

  if (currentTrickPlays.length === 0) {
    // Leading: play lowest non-trump if possible
    const nonTrump = legal.filter(c => c.suit !== TRUMP_SUIT);
    const pool = nonTrump.length > 0 ? nonTrump : legal;
    return lowest(pool);
  }

  // Find current best card in trick
  const currentBest = currentTrickPlays.reduce((best, p) =>
    beats(p.card, best.card, leadSuit!) ? p : best
  , currentTrickPlays[0]);

  if (leadSuit && legal.some(c => c.suit === leadSuit)) {
    // Following suit — try to beat current best, else dump lowest
    const canBeat = legal.filter(c => c.suit === leadSuit && beats(c, currentBest.card, leadSuit));
    if (canBeat.length > 0) return lowest(canBeat);
    return lowest(legal);
  }

  // Void in lead suit — try lowest trump that beats current best
  const trumps = legal.filter(c => c.suit === TRUMP_SUIT);
  if (trumps.length > 0) {
    const beatingTrumps = trumps.filter(c => beats(c, currentBest.card, leadSuit ?? 'spades'));
    if (beatingTrumps.length > 0) return lowest(beatingTrumps);
  }

  // Dump lowest junk card
  return lowest(legal);
}

function lowest(cards: Card[]): Card {
  return cards.reduce((low, c) =>
    RANK_ORDER[c.rank] < RANK_ORDER[low.rank] ? c : low
  );
}

function beats(a: Card, b: Card, leadSuit: Suit): boolean {
  if (a.suit === TRUMP_SUIT && b.suit !== TRUMP_SUIT) return true;
  if (b.suit === TRUMP_SUIT && a.suit !== TRUMP_SUIT) return false;
  if (a.suit === b.suit) return RANK_ORDER[a.rank] > RANK_ORDER[b.rank];
  if (a.suit === leadSuit) return true;
  return false;
}
