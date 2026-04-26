import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { socket } from '../socket/client.js';
import { useSessionStore } from '../store/session.js';
import { useRoomStore } from '../store/room.js';

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { name, avatarUrl, sessionId, setName, setAvatarUrl } = useSessionStore();
  const { connected } = useRoomStore();

  const [joinCode, setJoinCode] = useState(searchParams.get('code') ?? '');
  const [loading, setLoading] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState(searchParams.get('error') ?? '');

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
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

    socket.emit('room:join', { code: joinCode.trim(), name: name.trim(), sessionId, avatarUrl }, (result) => {
      setLoading(null);
      if (result.ok) {
        navigate(`/room/${joinCode.trim()}`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden px-3 py-5">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,83,45,0.42),rgba(2,6,23,0.96)_68%)]" />
      <div className="absolute inset-x-4 top-10 bottom-16 rounded-[42%] border-[12px] border-cb-gold/20 bg-emerald-950/40 shadow-[0_40px_120px_rgba(0,0,0,0.75),inset_0_0_80px_rgba(0,0,0,0.65)]" />
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-5">
          <h1 className="font-display text-5xl sm:text-6xl text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.8)] tracking-wide">
            CALLBREAK
          </h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-cb-gold font-display text-xl">★</span>
            <span className="text-cb-gold font-display text-lg sm:text-xl tracking-widest">MULTIPLAYER</span>
            <span className="text-cb-gold font-display text-xl">★</span>
          </div>
          <div className={`mt-2 font-body text-xs ${connected ? 'text-green-300' : 'text-yellow-200 animate-pulse'}`}>
            {connected ? 'Online rooms ready' : 'Connecting to server...'}
          </div>
        </div>

        <div className="rounded-2xl border-2 border-cb-gold/45 bg-black/55 p-4 shadow-2xl backdrop-blur-md sm:p-5">
          <div className="flex items-center gap-3">
            <label className="cursor-pointer group relative flex-shrink-0">
              <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-cb-gold/70 bg-black/50 flex items-center justify-center transition-colors group-hover:border-cb-gold">
                {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" /> : (
                  <span className="text-white/50 text-2xl font-display">{name ? name[0].toUpperCase() : '?'}</span>
                )}
                <span className="absolute inset-0 grid place-items-center bg-black/65 text-[10px] font-bold uppercase text-white opacity-0 transition-opacity group-hover:opacity-100">
                  Avatar
                </span>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>

            <div className="min-w-0 flex-1">
              <label className="block text-cb-gold font-display mb-1 text-xs tracking-wide uppercase">
                Your Name
              </label>
              <input
                className="input-field w-full"
                placeholder="Enter name"
                value={name}
                maxLength={16}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>
          </div>

          {error && (
            <div className="mt-3 text-red-200 font-body text-sm text-center bg-red-900/70 border border-red-400/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            className="btn-gold mt-4 w-full text-xl py-4"
            onClick={handleCreate}
            disabled={loading !== null || !connected}
          >
            {loading === 'create' ? 'Creating...' : '⚔ Create Room'}
          </button>

          <div className="relative my-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-white/50 font-body text-sm">OR</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          <div className="flex gap-2">
            <input
              className="input-field flex-1 text-center tracking-[0.4em] text-xl font-display"
              placeholder="0000"
              value={joinCode}
              maxLength={4}
              inputMode="numeric"
              onChange={e => setJoinCode(e.target.value.replace(/\D/g, ''))}
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
      </motion.div>
    </div>
  );
}
