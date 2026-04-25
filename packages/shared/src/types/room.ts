import type { Player } from './player.js';
import type { GameState } from './game.js';

export interface RoomConfig {
  loserPenalty: string;   // free-text, max 200 chars
  turnTimeoutMs: number;  // default 30000
  fillWithBots: boolean;  // default true
  spadeBreakingEnabled: boolean; // default true
}

export interface Room {
  code: string;
  hostSessionId: string;
  config: RoomConfig;
  players: Player[];
  game: GameState;
  createdAt: number;
  lastActivity: number;
}

export const DEFAULT_CONFIG: RoomConfig = {
  loserPenalty: '',
  turnTimeoutMs: 30000,
  fillWithBots: true,
  spadeBreakingEnabled: true,
};
