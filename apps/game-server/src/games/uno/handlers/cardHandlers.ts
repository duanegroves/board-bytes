import { RoomManager } from '../../../core/room/RoomManager';
import { getPlayerRoom, TypedServer, TypedSocket } from '../../../socket/helpers';
import { CardPlayData, Card, GameState } from '../types';
import { GameError } from '../../../core/errors/GameErrors';
import { log } from '../../../shared/logger/Logger';
import { UnoGame } from '../UnoGame';

/**
 * Register card-related socket event handlers
 */
export function registerCardHandlers(
  io: TypedServer,
  socket: TypedSocket,
  roomManager: RoomManager
) {
  /**
   * Handle command:uno:card:draw
   * Draws a card from the deck
   */
  socket.on('command:uno:card:draw', () => {
    const roomId = getPlayerRoom(socket);
    if (!roomId) return;

    const room = roomManager.getRoom(roomId);
    if (!room || !room.hasActiveGame()) return;

    const game = room.game as UnoGame;

    try {
      const card = game.drawCard(socket.id);

      socket.emit('state:uno:hand', room.getPlayerPrivateState(socket.id) as Card[]);
      socket.emit('event:uno:card:drawn', { card });

      io.to(roomId).emit('state:uno:game', room.getGameState() as GameState);
    } catch (error) {
      const message = error instanceof GameError ? error.message : 'Failed to draw card';
      socket.emit('error:uno:card', { action: 'draw', message });
    }
  });

  /**
   * Handle command:uno:card:play
   * Plays a card from the player's hand
   */
  socket.on('command:uno:card:play', ({ cardIndex, chosenColor }: CardPlayData) => {
    const roomId = getPlayerRoom(socket);
    if (!roomId) return;

    const room = roomManager.getRoom(roomId);
    if (!room || !room.hasActiveGame()) return;

    const game = room.game as UnoGame;

    try {
      const result = game.playCard(socket.id, cardIndex, chosenColor);

      // Broadcast the card played (event for replay)
      io.to(roomId).emit('event:uno:card:played', {
        playerId: socket.id,
        card: result.card,
      });

      // Update all hands (for draw effects)
      game.players.forEach((player) => {
        io.to(player.id).emit('state:uno:hand', room.getPlayerPrivateState(player.id) as Card[]);
      });

      // Send updated game state
      io.to(roomId).emit('state:uno:game', room.getGameState() as GameState);

      // Check for game over
      if (result.winner) {
        io.to(roomId).emit('event:uno:game:ended', { winner: result.winner });

        // End game but keep room (players stay for rematch)
        room.endGame();
        io.to(roomId).emit('state:room', room.getRoomState());

        log.info('Game ended', { roomId, winner: result.winner });
      }
    } catch (error) {
      const message = error instanceof GameError ? error.message : 'Failed to play card';
      socket.emit('error:uno:card', { action: 'play', message });
    }
  });
}
