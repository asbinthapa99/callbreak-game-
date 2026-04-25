import type { Suit } from '@callbreak/shared';
import { SUIT_SYMBOLS } from '@callbreak/shared';

export function suitClass(suit: Suit): string {
  return suit === 'hearts' || suit === 'diamonds' ? 'suit-red' : 'suit-black';
}

export function suitSymbol(suit: Suit): string {
  return SUIT_SYMBOLS[suit];
}

// Map seat to display position relative to "you" (always bottom/south)
// yourSeat is normalized so you are always seat 0 visually
export function getDisplaySeat(playerSeat: number, yourSeat: number): number {
  return (playerSeat - yourSeat + 4) % 4;
}
// 0 = south (you), 1 = west (right), 2 = north (top), 3 = east (left) ... wait
// Standard: anti-clockwise: 0=south, going anti-clockwise: 1=east, 2=north, 3=west
// Visual layout: bottom=you, right=next anti-clockwise, top=opposite, left=other
