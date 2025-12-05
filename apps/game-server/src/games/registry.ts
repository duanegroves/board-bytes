import { IGame } from '../core/interfaces/IGame';
import { Player } from '../core/room/types';
import { UnoGame } from './uno/UnoGame';

/**
 * Game factory function type
 * Takes roomId and players, returns a game instance
 */
type GameFactory = (roomId: string, players: Player[]) => IGame;

/**
 * Game metadata for client display
 */
interface GameMetadata {
  name: string;
  displayName: string;
  minPlayers: number;
  maxPlayers: number;
  description: string;
}

/**
 * Registry of all available games
 * Add new games here to make them available in the system
 */
const GAME_REGISTRY: Record<string, GameFactory> = {
  uno: (roomId: string, players: Player[]) => new UnoGame(roomId, players),

  // Future games - just add them here!
  // poker: (roomId: string, players: Player[]) => new PokerGame(roomId, players),
  // chess: (roomId: string, players: Player[]) => new ChessGame(roomId, players),
  // checkers: (roomId: string, players: Player[]) => new CheckersGame(roomId, players),
};

/**
 * Game metadata registry
 * Maps game type to display information
 */
const GAME_METADATA: Record<string, GameMetadata> = {
  uno: {
    name: 'uno',
    displayName: 'UNO',
    minPlayers: UnoGame.metadata.minPlayers,
    maxPlayers: UnoGame.metadata.maxPlayers,
    description: UnoGame.metadata.description || 'Classic card matching game',
  },

  // Future game metadata
  // poker: {
  //   name: 'poker',
  //   displayName: 'Texas Hold\'em Poker',
  //   minPlayers: 2,
  //   maxPlayers: 10,
  //   description: 'Classic poker card game',
  // },
};

/**
 * Create a game instance by type
 * @param gameType - The type of game to create (e.g., 'uno', 'poker')
 * @param roomId - The room ID where the game will be played
 * @param players - The players participating in the game
 * @returns A game instance implementing IGame
 * @throws Error if game type is not registered
 */
export function createGame(gameType: string, roomId: string, players: Player[]): IGame {
  const factory = GAME_REGISTRY[gameType];

  if (!factory) {
    const availableGames = Object.keys(GAME_REGISTRY).join(', ');
    throw new Error(`Unknown game type: "${gameType}". Available games: ${availableGames}`);
  }

  return factory(roomId, players);
}

/**
 * Get metadata for a specific game
 * @param gameType - The type of game
 * @returns Game metadata or undefined if not found
 */
export function getGameMetadata(gameType: string): GameMetadata | undefined {
  return GAME_METADATA[gameType];
}

/**
 * Get all available games
 * @returns Array of game metadata for all registered games
 */
export function getAllGames(): GameMetadata[] {
  return Object.values(GAME_METADATA);
}

/**
 * Check if a game type is registered
 * @param gameType - The type of game to check
 * @returns True if the game is registered
 */
export function isGameRegistered(gameType: string): boolean {
  return gameType in GAME_REGISTRY;
}
