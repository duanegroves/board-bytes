import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { config } from './config';
import { ServerToClientEvents, ClientToServerEvents } from './socket/types';
import { RoomManager } from './core/room/RoomManager';
import { registerSocketHandlers } from './socket/handlers';
import { log } from './shared/logger/Logger';
import { createRouter } from './http/routes';

const app = express();
const server = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: config.corsOrigin,
    credentials: true,
  },
});

// Initialize room manager
const roomManager = new RoomManager();

// Middleware
app.use(express.json()); // Parse JSON bodies

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Mount all HTTP routes (single aggregation point)
const routes = createRouter(roomManager);
app.use(routes);

/**
 * Socket.io connection handler
 * Registers all event handlers for a new socket connection
 */
io.on('connection', (socket) => {
  log.info('Player connected', { socketId: socket.id });

  // Register all socket event handlers
  registerSocketHandlers(io, socket, roomManager);
});

/**
 * Start the server
 */
server.listen(config.port, () => {
  log.info('🎮 Uno server started', {
    port: config.port,
    environment: config.nodeEnv,
    corsOrigin: config.corsOrigin,
  });
});
