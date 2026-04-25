import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoomStore } from '../../store/room.js';
import { cumulativeScores, formatScore } from '@callbreak/shared';
import type { Seat, Trick } from '@callbreak/shared';
import PlayerSeat from './PlayerSeat.js';
import TrickArea from './TrickArea.js';
import Hand from './Hand.js';
import BiddingPanel from './BiddingPanel.js';
import Scoreboard from './Scoreboard.js';
import GameOverModal from '../end/GameOverModal.js';
import ChatPanel from '../chat/ChatPanel.js';
import TurnTimer from '../ui/TurnTimer.js';
import RulesModal from '../ui/RulesModal.js';
import { sounds } from '../../lib/sounds.js';

const AVATAR_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];

export default function GameTable() {
  const roomView = useRoomStore(s => s.roomView);
  const chatMessages = useRoomStore(s => s.chatMessages);
  const showToast = useRoomStore(s => s.showToast);
  const [scoreboardOpen, setScoreboardOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [lastTrick, setLastTrick] = useState<Trick | null>(null);
  const [seenCount, setSeenCount] = useState(0);
  const prevPhaseRef = useRef<string | null>(null);
  const prevTurnRef = useRef<Seat | null>(null);
  const prevSpadesBrokenRef = useRef(false);
  const prevCompletedRef = useRef(0);

  useEffect(() => {
    if (!roomView) return;
    const { game } = roomView;

    // Sound on your turn
    if (
      game.currentTurnSeat === roomView.yourSeat &&
      prevTurnRef.current !== game.currentTurnSeat
    ) {
      sounds.yourTurn();
    }
    prevTurnRef.current = game.currentTurnSeat;
    prevPhaseRef.current = game.phase;

    // Toast when spades are first broken
    const broken = game.round?.spadesBroken ?? false;
    if (broken && !prevSpadesBrokenRef.current) {
      showToast({ kind: 'info', message: '♠ Spades are broken!' });
    }
    prevSpadesBrokenRef.current = broken;

    // Track last completed trick
    const completed = game.round?.completedTricks ?? [];
    if (completed.length > prevCompletedRef.current && completed.length > 0) {
      setLastTrick(completed[completed.length - 1]);
    }
    if (game.phase === 'bidding') {
      setLastTrick(null);
      prevCompletedRef.current = 0;
    } else {
      prevCompletedRef.current = completed.length;
    }
  }, [roomView, showToast]);

  if (!roomView) return null;

  const { players, game, yourSeat, config } = roomView;
  const myPlayer = players.find(p => p.seat === yourSeat);

  // Relative seat positions: 0=south(you), 1=east(right), 2=north(top), 3=west(left)
  const eastSeat  = ((yourSeat + 1) % 4) as Seat;
  const northSeat = ((yourSeat + 2) % 4) as Seat;
  const westSeat  = ((yourSeat + 3) % 4) as Seat;

  const cum = game.scores.length > 0
    ? cumulativeScores(game.scores) as Record<Seat, number>
    : null;

  const myBid      = game.round?.bids[yourSeat as Seat];
  const myWon      = game.round?.tricksWon[yourSeat as Seat] ?? 0;
  const isMyTurn   = game.currentTurnSeat === yourSeat;
  const unreadChat = Math.max(0, chatMessages.length - seenCount);

  const phaseLabel = {
    waiting: 'LOBBY',
    dealing: 'DEALING...',
    bidding: 'BIDDING',
    playing: `ROUND ${(game.round?.index ?? 0) + 1} / 5`,
    scoring: 'ROUND OVER',
    ended: 'GAME OVER',
  }[game.phase] ?? '';

  const spadesBroken = game.round?.spadesBroken ?? false;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-transparent">

      {/* ═══ Main game area ═══ */}
      <div className="flex-1 flex flex-col min-h-screen relative select-none">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-3 py-2 z-20">
          <div className="flex gap-2">
            <button
              onClick={() => {
                sounds.buttonClick();
                if (window.confirm('Are you sure you want to leave the game?')) {
                  useRoomStore.getState().clearRoom();
                  window.location.href = '/';
                }
              }}
              className="flex items-center gap-1.5 btn-outline border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1.5 text-sm"
              title="Exit Game"
            >
              🚪 <span className="hidden sm:inline">Exit</span>
            </button>
            <button
              onClick={() => { setScoreboardOpen(true); sounds.buttonClick(); }}
              className="flex items-center gap-1.5 bg-black/30 hover:bg-black/50 border border-cb-gold/40
                         rounded-xl px-3 py-1.5 text-cb-gold font-body text-sm font-bold transition-colors"
            >
              🏆 <span className="hidden sm:inline">Scores</span>
            </button>
            <button
              onClick={() => { setRulesOpen(true); sounds.buttonClick(); }}
              className="flex items-center gap-1.5 bg-black/30 hover:bg-black/50 border border-white/20
                         rounded-xl px-3 py-1.5 text-white/70 font-body text-sm transition-colors"
            >
              📖 <span className="hidden sm:inline">Rules</span>
            </button>
          </div>

          <div className="flex flex-col items-center">
            <div className="text-white/70 font-display text-xs tracking-widest">{phaseLabel}</div>
            {spadesBroken && (
              <div className="text-xs text-purple-300 font-body animate-fade-in">♠ spades broken</div>
            )}
          </div>

          <div className="flex gap-2 items-center">
            {isMyTurn && game.phase === 'playing' && (
              <TurnTimer deadline={game.turnDeadline} timeoutMs={config.turnTimeoutMs} />
            )}
            <button
              onClick={() => {
                setChatOpen(o => !o);
                setSeenCount(chatMessages.length);
                sounds.buttonClick();
              }}
              className="flex items-center gap-1.5 bg-black/30 hover:bg-black/50 border border-cb-gold/40
                         rounded-xl px-3 py-1.5 text-cb-gold font-body text-sm font-bold transition-colors relative"
            >
              💬 <span className="hidden sm:inline">Chat</span>
              {unreadChat > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white
                                 text-[10px] flex items-center justify-center font-bold">
                  {Math.min(unreadChat, 9)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Felt table + players ── */}
        <div className="flex-1 flex items-center justify-center p-2 relative">
          <div className="relative w-full" style={{ maxWidth: 680 }}>

            {/* ── North player ── */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
              <PlayerSeat playerSeat={northSeat} position="north" />
            </div>

            {/* ── West player ── */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10">
              <PlayerSeat playerSeat={westSeat} position="west" />
            </div>

            {/* ── East player ── */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10">
              <PlayerSeat playerSeat={eastSeat} position="east" />
            </div>

            {/* ── Oval felt table ── */}
            <motion.div
              initial={{ scaleY: 0.5, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'backOut' }}
              className="felt-table mx-auto relative"
              style={{
                borderRadius: '50%',
                width: '100%',
                paddingTop: '58%', // aspect ratio ~= 0.58
              }}
            >
              <div className="absolute inset-0 rounded-[50%] overflow-hidden">
                {/* Round watermark */}
                {game.round && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="font-display text-white/10 text-3xl tracking-[0.4em] uppercase select-none">
                      ROUND {game.round.index + 1}/5
                    </span>
                  </div>
                )}

                {/* Dealer chip */}
                {game.round && (
                  <div className="absolute top-3 right-6">
                    <div className="w-7 h-7 rounded-full bg-white border-2 border-gray-400
                                    flex items-center justify-center font-mono font-bold text-gray-700 text-xs
                                    shadow-lg">D</div>
                  </div>
                )}

                {/* Center trick area */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <TrickArea />
                </div>
              </div>
            </motion.div>

            {/* ── South (you) seat info ── */}
            <div className="flex items-center justify-between mt-4 px-2">
              <div className="flex items-center gap-3">
                <motion.div
                  className={`player-avatar w-12 h-12 text-xl flex-shrink-0 overflow-hidden ${isMyTurn && game.phase === 'playing' ? 'active' : ''}`}
                  style={{ backgroundColor: AVATAR_COLORS[yourSeat] }}
                  animate={isMyTurn ? { scale: [1, 1.08, 1] } : {}}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  {myPlayer?.avatarUrl ? (
                    <img src={myPlayer.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    myPlayer?.name[0]?.toUpperCase()
                  )}
                </motion.div>
                <div>
                  <div className="font-body font-bold text-white text-sm leading-tight">
                    {myPlayer?.name}
                    <span className="text-cb-gold text-xs ml-1">(you)</span>
                    {myPlayer?.isHost && <span className="ml-1">👑</span>}
                  </div>
                  {cum && (
                    <div className={`font-mono text-xs ${cum[yourSeat as Seat] < 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {formatScore(cum[yourSeat as Seat])} pts
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isMyTurn && game.phase === 'bidding' && (
                  <TurnTimer deadline={game.turnDeadline} timeoutMs={config.turnTimeoutMs} />
                )}
                {myBid !== null && myBid !== undefined && (
                  <div className="bid-badge px-2" style={{ minWidth: 44, height: 24, fontSize: 13 }}>
                    {myWon}/{myBid}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom action area ── */}
        <div className="w-full flex flex-col items-center gap-3 pb-4 px-2">
          {/* Waiting for others to bid */}
          {game.phase === 'bidding' && game.currentTurnSeat !== yourSeat && (
            <div className="flex items-center gap-2 text-white/50 font-body text-sm">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              Waiting for {players.find(p => p.seat === game.currentTurnSeat)?.name} to bid...
            </div>
          )}

          {/* Scoring phase message */}
          {game.phase === 'scoring' && (
            <AnimatePresence>
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-cb-gold font-display text-lg text-center"
              >
                Round {(game.round?.index ?? 0) + 1} complete! Next round starting...
              </motion.div>
            </AnimatePresence>
          )}

          <BiddingPanel />
          <Hand />

          {/* Last trick peek */}
          {lastTrick && game.phase === 'playing' && (
            <AnimatePresence>
              <motion.button
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                onClick={() => setLastTrick(null)}
                className="flex items-center gap-2 text-white/50 hover:text-white/80 font-body text-xs
                           bg-black/20 hover:bg-black/40 rounded-xl px-3 py-1.5 transition-colors"
              >
                👁 Last trick won by {players.find(p => p.seat === lastTrick.winnerSeat)?.name ?? '?'}
              </motion.button>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* ═══ Desktop Chat sidebar ═══ */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="hidden lg:flex flex-col w-72 xl:w-80 border-l-2 border-cb-gold/30
                       bg-black/40 backdrop-blur-md"
          >
            <ChatPanel onClose={() => setChatOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Mobile Chat drawer ═══ */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/60 z-40"
            onClick={() => setChatOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28 }}
              className="absolute bottom-0 inset-x-0 h-2/3 bg-cb-red-dark border-t-2 border-cb-gold
                         rounded-t-2xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <ChatPanel onClose={() => setChatOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Scoreboard open={scoreboardOpen} onClose={() => setScoreboardOpen(false)} />
      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
      <GameOverModal />
    </div>
  );
}
