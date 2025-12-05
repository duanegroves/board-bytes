import { Player } from '../room/types';

/**
 * Base interface for all games
 * Allows Room to work with any game type without tight coupling
 */
export interface IGame {
  roomId: string;
  players: Player[];

  /**
   * Get current game state (shape is game-specific)
   * Returns the public game state that all players can see
   */
  getGameState(): unknown;

  /**
   * Get a specific player's private state (e.g., their hand)
   * Returns game-specific private data for a player
   */
  getPlayerPrivateState(playerId: string): unknown;
}

/**
 * Static metadata about a game type
 * Use for validation, UI display, and game selection
 */
export interface IGameMetadata {
  name: string;
  minPlayers: number;
  maxPlayers: number;
  description?: string;
}
