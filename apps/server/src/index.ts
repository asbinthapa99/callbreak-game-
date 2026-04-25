import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import { createSocketServer } from './socket/server.js';
import { registerConnectionHandlers } from './socket/handlers/connection.js';
import { registerRoomHandlers } from './socket/handlers/room.js';
import { registerGameHandlers } from './socket/handlers/game.js';
import { registerChatHandlers } from './socket/handlers/chat.js';
import { PORT, CORS_ORIGIN } from './config.js';
import { logger } from './lib/logger.js';

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

const httpServer = createServer(app);
const io = createSocketServer(httpServer);

io.on('connection', (socket) => {
  logger.debug(`Socket connected: ${socket.id}`);

  registerConnectionHandlers(io, socket);
  registerRoomHandlers(io, socket);
  registerGameHandlers(io, socket);
  registerChatHandlers(io, socket);
});

httpServer.listen(PORT, () => {
  logger.info(`Server listening on http://localhost:${PORT}`);
});
