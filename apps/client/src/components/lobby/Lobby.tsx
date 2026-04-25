import { motion } from 'framer-motion';
import { socket } from '../../socket/client.js';
import { useRoomStore } from '../../store/room.js';
import RoomCode from './RoomCode.js';
import PlayerSlot from './PlayerSlot.js';
import RoomSettings from './RoomSettings.js';
import type { Seat } from '@callbreak/shared';

export default function Lobby() {
  const roomView = useRoomStore(s => s.roomView);
  const showToast = useRoomStore(s => s.showToast);
  if (!roomView) return null;

  const { code, players, yourSeat, hostSeat, config } = roomView;
  const isHost = yourSeat === hostSeat;
  const humanCount = players.filter(p => !p.isBot).length;

  function handleStart() {
    socket.emit('game:start', (result) => {
      if (!result.ok) showToast({ kind: 'error', message: result.error });
    });
  }

  function handleKick(seat: Seat) {
    socket.emit('room:kick', { seat });
  }

  function handleAddBot(seat: Seat) {
    socket.emit('room:addBot', { seat }, (result) => {
      if (!result.ok) showToast({ kind: 'error', message: result.error });
    });
  }

  const allSeats: Seat[] = [0, 1, 2, 3];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-lg space-y-5"
      >
        {/* Title & Navigation */}
        <div className="relative text-center">
          <button
            onClick={() => {
              if (window.confirm('Leave the room?')) {
                useRoomStore.getState().clearRoom();
                window.location.href = '/';
              }
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-1 text-white/50 hover:text-red-400 font-body text-sm transition-colors"
          >
            ← Leave
          </button>
          <h1 className="font-display text-5xl text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.8)]">
            CALLBREAK
          </h1>
          <div className="text-cb-gold font-display text-lg">★ MULTIPLAYER ★</div>
        </div>

        {/* Room code */}
        <div className="panel">
          <RoomCode code={code} />
        </div>

        {/* Player slots */}
        <div className="panel space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-cb-gold font-display text-lg uppercase tracking-wide">
              Players ({players.filter(p => !p.isBot).length}/4)
            </h2>
            {isHost && players.length < 4 && (
              <button
                onClick={() => {
                  const emptySeats = allSeats.filter(s => !players.some(p => p.seat === s));
                  emptySeats.forEach(s => handleAddBot(s));
                }}
                className="text-xs bg-cb-gold/20 hover:bg-cb-gold/40 border border-cb-gold/40
                           text-cb-gold rounded-lg px-3 py-1.5 font-body font-bold transition-colors"
              >
                Fill with Bots
              </button>
            )}
          </div>
          {allSeats.map(seat => {
            const player = players.find(p => p.seat === seat);
            return (
              <PlayerSlot
                key={seat}
                seat={seat}
                player={player}
                isYou={seat === yourSeat}
                isHost={seat === hostSeat}
                canKick={isHost && seat !== yourSeat}
                onKick={() => handleKick(seat)}
                onAddBot={() => handleAddBot(seat)}
              />
            );
          })}
        </div>

        {/* Penalty config */}
        <div className="panel">
          <RoomSettings config={config} isHost={isHost} />
        </div>

        {/* Start button */}
        {isHost && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="btn-gold w-full text-2xl py-5"
            onClick={handleStart}
          >
            🃏 Start Game {humanCount < 4 && '(+Bots)'}
          </motion.button>
        )}
        {!isHost && (
          <div className="text-center text-white/50 font-body animate-pulse">
            Waiting for host to start the game...
          </div>
        )}
      </motion.div>
    </div>
  );
}
