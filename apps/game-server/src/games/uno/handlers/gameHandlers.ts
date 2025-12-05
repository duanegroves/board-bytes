import { RoomManager } from '../../../core/room/RoomManager';
import { getPlayerRoom, TypedServer, TypedSocket } from '../../../socket/helpers';
import { GameState } from '../types';
import { GameError } from '../../../core/errors/GameErrors';
import { log } from '../../../shared/logger/Logger';
import { UnoGame } from '../UnoGame';

/**
 * Register game-related socket event handlers
 */
export function registerGameHandlers(
  io: TypedServer,
  socket: TypedSocket,
  roomManager: RoomManager
) {
  /**
   * Handle command:uno:turn:pass
   * Allows player to pass their turn after drawing a card
   */
  socket.on('command:uno:turn:pass', () => {
    const roomId = getPlayerRoom(socket);
    if (!roomId) return;

    const room = roomManager.getRoom(roomId);
    if (!room || !room.hasActiveGame()) {
      socket.emit('error:uno:game', { message: 'Not in a game room' });
      return;
    }

    const game = room.game as UnoGame;

    try {
      game.passTurn(socket.id);

      // Notify all players that turn was passed (event for replay)
      io.to(roomId).emit('event:uno:turn:passed', { playerId: socket.id });

      // Send updated game state
      io.to(roomId).emit('state:uno:game', room.getGameState() as GameState);

      log.info('Player passed turn', { socketId: socket.id, roomId });
    } catch (error) {
      const message = error instanceof GameError ? error.message : 'Failed to pass turn';
      socket.emit('error:uno:game', { message });
    }
  });
}
