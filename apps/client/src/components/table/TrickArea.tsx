import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Seat } from '@callbreak/shared';
import CardComponent from './Card.js';
import { useRoomStore } from '../../store/room.js';
import { sounds } from '../../lib/sounds.js';

// Absolute positions for each display seat's played card
const SLOT: Record<number, React.CSSProperties> = {
  0: { bottom: 6, left: '50%', transform: 'translateX(-50%)' },   // south
  1: { top: '50%', right: 4, transform: 'translateY(-50%)' },      // east
  2: { top: 6, left: '50%', transform: 'translateX(-50%)' },       // north
  3: { top: '50%', left: 4, transform: 'translateY(-50%)' },       // west
};

// Fly-out direction when trick is collected
const FLY_OUT: Record<number, object> = {
  0: { y: 80 },
  1: { x: 80 },
  2: { y: -80 },
  3: { x: -80 },
};

export default function TrickArea() {
  const roomView = useRoomStore(s => s.roomView);
  const [flash, setFlash] = useState<Seat | null>(null);
  const prevTrickCountRef = useRef(0);
  const prevPlaysRef = useRef(0);

  useEffect(() => {
    if (!roomView) return;
    const completedCount = roomView.game.round?.completedTricks.length ?? 0;
    const currentPlays = roomView.game.round?.currentTrick?.plays.length ?? 0;

    // Sound when a card is played
    if (currentPlays > prevPlaysRef.current) {
      sounds.cardPlay();
    }
    prevPlaysRef.current = currentPlays;

    // Flash + sound when trick completes
    if (completedCount > prevTrickCountRef.current) {
      const lastTrick = roomView.game.round?.completedTricks[completedCount - 1];
      if (lastTrick?.winnerSeat !== undefined) {
        setFlash(lastTrick.winnerSeat);
        if (lastTrick.winnerSeat === roomView.yourSeat) {
          sounds.trickWon();
        } else {
          sounds.trickLost();
        }
        setTimeout(() => setFlash(null), 700);
      }
    }
    prevTrickCountRef.current = completedCount;
  }, [roomView]);

  if (!roomView) return null;

  const { game, yourSeat } = roomView;
  const trick = game.round?.currentTrick;

  return (
    <div className="relative" style={{ width: 240, height: 190 }}>
      {/* Winner flash overlay */}
      <AnimatePresence>
        {flash !== null && (
          <motion.div
            key="flash"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
          >
            <div className={`rounded-2xl px-5 py-2 font-display text-lg shadow-xl
              ${flash === yourSeat
                ? 'bg-green-500/90 text-white'
                : 'bg-black/60 text-white/80'}`}>
              {flash === yourSeat ? '✓ You win!' : `${roomView.players.find(p => p.seat === flash)?.name} wins`}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Played cards */}
      <AnimatePresence>
        {trick?.plays.map(play => {
          const displaySeat = (play.seat - yourSeat + 4) % 4;
          const style = SLOT[displaySeat];
          return (
            <motion.div
              key={`${play.card.id}-${play.seat}`}
              initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: (displaySeat - 2) * 2 }}
              exit={{ ...FLY_OUT[displaySeat], scale: 0.3, opacity: 0 }}
              transition={{ duration: 0.28, type: 'spring', damping: 18 }}
              className="absolute"
              style={style}
            >
              <CardComponent card={play.card} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
