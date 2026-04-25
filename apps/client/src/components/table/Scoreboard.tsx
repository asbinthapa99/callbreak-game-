import { motion, AnimatePresence } from 'framer-motion';
import { formatScore, cumulativeScores } from '@callbreak/shared';
import type { Seat } from '@callbreak/shared';
import { useRoomStore } from '../../store/room.js';

const AVATAR_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];
const SEATS: Seat[] = [0, 1, 2, 3];

interface ScoreboardProps {
  open: boolean;
  onClose: () => void;
}

export default function Scoreboard({ open, onClose }: ScoreboardProps) {
  const roomView = useRoomStore(s => s.roomView);
  if (!roomView) return null;

  const { players, game, yourSeat } = roomView;
  const { scores } = game;

  const cum = scores.length > 0
    ? cumulativeScores(scores) as Record<Seat, number>
    : null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop (mobile) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed right-0 top-0 h-full w-80 z-40 flex flex-col
                       bg-cb-red-dark border-l-2 border-cb-gold/40 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-cb-gold/30 flex-shrink-0">
              <h2 className="text-cb-gold font-display text-2xl tracking-wide">🏆 Scores</h2>
              <button onClick={onClose} className="text-white/50 hover:text-white text-2xl transition-colors">✕</button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Player header row */}
              <div className="grid grid-cols-5 gap-1 items-center">
                <div className="text-white/40 font-body text-xs text-center">Rnd</div>
                {SEATS.map(s => {
                  const p = players.find(pl => pl.seat === s);
                  const isYou = s === yourSeat;
                  return (
                    <div key={s} className="flex flex-col items-center gap-1">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-display text-white text-xs overflow-hidden
                                    border-2 ${isYou ? 'border-cb-gold' : 'border-white/20'}`}
                        style={{ backgroundColor: AVATAR_COLORS[s] }}
                      >
                        {p?.avatarUrl ? (
                          <img src={p.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          p?.name[0]?.toUpperCase() ?? '?'
                        )}
                      </div>
                      <div className={`font-body text-[10px] truncate max-w-[52px] text-center
                                       ${isYou ? 'text-cb-gold font-bold' : 'text-white/60'}`}>
                        {isYou ? 'You' : (p?.name ?? `P${s + 1}`)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Round rows */}
              {scores.length === 0 ? (
                <div className="text-white/30 font-body text-sm text-center py-8">
                  No rounds played yet
                </div>
              ) : (
                <div className="space-y-1">
                  {scores.map(row => (
                    <div
                      key={row.roundIndex}
                      className="grid grid-cols-5 gap-1 items-center py-1.5 px-1 rounded-lg bg-white/5"
                    >
                      <div className="text-white/40 font-mono text-xs text-center">
                        {row.roundIndex + 1}
                      </div>
                      {SEATS.map(s => {
                        const v = row.perSeat[s];
                        const isYou = s === yourSeat;
                        return (
                          <div
                            key={s}
                            className={`font-mono text-sm font-bold text-center
                                        ${v < 0 ? 'text-red-400' : 'text-green-400'}
                                        ${isYou ? 'bg-white/10 rounded' : ''}`}
                          >
                            {formatScore(v)}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

              {/* Totals */}
              {cum && (
                <div className="border-t-2 border-cb-gold/30 pt-3">
                  <div className="grid grid-cols-5 gap-1 items-center">
                    <div className="text-cb-gold font-display text-xs text-center">Total</div>
                    {SEATS.map(s => {
                      const isYou = s === yourSeat;
                      return (
                        <div
                          key={s}
                          className={`font-mono text-base font-bold text-center
                                      ${cum[s] < 0 ? 'text-red-400' : 'text-cb-gold'}
                                      ${isYou ? 'underline decoration-dotted' : ''}`}
                        >
                          {formatScore(cum[s])}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
