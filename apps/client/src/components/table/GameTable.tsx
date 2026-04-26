import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoomStore } from '../../store/room.js';
import { useSessionStore } from '../../store/session.js';
import { socket } from '../../socket/client.js';
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
  const roomView      = useRoomStore(s => s.roomView);
  const chatMessages  = useRoomStore(s => s.chatMessages);
  const showToast     = useRoomStore(s => s.showToast);
  const [scoreboardOpen, setScoreboardOpen] = useState(false);
  const [chatOpen, setChatOpen]             = useState(false);
  const [rulesOpen, setRulesOpen]           = useState(false);
  const [lastTrick, setLastTrick]           = useState<Trick | null>(null);
  const [seenCount, setSeenCount]           = useState(0);
  const prevTurnRef          = useRef<Seat | null>(null);
  const prevSpadesBrokenRef  = useRef(false);
  const prevCompletedRef     = useRef(0);

  useEffect(() => {
    if (!roomView) return;
    const { game } = roomView;

    if (game.currentTurnSeat === roomView.yourSeat && prevTurnRef.current !== game.currentTurnSeat) {
      sounds.yourTurn();
    }
    prevTurnRef.current = game.currentTurnSeat;

    const broken = game.round?.spadesBroken ?? false;
    if (broken && !prevSpadesBrokenRef.current) {
      showToast({ kind: 'info', message: '♠ Spades are broken!' });
    }
    prevSpadesBrokenRef.current = broken;

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

  const { code, players, game, yourSeat, config } = roomView;
  const myPlayer = players.find(p => p.seat === yourSeat);

  const eastSeat  = ((yourSeat + 1) % 4) as Seat;
  const northSeat = ((yourSeat + 2) % 4) as Seat;
  const westSeat  = ((yourSeat + 3) % 4) as Seat;

  const cum      = game.scores.length > 0 ? cumulativeScores(game.scores) as Record<Seat, number> : null;
  const myBid    = game.round?.bids[yourSeat as Seat];
  const myWon    = game.round?.tricksWon[yourSeat as Seat] ?? 0;
  const myCum    = cum ? cum[yourSeat as Seat] : 0;
  const isMyTurn = game.currentTurnSeat === yourSeat;
  const unread   = Math.max(0, chatMessages.length - seenCount);
  const spadesBroken = game.round?.spadesBroken ?? false;

  function leaveGame() {
    sounds.buttonClick();
    if (!window.confirm('Leave this game?')) return;
    socket.emit('room:leave');
    useRoomStore.getState().clearRoom();
    useSessionStore.getState().resetSession();
    window.location.href = '/';
  }

  function copyRoomCode() {
    navigator.clipboard.writeText(`${window.location.origin}/room/${code}`);
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden select-none">

      {/* ── Floating icon buttons ── */}
      <button
        onClick={() => { setScoreboardOpen(true); sounds.buttonClick(); }}
        className="absolute top-3 left-3 z-30 w-11 h-11 rounded-full bg-orange-500 hover:bg-orange-400
                   border-2 border-orange-300 flex items-center justify-center text-lg shadow-xl transition-colors"
        title="Scoreboard"
      >🕯</button>

      <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
        {isMyTurn && game.phase === 'playing' && (
          <TurnTimer deadline={game.turnDeadline} timeoutMs={config.turnTimeoutMs} />
        )}
        <button
          onClick={() => { setChatOpen(o => !o); setSeenCount(chatMessages.length); sounds.buttonClick(); }}
          className="relative w-11 h-11 rounded-full bg-yellow-500/90 hover:bg-yellow-400
                     border-2 border-yellow-300 flex items-center justify-center text-lg shadow-xl transition-colors"
          title="Chat"
        >
          💬
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white
                             text-[10px] flex items-center justify-center font-bold">
              {Math.min(unread, 9)}
            </span>
          )}
        </button>
        <button
          onClick={() => { setRulesOpen(true); sounds.buttonClick(); }}
          className="w-11 h-11 rounded-full bg-yellow-500/90 hover:bg-yellow-400
                     border-2 border-yellow-300 flex items-center justify-center text-lg shadow-xl transition-colors"
          title="Rules"
        >⚙️</button>
        <button
          onClick={leaveGame}
          className="w-11 h-11 rounded-full bg-red-600/80 hover:bg-red-500
                     border-2 border-red-400 flex items-center justify-center text-lg shadow-xl transition-colors"
          title="Leave"
        >🚪</button>
      </div>

      {/* ── Table section ── */}
      <div className="flex-1 flex items-center justify-center min-h-0 px-2 py-1">
        {/*
          The container is narrower than the viewport so east/west players
          (absolutely positioned outside it) still appear on screen.
        */}
        <div className="relative w-full" style={{ maxWidth: 720 }}>

          {/* North player – sits above the oval */}
          <div className="absolute z-10"
               style={{ bottom: '100%', left: '50%', transform: 'translateX(-50%)', paddingBottom: 6 }}>
            <PlayerSeat playerSeat={northSeat} position="north" />
          </div>

          {/* West player – sits to the left of the oval */}
          <div className="absolute z-10"
               style={{ right: '100%', top: '50%', transform: 'translateY(-50%)', paddingRight: 8 }}>
            <PlayerSeat playerSeat={westSeat} position="west" />
          </div>

          {/* East player – sits to the right of the oval */}
          <div className="absolute z-10"
               style={{ left: '100%', top: '50%', transform: 'translateY(-50%)', paddingLeft: 8 }}>
            <PlayerSeat playerSeat={eastSeat} position="east" />
          </div>

          {/* Oval felt table */}
          <motion.div
            initial={{ scaleY: 0.4, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'backOut' }}
            className="felt-table relative"
            style={{ borderRadius: '50%', width: '100%', paddingTop: '56%' }}
          >
            <div className="absolute inset-0 rounded-[50%] overflow-hidden">

              {/* Round watermark */}
              {game.round && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                  <span
                    className="font-display font-black text-white uppercase whitespace-nowrap"
                    style={{ opacity: 0.07, fontSize: '3.5rem', letterSpacing: '5rem' }}
                  >
                    ROUND {game.round.index + 1}
                  </span>
                </div>
              )}

              {/* Trick cards */}
              <div className="absolute inset-0 flex items-center justify-center">
                <TrickArea />
              </div>
            </div>
          </motion.div>

          {/* South player (you) – sits below the oval */}
          <div className="mt-2 flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              {/* Cumulative score badge */}
              <div className="w-8 h-8 rounded-full bg-orange-500 border-2 border-orange-200
                              flex items-center justify-center font-display font-bold text-white text-sm shadow-lg">
                {myCum}
              </div>

              {/* Avatar */}
              <motion.div
                className={`player-avatar w-12 h-12 text-base overflow-hidden
                            border-[3px] ${isMyTurn && game.phase === 'playing' ? 'border-green-400 active' : 'border-white/40'}`}
                style={{ backgroundColor: AVATAR_COLORS[yourSeat] }}
                animate={isMyTurn ? { scale: [1, 1.06, 1] } : {}}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                {myPlayer?.avatarUrl
                  ? <img src={myPlayer.avatarUrl} alt="" className="w-full h-full object-cover" />
                  : myPlayer?.name[0]?.toUpperCase()}
              </motion.div>

              {/* Bid / tricks badge */}
              {myBid !== undefined && myBid !== null ? (
                <div className="rounded-full bg-red-600 border-2 border-red-300 px-1.5 h-8 min-w-[40px]
                                flex items-center justify-center font-display font-bold text-white text-xs shadow-lg">
                  {myWon}/{myBid}
                </div>
              ) : (
                <div className="w-8" />
              )}
            </div>

            {/* Name tag */}
            <div className="bg-white/90 text-gray-900 font-bold text-xs px-2.5 py-0.5 rounded-lg shadow">
              {myPlayer?.name ?? 'You'}
              {myPlayer?.isHost && ' 👑'}
              {cum && (
                <span className={`ml-1 font-mono ${myCum < 0 ? 'text-red-600' : 'text-green-700'}`}>
                  ({formatScore(myCum)})
                </span>
              )}
            </div>

            {spadesBroken && (
              <div className="text-[11px] text-purple-300 animate-fade-in">♠ spades broken</div>
            )}

            {/* Room code chip */}
            <button
              onClick={copyRoomCode}
              className="text-[10px] font-mono text-white/40 hover:text-white/70 tracking-widest transition-colors"
            >
              {code}
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom: banner + bidding + hand ── */}
      <div className="flex flex-col items-center gap-2 pb-3 px-2">

        <AnimatePresence>
          {isMyTurn && game.phase === 'playing' && (
            <motion.div
              key="your-turn"
              initial={{ opacity: 0, scaleX: 0.7, y: 6 }}
              animate={{ opacity: 1, scaleX: 1, y: 0 }}
              exit={{ opacity: 0, scaleX: 0.7 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="your-turn-banner"
            >
              YOUR TURN
            </motion.div>
          )}
        </AnimatePresence>

        {game.phase === 'bidding' && game.currentTurnSeat !== yourSeat && (
          <div className="flex items-center gap-2 text-white/60 font-body text-sm">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            Waiting for {players.find(p => p.seat === game.currentTurnSeat)?.name} to bid…
          </div>
        )}

        {game.phase === 'scoring' && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-cb-gold font-display text-lg text-center"
          >
            Round {(game.round?.index ?? 0) + 1} complete! Next round starting…
          </motion.div>
        )}

        {isMyTurn && game.phase === 'bidding' && (
          <TurnTimer deadline={game.turnDeadline} timeoutMs={config.turnTimeoutMs} />
        )}

        <BiddingPanel />
        <Hand />

        <AnimatePresence>
          {lastTrick && game.phase === 'playing' && (
            <motion.button
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={() => setLastTrick(null)}
              className="flex items-center gap-2 text-white/50 hover:text-white/80 font-body text-xs
                         bg-black/20 hover:bg-black/40 rounded-xl px-3 py-1.5 transition-colors"
            >
              👁 Last trick: {players.find(p => p.seat === lastTrick.winnerSeat)?.name ?? '?'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Chat drawer ── */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
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
