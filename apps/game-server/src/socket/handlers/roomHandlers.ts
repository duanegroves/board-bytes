import { RoomManager } from '../../core/room/RoomManager';
import { getPlayerRoom, TypedServer, TypedSocket } from '../helpers';
import { RoomJoinData } from '../../core/room/types';
import { GameError } from '../../core/errors/GameErrors';
import { log } from '../../shared/logger/Logger';
import { createGame, isGameRegistered } from '../../games/registry';
import { GameStartData } from '../types';

/**
 * Register room-related socket event handlers
 */
export function registerRoomHandlers(
  io: TypedServer,
  socket: TypedSocket,
  roomManager: RoomManager
) {
  /**
   * Handle command:common:room:join
   * Creates or joins a room
   * Supports reconnection if game has started and player name matches
   */
  socket.on('command:common:room:join', ({ roomId, playerName }: RoomJoinData) => {
    // Leave any previous room (only if different from target room)
    const oldRoom = getPlayerRoom(socket);
    if (oldRoom && oldRoom !== roomId) {
      socket.leave(oldRoom);

      const oldRoomInstance = roomManager.getRoom(oldRoom);
      if (oldRoomInstance) {
        oldRoomInstance.removePlayer(socket.id);
        io.to(oldRoom).emit('event:common:room:player-left', { playerId: socket.id });
        io.to(oldRoom).emit('state:room', oldRoomInstance.getRoomState());

        // If game was active, send updated game state
        if (oldRoomInstance.hasActiveGame()) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          io.to(oldRoom).emit('state:uno:game' as any, oldRoomInstance.getGameState());
        }
      }
    }

    try {
      // Get or create the room
      const room = roomManager.getOrCreateRoom(roomId);

      const isReconnection =
        room.hasActiveGame() && room.players.some((p) => p.name === playerName);

      // Room handles both join and reconnection
      room.addPlayer(socket.id, playerName || `Player ${socket.id.substring(0, 4)}`);

      socket.join(roomId);

      // Send room state to all players
      io.to(roomId).emit('state:room', room.getRoomState());

      // If game is active, send game state and player's hand
      if (room.hasActiveGame()) {
        // Note: Event names are now dynamic based on game type
        // This is a limitation of TypeScript with dynamic event names
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        io.to(roomId).emit('state:uno:game' as any, room.getGameState());
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        socket.emit('state:uno:hand' as any, room.getPlayerPrivateState(socket.id));
      }

      if (isReconnection) {
        // Notify about reconnection
        io.to(roomId).emit('event:common:room:player-reconnected', {
          playerId: socket.id,
          playerName: playerName,
        });

        log.info('Player reconnected to room', { playerName, roomId, socketId: socket.id });
      } else {
        // Notify others about new player
        socket.to(roomId).emit('event:common:room:player-joined', {
          playerId: socket.id,
          playerName: playerName,
        });

        log.info('Player joined room', { playerName, roomId, socketId: socket.id });
      }

      socket.emit('event:common:room:joined', {
        roomId,
        playerId: socket.id,
      });
    } catch (error) {
      const message = error instanceof GameError ? error.message : 'Failed to join room';
      socket.emit('error:common:room', { message });
      log.warn('Failed to join room', { roomId, playerName, error: message });
    }
  });

  /**
   * Handle player disconnect
   * Marks player as disconnected (if game active) or removes (if in lobby)
   */
  socket.on('disconnect', () => {
    log.info('Player disconnected', { socketId: socket.id });

    const roomId = getPlayerRoom(socket);
    if (roomId && roomManager.hasRoom(roomId)) {
      const room = roomManager.getRoom(roomId);
      if (room) {
        room.removePlayer(socket.id);

        // Notify other players
        io.to(roomId).emit('event:common:room:player-left', { playerId: socket.id });
        io.to(roomId).emit('state:room', room.getRoomState());

        // If game is active, send updated game state
        if (room.hasActiveGame()) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          io.to(roomId).emit('state:uno:game' as any, room.getGameState());
        }

        // Clean up empty rooms
        if (room.isEmpty()) {
          roomManager.deleteRoom(roomId);
          log.info('Deleted empty room', { roomId });
        }
      }
    }
  });

  // NOTE: Room list query moved to HTTP REST endpoint
  // GET /api/rooms - Returns list of all rooms
  // This is better because:
  // - Clients can fetch before connecting to WebSocket
  // - Can be cached with HTTP
  // - Standard REST semantics

  /**
   * Handle command:common:game:start
   * Start any registered game in the room (generic handler!)
   */
  socket.on('command:common:game:start', ({ gameType }: GameStartData) => {
    const roomId = getPlayerRoom(socket);
    if (!roomId) {
      socket.emit('error:common:room', { message: 'Not in a room' });
      return;
    }

    const room = roomManager.getRoom(roomId);
    if (!room) {
      socket.emit('error:common:room', { message: 'Room not found' });
      return;
    }

    try {
      // Validate game type
      if (!isGameRegistered(gameType)) {
        throw new Error(`Unknown game type: ${gameType}`);
      }

      // Create game using registry (no hard-coded game types!)
      room.startGame((roomId, players) => createGame(gameType, roomId, players));

      // Notify players - use dynamic event name based on game type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      io.to(roomId).emit(`event:${gameType}:game:started` as any);
      io.to(roomId).emit('state:room', room.getRoomState());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      io.to(roomId).emit(`state:${gameType}:game` as any, room.getGameState());

      // Send private state to each player
      room.players.forEach((player) => {
        const privateState = room.getPlayerPrivateState(player.id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        io.to(player.id).emit(`state:${gameType}:hand` as any, privateState);
      });

      log.info('Game started', {
        gameType,
        roomId,
        playerCount: room.players.length,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start game';
      socket.emit('error:common:room', { message });
      log.warn('Failed to start game', {
        gameType,
        roomId,
        error: message,
      });
    }
  });
}
