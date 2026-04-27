import type { Player } from './player.js';
import type { GameState } from './game.js';

export interface RoomConfig {
  customSettingsEnabled: boolean; // default false
  totalRounds: number;  // default 5
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
  customSettingsEnabled: false,
  totalRounds: 5,
  loserPenalty: '',
  turnTimeoutMs: 30000,
  fillWithBots: true,
  spadeBreakingEnabled: true,
};
