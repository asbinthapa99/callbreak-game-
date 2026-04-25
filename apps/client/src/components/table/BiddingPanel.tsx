import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Card } from '@callbreak/shared';
import { socket } from '../../socket/client.js';
import { useRoomStore } from '../../store/room.js';
import { MIN_BID, MAX_BID } from '@callbreak/shared';
import { sounds } from '../../lib/sounds.js';

// Simple hand-strength heuristic: estimate likely tricks
function estimateTricks(hand: Card[]): number {
  let score = 0;
  for (const card of hand) {
    if (card.suit === 'spades') {
      if (card.rank === 'A') score += 1.0;
      else if (card.rank === 'K') score += 0.85;
      else if (card.rank === 'Q') score += 0.7;
      else if (card.rank === 'J') score += 0.55;
      else if (card.rank === '10') score += 0.35;
      else score += 0.15;
    } else {
      if (card.rank === 'A') score += 0.75;
      else if (card.rank === 'K') score += 0.5;
      else if (card.rank === 'Q') score += 0.3;
    }
  }
  return Math.round(score);
}

export default function BiddingPanel() {
  const roomView = useRoomStore(s => s.roomView);

  const hint = useMemo(() => {
    if (!roomView) return null;
    return estimateTricks(roomView.yourHand);
  }, [roomView?.yourHand]);

  if (!roomView) return null;

  const { yourSeat, game } = roomView;
  const isMyBidTurn = game.phase === 'bidding' && game.currentTurnSeat === yourSeat;

  if (!isMyBidTurn) return null;

  function handleBid(bid: number) {
    sounds.bid();
    socket.emit('game:bid', { bid }, (result) => {
      if (!result.ok) {
        sounds.error();
      }
    });
  }

  const bids = Array.from({ length: MAX_BID - MIN_BID + 1 }, (_, i) => i + MIN_BID);

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      className="flex flex-col items-center gap-3"
    >
      <div className="flex flex-col items-center gap-0.5">
        <div className="text-white font-display text-base drop-shadow tracking-wide">
          How many tricks will you win?
        </div>
        {hint !== null && (
          <div className="text-white/50 font-body text-xs">
            Estimated strength: ~{hint} trick{hint !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap justify-center max-w-xs">
        {bids.map(bid => {
          const isHint = hint !== null && bid === hint;
          return (
            <motion.button
              key={bid}
              whileHover={{ scale: 1.14, y: -5 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleBid(bid)}
              className={`w-13 h-13 rounded-2xl font-display text-2xl shadow-lg transition-colors
                          ${isHint
                  ? 'bg-cb-gold border-4 border-yellow-300 text-gray-900 ring-2 ring-yellow-200 ring-offset-1 ring-offset-transparent'
                  : 'bg-cb-gold border-4 border-yellow-600 text-gray-900 hover:bg-yellow-300'
                }`}
              style={{ width: 52, height: 52 }}
            >
              {bid}
              {isHint && (
                <span className="block text-[8px] font-body leading-none -mt-0.5 opacity-70">hint</span>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
