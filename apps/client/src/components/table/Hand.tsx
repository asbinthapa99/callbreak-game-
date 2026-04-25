import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Card } from '@callbreak/shared';
import { getLegalPlays } from '@callbreak/shared';
import CardComponent from './Card.js';
import { socket } from '../../socket/client.js';
import { useRoomStore } from '../../store/room.js';
import { sounds } from '../../lib/sounds.js';

const SUIT_ORDER: Record<string, number> = { spades: 0, hearts: 1, clubs: 2, diamonds: 3 };
const RANK_ORDER: Record<string, number> = {
  A: 14, K: 13, Q: 12, J: 11,
  '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2,
};

function sortHand(hand: Card[]): Card[] {
  return [...hand].sort((a, b) => {
    const suitDiff = SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
    if (suitDiff !== 0) return suitDiff;
    return RANK_ORDER[b.rank] - RANK_ORDER[a.rank];
  });
}

export default function Hand() {
  const roomView = useRoomStore(s => s.roomView);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sorted = useMemo(
    () => roomView ? sortHand(roomView.yourHand) : [],
    [roomView?.yourHand],
  );

  if (!roomView) return null;

  const { yourSeat, game, config } = roomView;
  const { phase, currentTurnSeat, round } = game;

  const isMyTurn = currentTurnSeat === yourSeat && phase === 'playing';

  const legalIds = useMemo(() => {
    if (!isMyTurn || !round) return new Set<string>();
    return new Set(
      getLegalPlays(roomView.yourHand, round.leadSuit, round.spadesBroken, config.spadeBreakingEnabled)
        .map(c => c.id),
    );
  }, [isMyTurn, roomView?.yourHand, round?.leadSuit, round?.spadesBroken]);

  function handleCardClick(card: Card) {
    if (!isMyTurn) return;
    if (!legalIds.has(card.id)) {
      sounds.error();
      return;
    }

    if (selectedId === card.id) {
      socket.emit('game:play', { cardId: card.id }, (result) => {
        if (result.ok) {
          sounds.cardPlay();
        } else {
          sounds.error();
        }
      });
      setSelectedId(null);
    } else {
      setSelectedId(card.id);
      sounds.buttonClick();
    }
  }

  if (sorted.length === 0) return null;

  // Overlap more as hand grows
  const overlap = sorted.length > 10 ? 24 : sorted.length > 7 ? 20 : 16;

  return (
    <div className="flex flex-col items-center gap-2">
      {isMyTurn && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-cb-gold font-display text-sm tracking-wide"
        >
          {selectedId ? '✓ Click again to play!' : '♠ Your turn — pick a card'}
        </motion.div>
      )}

      <div className="player-hand">
        <AnimatePresence>
          {sorted.map((card, i) => {
            const isSelected = selectedId === card.id;
            const isLegal = legalIds.has(card.id);
            const isDisabled = isMyTurn && !isLegal;

            return (
              <motion.div
                key={card.id}
                layout
                initial={{ y: 80, opacity: 0, rotate: -5 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                exit={{ y: -40, opacity: 0, scale: 0.8 }}
                transition={{ delay: i * 0.03, duration: 0.3, type: 'spring', damping: 20 }}
                style={{ marginLeft: i === 0 ? 0 : -overlap, zIndex: isSelected ? 50 : i + 1 }}
              >
                <CardComponent
                  card={card}
                  selectable={isMyTurn && isLegal}
                  selected={isSelected}
                  disabled={isDisabled}
                  onClick={() => handleCardClick(card)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
