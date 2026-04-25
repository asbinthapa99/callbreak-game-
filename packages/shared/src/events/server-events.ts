import type { Card } from '../types/card.js';
import type { PlayerPublic, Seat } from '../types/player.js';
import type { GameState, Phase, RoundState, ScoreRow, Trick } from '../types/game.js';
import type { RoomConfig } from '../types/room.js';
import type { ChatMessage } from '../types/chat.js';

export interface PublicRoomView {
  code: string;
  config: RoomConfig;
  players: PlayerPublic[];
  hostSeat: number;
  game: GameState;
  yourSeat: number;
  yourHand: Card[];
}

export interface ServerToClientEvents {
  'room:state': (view: PublicRoomView) => void;

  'room:playerJoined': (payload: { player: PlayerPublic }) => void;

  'room:playerLeft': (payload: { seat: number }) => void;

  'room:configUpdated': (payload: { config: RoomConfig }) => void;

  'game:phase': (payload: { phase: Phase }) => void;

  'game:turn': (payload: { seat: Seat; deadline: number }) => void;

  'game:bidPlaced': (payload: { seat: Seat; bid: number }) => void;

  'game:cardPlayed': (payload: { seat: Seat; card: Card; trick: Trick }) => void;

  'game:trickWon': (payload: { seat: Seat; trick: Trick }) => void;

  'game:roundEnded': (payload: {
    row: ScoreRow;
    cumulative: Record<number, number>;
    round: RoundState;
  }) => void;

  'game:ended': (payload: {
    winnerSeat: Seat;
    loserSeat: Seat;
    finalScores: Record<number, number>;
    loserPenalty: string;
  }) => void;

  'chat:message': (msg: ChatMessage) => void;

  'system:error': (payload: { code: string; message: string }) => void;

  'system:toast': (payload: { kind: 'info' | 'warn' | 'error'; message: string }) => void;
}
