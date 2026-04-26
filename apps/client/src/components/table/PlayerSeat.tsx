import { motion } from 'framer-motion';
import type { Seat } from '@callbreak/shared';
import { cumulativeScores } from '@callbreak/shared';
import { CardBack } from './Card.js';
import { useRoomStore } from '../../store/room.js';

const AVATAR_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];

// Fan naturally opens upward; rotate to point it toward the table
const FAN_ROTATION: Record<string, string> = {
  north: 'rotate(180deg)',
  west:  'rotate(-90deg)',
  east:  'rotate(90deg)',
};

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

  const isActive    = game.currentTurnSeat === playerSeat && game.phase === 'playing';
  const isBidding   = game.currentTurnSeat === playerSeat && game.phase === 'bidding';
  const highlighted = isActive || isBidding;

  const bid        = game.round?.bids[playerSeat];
  const tricksWon  = game.round?.tricksWon[playerSeat] ?? 0;
  const cum        = game.scores.length > 0
    ? (cumulativeScores(game.scores) as Record<Seat, number>)[playerSeat]
    : 0;

  const fanCount = Math.min(player.handCount, 13);

  const cardFan = fanCount > 0 ? (
    <div className="overflow-visible flex items-center justify-center"
         style={{ transform: FAN_ROTATION[position], transformOrigin: 'center center' }}>
      <CardBack count={fanCount} fan size="sm" />
    </div>
  ) : null;

  const avatarRow = (
    <div className="flex items-center gap-1.5">
      {/* Cumulative score badge (orange) */}
      <div className="w-8 h-8 rounded-full bg-orange-500 border-2 border-orange-200
                      flex items-center justify-center font-display font-bold text-white text-sm shadow-lg">
        {cum}
      </div>

      {/* Avatar */}
      <motion.div
        className={`player-avatar w-14 h-14 text-xl overflow-hidden
                    border-[3px] ${highlighted ? 'border-green-400' : 'border-white/50'}`}
        style={{ backgroundColor: AVATAR_COLORS[playerSeat] }}
        animate={highlighted ? {
          boxShadow: [
            '0 0 0 0px rgba(74,222,128,0.8)',
            '0 0 0 10px rgba(74,222,128,0)',
            '0 0 0 0px rgba(74,222,128,0.8)',
          ],
        } : { boxShadow: '0 4px 14px rgba(0,0,0,0.5)' }}
        transition={{ duration: 1.4, repeat: highlighted ? Infinity : 0 }}
      >
        {player.avatarUrl
          ? <img src={player.avatarUrl} alt="" className="w-full h-full object-cover" />
          : player.name[0]?.toUpperCase()}
      </motion.div>

      {/* Tricks / bid badge (red) */}
      {bid !== undefined && bid !== null ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="rounded-full bg-red-600 border-2 border-red-300 px-1.5 h-8 min-w-[40px]
                     flex items-center justify-center font-display font-bold text-white text-xs shadow-lg"
        >
          {tricksWon}/{bid}
        </motion.div>
      ) : (
        <div className="w-8" />
      )}
    </div>
  );

  const nameTag = (
    <div className="bg-white/90 text-gray-900 font-bold text-xs px-2.5 py-0.5 rounded-lg shadow
                    text-center max-w-[90px] truncate leading-5">
      {player.name}
      {player.isBot && ' 🤖'}
    </div>
  );

  if (position === 'north') {
    return (
      <div className="flex flex-col items-center gap-1">
        {avatarRow}
        {nameTag}
        {cardFan}
      </div>
    );
  }

  if (position === 'west') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center gap-1">
          {avatarRow}
          {nameTag}
        </div>
        {cardFan}
      </div>
    );
  }

  // east
  return (
    <div className="flex items-center gap-2">
      {cardFan}
      <div className="flex flex-col items-center gap-1">
        {avatarRow}
        {nameTag}
      </div>
    </div>
  );
}
