import { motion } from 'framer-motion';
import type { Seat } from '@callbreak/shared';
import { formatScore, cumulativeScores } from '@callbreak/shared';
import { CardBack } from './Card.js';
import { useRoomStore } from '../../store/room.js';

const AVATAR_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];

interface PlayerSeatProps {
  playerSeat: Seat;
  position: 'north' | 'east' | 'west';
}

export default function PlayerSeat({ playerSeat, position }: PlayerSeatProps) {
  const roomView = useRoomStore(s => s.roomView);
  if (!roomView) return null;

  const { players, game } = roomView;
  const player = players.find(p => p.seat === playerSeat);
  if (!player) return null;

  const isActive = game.currentTurnSeat === playerSeat && game.phase === 'playing';
  const isBidding = game.currentTurnSeat === playerSeat && game.phase === 'bidding';
  const bid = game.round?.bids[playerSeat];
  const tricksWon = game.round?.tricksWon[playerSeat] ?? 0;

  const cum = game.scores.length > 0
    ? (cumulativeScores(game.scores) as Record<Seat, number>)[playerSeat]
    : null;

  const isSide = position === 'east' || position === 'west';

  return (
    <div className={`flex ${isSide ? 'flex-col' : 'flex-col'} items-center gap-1.5`}>

      {/* Cumulative score (only during/after play) */}
      {cum !== null && (
        <div className={`font-mono text-xs font-bold ${cum < 0 ? 'text-red-400' : 'text-green-300'}`}>
          {formatScore(cum)}
        </div>
      )}

      {/* Card fan above avatar */}
      {player.handCount > 0 && (
        <div className="relative" style={{ height: 44 }}>
          <CardBack count={Math.min(player.handCount, 7)} fan size="sm" />
        </div>
      )}

      {/* Avatar */}
      <div className="relative">
        <motion.div
          className={`player-avatar w-14 h-14 text-xl font-display select-none overflow-hidden
                      border-4 ${isActive || isBidding ? 'border-green-400' : 'border-white/20'}`}
          style={{ backgroundColor: AVATAR_COLORS[playerSeat] }}
          animate={isActive || isBidding ? {
            boxShadow: [
              '0 0 0 0 rgba(74,222,128,0.7)',
              '0 0 0 10px rgba(74,222,128,0)',
              '0 0 0 0 rgba(74,222,128,0.7)',
            ],
          } : { boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
          transition={{ duration: 1.4, repeat: isActive || isBidding ? Infinity : 0 }}
        >
          {player.avatarUrl ? (
            <img src={player.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            player.name[0]?.toUpperCase()
          )}
        </motion.div>

        {/* Online/offline dot */}
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white
                      ${player.connected ? 'status-dot-online' : 'status-dot-offline'}`}
        />

        {/* Bid badge overlapping avatar */}
        {(bid !== null && bid !== undefined) && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bid-badge absolute -top-2 -left-2 px-1.5"
            style={{ fontSize: 11, minWidth: 36, height: 20 }}
          >
            {tricksWon}/{bid}
          </motion.div>
        )}
      </div>

      {/* Name */}
      <div className="text-white font-body text-xs font-bold drop-shadow text-center max-w-[76px] truncate leading-tight">
        {player.name}
        {player.isBot && <span className="ml-0.5 opacity-70">🤖</span>}
        {(isActive || isBidding) && (
          <span className="block text-green-400 text-[9px] font-normal animate-pulse">
            {isBidding ? 'bidding…' : 'playing…'}
          </span>
        )}
      </div>
    </div>
  );
}
