import { RoomManager } from '../../../core/room/RoomManager';
import { getPlayerRoom, TypedServer, TypedSocket } from '../../../socket/helpers';
import { UnoChallengeData, Card, GameState } from '../types';
import { GameError } from '../../../core/errors/GameErrors';
import { log } from '../../../shared/logger/Logger';
import { UnoGame } from '../UnoGame';

/**
 * Register UNO-related socket event handlers
 */
export function registerUnoHandlers(
  io: TypedServer,
  socket: TypedSocket,
  roomManager: RoomManager
) {
  /**
   * Handle command:uno:uno:call
   * Player calls UNO when they have one card left
   */
  socket.on('command:uno:uno:call', () => {
    const roomId = getPlayerRoom(socket);
    if (!roomId) return;

    const room = roomManager.getRoom(roomId);
    if (!room || !room.hasActiveGame()) return;

    const game = room.game as UnoGame;

    try {
      game.callUno(socket.id);

      io.to(roomId).emit('event:uno:uno:called', { playerId: socket.id });
      io.to(roomId).emit('state:uno:game', room.getGameState() as GameState);

      log.info('UNO called', { socketId: socket.id, roomId });
    } catch (error) {
      const message = error instanceof GameError ? error.message : 'Failed to call UNO';
      socket.emit('error:uno:uno', { message });
    }
  });

  /**
   * Handle command:uno:uno:challenge
   * Challenge a player who forgot to call UNO
   */
  socket.on('command:uno:uno:challenge', ({ targetId }: UnoChallengeData) => {
    const roomId = getPlayerRoom(socket);
    if (!roomId) return;

    const room = roomManager.getRoom(roomId);
    if (!room || !room.hasActiveGame()) return;

    const game = room.game as UnoGame;

    try {
      const message = game.catchUnoFailure(targetId);

      // Update the target's hand
      io.to(targetId).emit('state:uno:hand', room.getPlayerPrivateState(targetId) as Card[]);

      io.to(roomId).emit('event:uno:uno:challenged', {
        accuserId: socket.id,
        targetId: targetId,
        message,
      });

      io.to(roomId).emit('state:uno:game', room.getGameState() as GameState);

      log.info('UNO challenged', { accuserId: socket.id, targetId, roomId });
    } catch (error) {
      const message = error instanceof GameError ? error.message : 'Failed to challenge UNO';
      socket.emit('error:uno:uno', { message });
    }
  });
}
