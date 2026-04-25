import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

interface SessionState {
  name: string;
  sessionId: string;
  setName: (name: string) => void;
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
  sessionId: getOrCreateSessionId(),
  setName: (name) => {
    localStorage.setItem('cb_player_name', name);
    set({ name });
  },
}));
