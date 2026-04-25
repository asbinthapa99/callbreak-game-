import type { Seat } from './player.js';

export interface ChatMessage {
  id: string;
  seat: Seat | null; // null = system message
  name: string;
  text: string;
  ts: number;
}
