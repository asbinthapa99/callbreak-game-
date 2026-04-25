import type { Card, Rank, Suit } from '../types/card.js';

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const SUIT_ABBR: Record<Suit, string> = { spades: 'S', hearts: 'H', diamonds: 'D', clubs: 'C' };

export function createDeck(): Card[] {
  return SUITS.flatMap(suit =>
    RANKS.map(rank => ({
      suit,
      rank,
      id: `${rank}${SUIT_ABBR[suit]}`,
    }))
  );
}

// Fisher-Yates with optional injectable RNG for tests
export function shuffle<T>(arr: T[], rng?: () => number): T[] {
  const a = [...arr];
  const random = rng ?? cryptoRng;
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cryptoRng(): number {
  const buf = new Uint32Array(1);
  // Works in both Node (crypto.webcrypto) and browser
  globalThis.crypto.getRandomValues(buf);
  return buf[0] / (0xffffffff + 1);
}

export function dealHands(deck: Card[]): [Card[], Card[], Card[], Card[]] {
  return [
    deck.slice(0, 13),
    deck.slice(13, 26),
    deck.slice(26, 39),
    deck.slice(39, 52),
  ];
}
