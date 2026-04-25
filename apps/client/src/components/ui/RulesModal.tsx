import { motion, AnimatePresence } from 'framer-motion';

interface RulesModalProps {
  open: boolean;
  onClose: () => void;
}

const sections = [
  {
    title: '♠ Overview',
    body: '4 players, 52 cards, 5 rounds. Highest cumulative score wins.',
  },
  {
    title: '🃏 Dealing',
    body: 'Each player receives 13 cards. The dealer rotates each round.',
  },
  {
    title: '📢 Bidding',
    body: 'Starting from the player left of the dealer (anti-clockwise), each player bids 1–8 tricks. You must bid — no pass.',
  },
  {
    title: '♠ Trump',
    body: 'Spades are always trump. You cannot lead spades until they have been "broken" (played on a non-spade trick).',
  },
  {
    title: '🎯 Playing',
    body: 'You must follow the lead suit if you can. If you cannot follow suit, you may play any card including a spade. The trick is won by the highest spade, or (if no spade) the highest card of the lead suit.',
  },
  {
    title: '📊 Scoring',
    body: 'Made your bid (e.g. bid 3, won 3+): score = bid points + 0.1 per overtrick.\nFailed (won fewer than bid): score = −bid points.\nScores accumulate over 5 rounds.',
  },
  {
    title: '🏆 Winning',
    body: 'After 5 rounds, the player with the highest total wins. The player with the lowest total is the loser — and must complete the penalty set by the host!',
  },
];

export default function RulesModal({ open, onClose }: RulesModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', damping: 22 }}
            className="panel w-full max-w-md max-h-[85vh] overflow-y-auto space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-cb-gold tracking-wide">How to Play</h2>
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white transition-colors text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              {sections.map(sec => (
                <div key={sec.title} className="bg-white/5 rounded-xl p-3 space-y-1">
                  <div className="font-display text-sm text-cb-gold tracking-wide">{sec.title}</div>
                  <div className="font-body text-sm text-white/80 leading-relaxed whitespace-pre-line">{sec.body}</div>
                </div>
              ))}
            </div>

            <div className="text-center text-white/30 font-body text-xs pt-2">
              Spades = trump · 5 rounds · bid 1–8
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
