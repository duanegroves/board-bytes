import { RoomManager } from '../../core/room/RoomManager';
import { TypedServer, TypedSocket } from '../types';
import { registerRoomHandlers } from './roomHandlers';
import { registerUnoSocketHandlers } from '../../games/uno/handlers';

/**
 * Register all Socket.io event handlers for a socket connection
 * @param io - Socket.io server instance
 * @param socket - Socket instance for the connected client
 * @param roomManager - Room manager instance
 */
export function registerSocketHandlers(
  io: TypedServer,
  socket: TypedSocket,
  roomManager: RoomManager
): void {
  // Register common room handlers (generic - work with any game)
  registerRoomHandlers(io, socket, roomManager);

  // Register game-specific handlers
  registerUnoSocketHandlers(io, socket, roomManager);

  // Future games would be registered here:
  // registerPokerSocketHandlers(io, socket, roomManager);
  // registerChessSocketHandlers(io, socket, roomManager);
}

// NOTE: Game list and room list moved to HTTP REST endpoints
// See: /api/games, /api/games/:gameType, /api/rooms
// This is better because:
// - Static/semi-static data doesn't need WebSockets
// - Can be cached with HTTP
// - Standard REST semantics
// - Can be accessed without WebSocket connection
