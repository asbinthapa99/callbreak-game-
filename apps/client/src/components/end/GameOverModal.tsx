import { useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '../../socket/client.js';
import { useRoomStore } from '../../store/room.js';
import { formatScore, cumulativeScores } from '@callbreak/shared';
import type { Seat } from '@callbreak/shared';
import { sounds } from '../../lib/sounds.js';

const CONFETTI_COLORS = ['#F5C518', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FF8C00', '#fff'];

function Confetti() {
  const pieces = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      x: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 2.5 + Math.random() * 2,
      size: 6 + Math.random() * 8,
      rotate: Math.random() * 360,
    })),
  []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {pieces.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: -20,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
          }}
          animate={{
            y: ['0vh', '110vh'],
            rotate: [p.rotate, p.rotate + 720],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'linear',
            repeat: Infinity,
            repeatDelay: 0.5,
          }}
        />
      ))}
    </div>
  );
}

const AVATAR_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];
const RANK_ICONS = ['🥇', '🥈', '🥉', '4️⃣'];

export default function GameOverModal() {
  const roomView = useRoomStore(s => s.roomView);
  const soundFiredRef = useRef(false);

  useEffect(() => {
    if (roomView?.game.phase !== 'ended') {
      soundFiredRef.current = false;
      return;
    }
    if (soundFiredRef.current) return;
    soundFiredRef.current = true;

    if (roomView) {
      const cum = cumulativeScores(roomView.game.scores) as Record<Seat, number>;
      const sorted = ([0, 1, 2, 3] as Seat[]).sort((a, b) => cum[b] - cum[a]);
      if (sorted[0] === roomView.yourSeat) {
        sounds.gameWon();
      } else {
        sounds.gameLost();
      }
    }
  }, [roomView?.game.phase]);

  if (!roomView) return null;
  if (roomView.game.phase !== 'ended') return null;

  const { players, game, yourSeat, hostSeat, config } = roomView;
  const cum = cumulativeScores(game.scores) as Record<Seat, number>;

  const sorted = ([0, 1, 2, 3] as Seat[]).sort((a, b) => cum[b] - cum[a]);
  const winnerSeat = sorted[0];
  const loserSeat = sorted[sorted.length - 1];
  const winner = players.find(p => p.seat === winnerSeat);
  const loser = players.find(p => p.seat === loserSeat);
  const isHost = yourSeat === hostSeat;
  const iWon = winnerSeat === yourSeat;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 overflow-hidden"
      >
        {iWon && <Confetti />}

        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, delay: 0.15 }}
          className="panel w-full max-w-md space-y-5 text-center relative z-10"
        >
          {/* Header */}
          <div>
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-5xl mb-2"
            >
              {iWon ? '🏆' : '🃏'}
            </motion.div>
            <h2 className="font-display text-3xl text-cb-gold">
              {iWon ? 'You Won!' : 'Game Over!'}
            </h2>
          </div>

          {/* Winner spotlight */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-cb-gold/15 border-2 border-cb-gold rounded-2xl p-4"
          >
            <div className="flex items-center justify-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-display text-white text-xl border-4 border-cb-gold"
                style={{ backgroundColor: AVATAR_COLORS[winnerSeat] }}
              >
                {winner?.name[0]?.toUpperCase()}
              </div>
              <div>
                <div className="text-cb-gold font-display text-sm tracking-wider uppercase">Winner</div>
                <div className="text-white font-display text-2xl">{winner?.name}</div>
                <div className="text-green-400 font-mono text-sm">{formatScore(cum[winnerSeat])} pts</div>
              </div>
            </div>
          </motion.div>

          {/* Leaderboard */}
          <div className="space-y-2">
            {sorted.map((seat, i) => {
              const p = players.find(pl => pl.seat === seat);
              const isYou = seat === yourSeat;
              return (
                <motion.div
                  key={seat}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className={`flex justify-between items-center px-4 py-2.5 rounded-xl
                    ${i === 0 ? 'bg-cb-gold/20 border border-cb-gold/40' : 'bg-white/5'}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{RANK_ICONS[i]}</span>
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center font-display text-white text-xs border-2 border-white/20"
                      style={{ backgroundColor: AVATAR_COLORS[seat] }}
                    >
                      {p?.name[0]?.toUpperCase()}
                    </div>
                    <div className="text-left">
                      <span className="text-white font-body font-bold text-sm">{p?.name}</span>
                      {isYou && <span className="text-cb-gold text-xs ml-1">(you)</span>}
                      {p?.isBot && <span className="text-white/40 text-xs ml-1">🤖</span>}
                    </div>
                  </div>
                  <span className={`font-mono font-bold text-sm ${cum[seat] < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {formatScore(cum[seat])}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Loser penalty */}
          {config.loserPenalty && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-red-900/50 border-2 border-red-500/70 rounded-2xl p-4 space-y-1"
            >
              <div className="text-red-300 font-display text-base tracking-wide">😅 Loser's Penalty</div>
              <div className="flex items-center justify-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-display text-white text-sm border-2 border-red-400"
                  style={{ backgroundColor: AVATAR_COLORS[loserSeat] }}
                >
                  {loser?.name[0]?.toUpperCase()}
                </div>
                <span className="text-white font-body font-bold">{loser?.name}</span>
                <span className="text-red-300 text-sm">must:</span>
              </div>
              <div className="text-white/90 font-body text-base mt-1 italic">"{config.loserPenalty}"</div>
            </motion.div>
          )}

          {/* Action */}
          {isHost ? (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-gold w-full text-xl py-4"
              onClick={() => { sounds.buttonClick(); socket.emit('game:rematch'); }}
            >
              🔄 Play Again
            </motion.button>
          ) : (
            <div className="text-white/50 font-body text-sm animate-pulse py-2">
              Waiting for host to start a new game...
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
