import { useMemo, useState } from 'react';
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
  const [selectedBid, setSelectedBid] = useState<number | null>(null);

  const hint = useMemo(() => {
    if (!roomView) return null;
    return estimateTricks(roomView.yourHand);
  }, [roomView?.yourHand]);

  if (!roomView) return null;

  const { yourSeat, game } = roomView;
  const isMyBidTurn = game.phase === 'bidding' && game.currentTurnSeat === yourSeat;

  if (!isMyBidTurn) return null;

  function handleConfirm() {
    if (selectedBid === null) return;
    sounds.bid();
    socket.emit('game:bid', { bid: selectedBid }, (result) => {
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
      className="bg-white rounded-[32px] p-4 shadow-2xl border-4 border-black border-b-[8px] flex flex-col items-center gap-4 relative w-full max-w-sm mx-auto"
    >
      <div className="w-full text-left font-display text-xl tracking-wider uppercase text-black font-black" style={{ WebkitTextStroke: '1px black', color: 'white', textShadow: '2px 2px 0 #000' }}>
        PLACE YOUR CALL
      </div>

      <div className="flex gap-2 flex-wrap justify-center w-full px-2">
        {bids.map(bid => {
          const isSelected = selectedBid === bid;
          const isHint = hint !== null && bid === hint;
          return (
            <motion.button
              key={bid}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedBid(bid)}
              className={`w-12 h-12 rounded-full font-display text-2xl font-black shadow-lg transition-colors border-[3px] border-black flex flex-col items-center justify-center
                          ${isSelected
                  ? 'bg-yellow-400 text-black'
                  : 'bg-green-500 text-white hover:bg-green-400'
                }`}
            >
              {bid}
            </motion.button>
          );
        })}
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleConfirm}
        disabled={selectedBid === null}
        className={`px-6 py-2 rounded-full font-display font-black text-lg border-[3px] border-black transition-all shadow-md
                    ${selectedBid !== null 
                      ? 'bg-yellow-400 text-black hover:bg-yellow-300' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70'}`}
      >
        <span className="mr-2">✓</span> PLACE CALL
      </motion.button>
    </motion.div>
  );
}
