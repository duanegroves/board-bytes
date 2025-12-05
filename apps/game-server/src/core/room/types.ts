/**
 * Room-specific types
 */

/**
 * Player type - works in both lobby and game states
 * Room-level fields are always present
 * Game-level fields are optional (added when game starts)
 */
export interface Player {
  // Room-level fields (always present)
  id: string;
  name: string;
  disconnected: boolean;

  // Game-level fields (optional, added by specific games)
  // Games can extend this with their own fields
  [key: string]: unknown;
}

/**
 * Room state for client synchronization
 */
export interface RoomState {
  roomId: string;
  players: Array<{
    id: string;
    name: string;
    disconnected: boolean;
  }>;
  playerCount: number;
  hasActiveGame: boolean;
}

/**
 * Room join data from client
 */
export interface RoomJoinData {
  roomId: string;
  playerName: string;
}
