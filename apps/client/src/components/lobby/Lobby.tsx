import { motion } from 'framer-motion';
import { useState } from 'react';
import { socket } from '../../socket/client.js';
import { useRoomStore } from '../../store/room.js';
import { useSessionStore } from '../../store/session.js';
import RoomCode from './RoomCode.js';
import PlayerSlot from './PlayerSlot.js';
import RoomSettings from './RoomSettings.js';
import type { Seat } from '@callbreak/shared';

export default function Lobby() {
  const roomView = useRoomStore(s => s.roomView);
  const showToast = useRoomStore(s => s.showToast);
  const [settingsOpen, setSettingsOpen] = useState(false);
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
  const seatedCount = players.length;

  return (
    <div className="min-h-screen relative overflow-hidden px-3 py-3">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,83,45,0.38),rgba(2,6,23,0.96)_70%)]" />
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 mx-auto flex min-h-[calc(100vh-24px)] w-full max-w-5xl flex-col"
      >
        <div className="flex items-center justify-between gap-2 py-2">
          <button
            onClick={() => {
              if (window.confirm('Leave the room?')) {
                socket.emit('room:leave');
                useRoomStore.getState().clearRoom();
                useSessionStore.getState().resetSession();
                window.location.href = '/';
              }
            }}
            className="btn-outline px-3 py-2 text-xs"
          >
            Leave
          </button>

          <div className="text-center">
            <div className="font-display text-3xl text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.8)] sm:text-4xl">
              CALLBREAK
            </div>
            <div className="font-body text-xs text-white/50">{seatedCount}/4 seats ready</div>
          </div>

          <button
            onClick={() => setSettingsOpen(value => !value)}
            className="btn-outline px-3 py-2 text-xs"
          >
            Settings
          </button>
        </div>

        <div className="mx-auto w-full max-w-sm">
          <RoomCode code={code} />
        </div>

        {settingsOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mx-auto mt-3 w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-black/55 p-4 backdrop-blur-md"
          >
            <RoomSettings config={config} isHost={isHost} />
          </motion.div>
        )}

        <div className="relative mt-4 flex flex-1 items-center justify-center">
          <div className="relative h-[56vh] min-h-[420px] w-full max-w-4xl">
            <div className="felt-table absolute inset-x-[8%] top-[13%] bottom-[16%] rounded-[48%]" />

            <div className="absolute left-1/2 top-0 w-full max-w-[260px] -translate-x-1/2 sm:max-w-xs">
              <PlayerSlot
                seat={2}
                player={players.find(p => p.seat === 2)}
                isYou={yourSeat === 2}
                isHost={hostSeat === 2}
                canKick={isHost && yourSeat !== 2}
                onKick={() => handleKick(2)}
                onAddBot={() => handleAddBot(2)}
              />
            </div>

            <div className="absolute left-0 top-1/2 w-full max-w-[172px] -translate-y-1/2 sm:max-w-xs lg:max-w-[260px]">
              <PlayerSlot
                seat={3}
                player={players.find(p => p.seat === 3)}
                isYou={yourSeat === 3}
                isHost={hostSeat === 3}
                canKick={isHost && yourSeat !== 3}
                onKick={() => handleKick(3)}
                onAddBot={() => handleAddBot(3)}
              />
            </div>

            <div className="absolute right-0 top-1/2 w-full max-w-[172px] -translate-y-1/2 sm:max-w-xs lg:max-w-[260px]">
              <PlayerSlot
                seat={1}
                player={players.find(p => p.seat === 1)}
                isYou={yourSeat === 1}
                isHost={hostSeat === 1}
                canKick={isHost && yourSeat !== 1}
                onKick={() => handleKick(1)}
                onAddBot={() => handleAddBot(1)}
              />
            </div>

            <div className="absolute bottom-0 left-1/2 w-full max-w-[260px] -translate-x-1/2 sm:max-w-xs">
              <PlayerSlot
                seat={0}
                player={players.find(p => p.seat === 0)}
                isYou={yourSeat === 0}
                isHost={hostSeat === 0}
                canKick={isHost && yourSeat !== 0}
                onKick={() => handleKick(0)}
                onAddBot={() => handleAddBot(0)}
              />
            </div>

            {isHost && players.length < 4 && (
              <button
                onClick={() => {
                  const emptySeats = allSeats.filter(s => !players.some(p => p.seat === s));
                  emptySeats.forEach(s => handleAddBot(s));
                }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cb-gold/50 bg-black/55 px-4 py-2 font-body text-sm font-bold text-cb-gold backdrop-blur-md transition-colors hover:bg-cb-gold hover:text-black"
              >
                Fill Bots
              </button>
            )}
          </div>
        </div>

        {isHost && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="btn-gold mx-auto mb-2 w-full max-w-md text-2xl py-4"
            onClick={handleStart}
          >
            🃏 Start Game {humanCount < 4 && '(+Bots)'}
          </motion.button>
        )}
        {!isHost && (
          <div className="mb-3 text-center text-white/60 font-body animate-pulse">
            Waiting for host to start the game...
          </div>
        )}
      </motion.div>
    </div>
  );
}
