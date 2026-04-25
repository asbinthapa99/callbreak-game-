import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type { ClientToServerEvents } from '@callbreak/shared';
import type { ServerToClientEvents } from '@callbreak/shared';

const SERVER_URL = import.meta.env['VITE_SERVER_URL'] ?? '';

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10,
});

export type AppSocket = typeof socket;
