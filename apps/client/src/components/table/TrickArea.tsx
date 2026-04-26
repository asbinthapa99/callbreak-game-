import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Seat } from '@callbreak/shared';
import CardComponent from './Card.js';
import { useRoomStore } from '../../store/room.js';
import { sounds } from '../../lib/sounds.js';

type MotionValues = { x?: number; y?: number; opacity?: number; rotate?: number; scale?: number };

// Cards fly in from each player's direction
const FLY_IN: Record<number, MotionValues> = {
  0: { y: 180, opacity: 0, rotate: -20 },   // south → slides up
  1: { x: 180, opacity: 0, rotate: 20 },    // east  → slides left
  2: { y: -180, opacity: 0, rotate: 20 },   // north → slides down
  3: { x: -180, opacity: 0, rotate: -20 },  // west  → slides right
};

// Cards collect toward the winner's seat
const FLY_OUT: Record<number, MotionValues> = {
  0: { y: 220, scale: 0.3, opacity: 0 },
  1: { x: 220, scale: 0.3, opacity: 0 },
  2: { y: -220, scale: 0.3, opacity: 0 },
  3: { x: -220, scale: 0.3, opacity: 0 },
};

// Slight natural tilt per seat
const TILT: Record<number, number> = {
  0: -4,
  1:  6,
  2:  3,
  3: -7,
};

export default function TrickArea() {
  const roomView = useRoomStore(s => s.roomView);
  const [flash, setFlash]     = useState<Seat | null>(null);
  const prevCountRef          = useRef(0);
  const prevPlaysRef          = useRef(0);

  useEffect(() => {
    if (!roomView) return;
    const completedCount = roomView.game.round?.completedTricks.length ?? 0;
    const currentPlays   = roomView.game.round?.currentTrick?.plays.length ?? 0;

    if (currentPlays > prevPlaysRef.current) sounds.cardPlay();
    prevPlaysRef.current = currentPlays;

    if (completedCount > prevCountRef.current) {
      const last = roomView.game.round?.completedTricks[completedCount - 1];
      if (last?.winnerSeat !== undefined) {
        setFlash(last.winnerSeat);
        last.winnerSeat === roomView.yourSeat ? sounds.trickWon() : sounds.trickLost();
        setTimeout(() => setFlash(null), 800);
      }
    }
    prevCountRef.current = completedCount;
  }, [roomView]);

  if (!roomView) return null;

  const { game, yourSeat } = roomView;
  const trick = game.round?.currentTrick;

  const completedCount   = game.round?.completedTricks.length ?? 0;
  const lastCompleted    = completedCount > 0 ? game.round?.completedTricks[completedCount - 1] : null;
  const exitDisplaySeat  = lastCompleted?.winnerSeat !== undefined
    ? (lastCompleted.winnerSeat - yourSeat + 4) % 4
    : 0;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 310, height: 120 }}>

      {/* Winner flash */}
      <AnimatePresence>
        {flash !== null && (
          <motion.div
            key="flash"
            initial={{ opacity: 0, scale: 0.6, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.15 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
          >
            <div className={`rounded-2xl px-5 py-2 font-display text-base shadow-2xl
              ${flash === yourSeat ? 'bg-green-500/90 text-white' : 'bg-black/65 text-white/90'}`}>
              {flash === yourSeat
                ? '✓ You win!'
                : `${roomView.players.find(p => p.seat === flash)?.name} wins`}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards side by side */}
      <div className="flex items-center gap-3">
        <AnimatePresence>
          {trick?.plays.map((play, i) => {
            const displaySeat = (play.seat - yourSeat + 4) % 4;

            return (
              <motion.div
                key={`${play.card.id}-${play.seat}`}
                initial={FLY_IN[displaySeat]}
                animate={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: TILT[displaySeat] }}
                exit={{ ...FLY_OUT[exitDisplaySeat], rotate: 30 }}
                transition={{ duration: 0.38, type: 'spring', damping: 16, stiffness: 200 }}
                style={{ zIndex: i + 1 }}
              >
                <CardComponent card={play.card} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
