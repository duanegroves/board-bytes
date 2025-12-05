import { IGame } from '../interfaces/IGame';
import { Player, RoomState } from './types';
import { GameAlreadyStartedError } from '../errors/GameErrors';

/**
 * Generic Room - A persistent container for players
 * Can be in lobby state (no game) or playing state (has game)
 * Completely game-agnostic - works with any IGame implementation
 */
export class Room {
  public roomId: string;
  public players: Player[];
  public game: IGame | null;

  constructor(roomId: string) {
    this.roomId = roomId;
    this.players = [];
    this.game = null;
  }

  // ========== PLAYER MANAGEMENT ==========

  /**
   * Add a player to the room
   * Handles both new joins and reconnections
   */
  addPlayer(playerId: string, playerName: string): void {
    // Check for reconnection (player with same name exists)
    const existingPlayer = this.players.find((p) => p.name === playerName);

    if (existingPlayer) {
      // Reconnection - update socket ID and mark as connected
      existingPlayer.id = playerId;
      existingPlayer.disconnected = false;
      return;
    }

    // New player
    if (this.game) {
      // Can't join a room with an active game
      throw new GameAlreadyStartedError();
    }

    // No player limit in room - game will validate on start
    this.players.push({
      id: playerId,
      name: playerName,
      disconnected: false,
    });
  }

  /**
   * Remove a player from the room
   * If game is active, marks as disconnected
   * If in lobby, removes completely
   */
  removePlayer(playerId: string): void {
    const player = this.players.find((p) => p.id === playerId);
    if (!player) return;

    if (this.game) {
      // Game active - mark as disconnected but keep in room
      player.disconnected = true;

      // If all players disconnected, end the game
      if (this.players.every((p) => p.disconnected)) {
        this.endGame();
      }
    } else {
      // No active game - remove from room entirely
      const index = this.players.indexOf(player);
      this.players.splice(index, 1);
    }
  }

  /**
   * Check if player exists in room
   */
  hasPlayer(playerId: string): boolean {
    return this.players.some((p) => p.id === playerId);
  }

  // ========== GAME LIFECYCLE ==========

  /**
   * Start a game using a factory function
   * Factory creates the specific game type and validates player count
   * @param gameFactory Function that creates a game instance
   * @throws Error from game constructor if player count invalid
   */
  startGame(gameFactory: (roomId: string, players: Player[]) => IGame): IGame {
    if (this.game !== null) {
      throw new GameAlreadyStartedError();
    }

    // Factory creates game and validates player count
    // Will throw if invalid for that game type
    this.game = gameFactory(this.roomId, this.players);

    console.log(`Game started in room ${this.roomId} with ${this.players.length} players`);
    return this.game;
  }

  /**
   * End the current game
   * Players remain in the room (lobby state)
   */
  endGame(): void {
    if (this.game) {
      console.log(`Game ended in room ${this.roomId}`);

      // Remove disconnected players and clean up game-specific data
      this.players = this.players
        .filter((p) => !p.disconnected)
        .map((p) => ({
          id: p.id,
          name: p.name,
          disconnected: false,
          // All game-specific fields (hand, calledUno, etc.) removed
        }));

      this.game = null;
    }
  }

  // ========== STATE QUERIES ==========

  /**
   * Check if room is empty
   */
  isEmpty(): boolean {
    return this.players.length === 0;
  }

  /**
   * Check if a game is currently active
   */
  hasActiveGame(): boolean {
    return this.game !== null;
  }

  /**
   * Get room state - completely generic, no game-specific logic
   */
  getRoomState(): RoomState {
    return {
      roomId: this.roomId,
      players: this.players.map((p) => ({
        id: p.id,
        name: p.name,
        disconnected: p.disconnected,
      })),
      playerCount: this.players.length,
      hasActiveGame: this.hasActiveGame(),
    };
  }

  /**
   * Get game state - delegates to game implementation
   * Returns null if no active game
   */
  getGameState(): unknown {
    return this.game?.getGameState() || null;
  }

  /**
   * Get player's private game state
   * Returns null if no active game
   */
  getPlayerPrivateState(playerId: string): unknown {
    return this.game?.getPlayerPrivateState(playerId) || null;
  }
}
