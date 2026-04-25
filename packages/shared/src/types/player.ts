import type { Card } from './card.js';

export type Seat = 0 | 1 | 2 | 3;

export interface Player {
  id: string;        // socket id (changes on reconnect)
  sessionId: string; // stable UUID stored in localStorage
  name: string;
  avatarUrl?: string;
  seat: Seat;
  isHost: boolean;
  isBot: boolean;
  connected: boolean;
  hand: Card[];      // server-only; stripped in PlayerPublic
}

export interface PlayerPublic extends Omit<Player, 'hand'> {
  handCount: number;
}
