import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { socket } from '../socket/client.js';
import { useSessionStore } from '../store/session.js';
import { useRoomStore } from '../store/room.js';

export default function Home() {
  const navigate = useNavigate();
  const { name, avatarUrl, sessionId, setName, setAvatarUrl } = useSessionStore();
  const { connected } = useRoomStore();

  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize to max 128x128
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 128;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setAvatarUrl(dataUrl);
          setError('');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  function handleCreate() {
    if (!name.trim()) { setError('Enter your name first'); return; }
    setError('');
    setLoading('create');

    socket.emit('room:create', { name: name.trim(), sessionId, avatarUrl, config: {} }, (result) => {
      setLoading(null);
      if (result.ok) {
        navigate(`/room/${result.data.code}`);
      } else {
        setError(result.error);
      }
    });
  }

  function handleJoin() {
    if (!name.trim()) { setError('Enter your name first'); return; }
    if (!joinCode.trim()) { setError('Enter a room code'); return; }
    setError('');
    setLoading('join');

    socket.emit('room:join', { code: joinCode.toUpperCase().trim(), name: name.trim(), sessionId, avatarUrl }, (result) => {
      setLoading(null);
      if (result.ok) {
        navigate(`/room/${joinCode.toUpperCase().trim()}`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="font-display text-6xl text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.8)] tracking-wide">
            CALLBREAK
          </h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-cb-gold font-display text-xl">★</span>
            <span className="text-cb-gold font-display text-xl tracking-widest">MULTIPLAYER</span>
            <span className="text-cb-gold font-display text-xl">★</span>
          </div>
          {!connected && (
            <div className="mt-2 text-white/60 font-body text-sm animate-pulse">
              Connecting to server...
            </div>
          )}
        </div>

        {/* Panel */}
        <div className="panel space-y-4">
          <div className="flex flex-col items-center mb-6">
            <label className="cursor-pointer group relative">
              <div className="w-24 h-24 rounded-full border-4 border-cb-gold/50 bg-black/40 overflow-hidden flex items-center justify-center transition-colors group-hover:border-cb-gold">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-white/30 text-3xl font-display">
                    {name ? name[0].toUpperCase() : '?'}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-white font-body text-xs text-center leading-tight">Upload<br/>Avatar</span>
                </div>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>

          <div>
            <label className="block text-cb-gold font-display mb-2 text-sm tracking-wide uppercase">
              Your Name
            </label>
            <input
              className="input-field w-full"
              placeholder="Enter your name"
              value={name}
              maxLength={16}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
          </div>

          {error && (
            <div className="text-red-300 font-body text-sm text-center bg-red-900/50 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Create Room */}
          <button
            className="btn-gold w-full text-xl py-4"
            onClick={handleCreate}
            disabled={loading !== null || !connected}
          >
            {loading === 'create' ? 'Creating...' : '⚔ Create Room'}
          </button>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-white/50 font-body text-sm">OR</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          {/* Join Room */}
          <div className="flex gap-2">
            <input
              className="input-field flex-1 text-center uppercase tracking-[0.3em] text-xl font-display"
              placeholder="ROOM CODE"
              value={joinCode}
              maxLength={4}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
            />
            <button
              className="btn-gold px-4 text-lg"
              onClick={handleJoin}
              disabled={loading !== null || !connected}
            >
              {loading === 'join' ? '...' : 'Join'}
            </button>
          </div>
        </div>

        <p className="text-center text-white/40 font-body text-xs mt-6">
          No signup needed · Share room code with friends
        </p>
      </motion.div>
    </div>
  );
}
