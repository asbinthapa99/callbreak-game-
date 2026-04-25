import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoomStore } from '../store/room.js';
import Lobby from '../components/lobby/Lobby.js';
import GameTable from '../components/table/GameTable.js';

export default function Room() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const roomView = useRoomStore(s => s.roomView);
  const connected = useRoomStore(s => s.connected);

  useEffect(() => {
    // If we have a room view but the code doesn't match, redirect
    if (roomView && roomView.code !== code?.toUpperCase()) {
      navigate('/');
    }
  }, [roomView, code, navigate]);

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white font-display text-2xl animate-pulse">
          Connecting...
        </div>
      </div>
    );
  }

  if (!roomView) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-white font-display text-2xl animate-pulse mb-4">
            Joining room...
          </div>
          <button
            onClick={() => navigate('/')}
            className="btn-outline text-sm"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  const phase = roomView.game.phase;

  if (phase === 'waiting') {
    return <Lobby />;
  }

  return <GameTable />;
}
