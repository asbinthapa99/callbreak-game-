import { Server } from 'socket.io';
import type { Socket } from 'socket.io';
import type { Server as HttpServer } from 'http';
import type { ClientToServerEvents } from '@callbreak/shared';
import type { ServerToClientEvents } from '@callbreak/shared';
import { CORS_ORIGIN } from '../config.js';

export type TypedIO = Server<ClientToServerEvents, ServerToClientEvents>;
export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function createSocketServer(httpServer: HttpServer): TypedIO {
  return new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: CORS_ORIGIN, methods: ['GET', 'POST'] },
  });
}
