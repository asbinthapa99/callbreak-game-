import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../socket/client.js';
import { useSessionStore } from '../store/session.js';
import { useRoomStore } from '../store/room.js';
import Lobby from '../components/lobby/Lobby.js';
import GameTable from '../components/table/GameTable.js';

export default function Room() {
  const { code } = useParams<{ code: string }>();
  const navigate  = useNavigate();
  const { name, sessionId, avatarUrl } = useSessionStore();
  const roomView  = useRoomStore(s => s.roomView);
  const connected = useRoomStore(s => s.connected);
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!code) { navigate('/'); return; }

    // Already in this room — nothing to do
    if (roomView?.code === code.toUpperCase()) return;

    // In a different room — go home
    if (roomView && roomView.code !== code.toUpperCase()) { navigate('/'); return; }

    // Need a name before joining
    if (!name.trim()) {
      navigate(`/?code=${code.toUpperCase()}`);
      return;
    }

    // Wait for socket connection before emitting
    if (!connected) return;

    // Only emit once
    if (joinedRef.current) return;
    joinedRef.current = true;

    socket.emit('room:join', {
      code: code.toUpperCase(),
      name: name.trim(),
      sessionId,
      avatarUrl,
    }, (result) => {
      if (!result.ok) {
        // Room not found or full — go home with code pre-filled
        navigate(`/?code=${code.toUpperCase()}&error=${encodeURIComponent(result.error)}`);
      }
    });
  }, [code, connected, roomView, name, sessionId, avatarUrl, navigate]);

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white font-display text-2xl animate-pulse">Connecting…</div>
      </div>
    );
  }

  if (!roomView) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-white font-display text-2xl animate-pulse mb-4">Joining room…</div>
          <button onClick={() => navigate('/')} className="btn-outline text-sm">← Back</button>
        </div>
      </div>
    );
  }

  if (roomView.game.phase === 'waiting') return <Lobby />;
  return <GameTable />;
}
