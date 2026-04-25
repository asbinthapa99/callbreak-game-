import { create } from 'zustand';
import type { PublicRoomView } from '@callbreak/shared';
import type { ChatMessage } from '@callbreak/shared';

interface RoomState {
  roomView: PublicRoomView | null;
  chatMessages: ChatMessage[];
  connected: boolean;
  toast: { kind: 'info' | 'warn' | 'error'; message: string } | null;

  setRoomView: (view: PublicRoomView) => void;
  clearRoom: () => void;
  addChatMessage: (msg: ChatMessage) => void;
  setConnected: (v: boolean) => void;
  showToast: (t: { kind: 'info' | 'warn' | 'error'; message: string }) => void;
  clearToast: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  roomView: null,
  chatMessages: [],
  connected: false,
  toast: null,

  setRoomView: (view) => set({ roomView: view }),
  clearRoom: () => set({ roomView: null, chatMessages: [] }),
  addChatMessage: (msg) => set(s => ({
    chatMessages: [...s.chatMessages.slice(-199), msg], // keep last 200
  })),
  setConnected: (connected) => set({ connected }),
  showToast: (toast) => set({ toast }),
  clearToast: () => set({ toast: null }),
}));
