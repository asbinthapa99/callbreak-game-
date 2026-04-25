import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

interface SessionState {
  name: string;
  avatarUrl: string;
  sessionId: string;
  setName: (name: string) => void;
  setAvatarUrl: (url: string) => void;
}

function getOrCreateSessionId(): string {
  const existing = localStorage.getItem('cb_session_id');
  if (existing) return existing;
  const id = uuidv4();
  localStorage.setItem('cb_session_id', id);
  return id;
}

function getSavedName(): string {
  return localStorage.getItem('cb_player_name') ?? '';
}

export const useSessionStore = create<SessionState>((set) => ({
  name: getSavedName(),
  avatarUrl: localStorage.getItem('cb_avatar_url') ?? '',
  sessionId: getOrCreateSessionId(),
  setName: (name) => {
    localStorage.setItem('cb_player_name', name);
    set({ name });
  },
  setAvatarUrl: (url) => {
    localStorage.setItem('cb_avatar_url', url);
    set({ avatarUrl: url });
  },
}));
