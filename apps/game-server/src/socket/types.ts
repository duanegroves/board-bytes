/**
 * Socket.io Event Type Definitions
 */

import { Server, Socket } from 'socket.io';
import { Card, CardPlayData, UnoChallengeData, GameState } from '../games/uno/types';
import { RoomJoinData } from '../core/room/types';

/**
 * Events that the server can emit to clients
 * Pattern: type:game:domain:action
 * Types: event (facts for replay), state (snapshots), error (failures)
 */
export interface ServerToClientEvents {
  // Common Room Events (event:)
  'event:common:room:joined': (data: { roomId: string; playerId: string }) => void;
  'event:common:room:player-joined': (data: { playerId: string; playerName: string }) => void;
  'event:common:room:player-left': (data: { playerId: string }) => void;
  'event:common:room:player-reconnected': (data: { playerId: string; playerName: string }) => void;

  // Uno Game Events (event:)
  'event:uno:game:started': () => void;
  'event:uno:game:ended': (data: { winner: string }) => void;
  'event:uno:turn:passed': (data: { playerId: string }) => void;
  'event:uno:card:drawn': (data: { card: Card }) => void;
  'event:uno:card:played': (data: { playerId: string; card: Card }) => void;
  'event:uno:uno:called': (data: { playerId: string }) => void;
  'event:uno:uno:challenged': (data: {
    accuserId: string;
    targetId: string;
    message: string;
  }) => void;

  // State Updates (state:)
  'state:room': (state: {
    roomId: string;
    players: Array<{ id: string; name: string; disconnected: boolean }>;
    playerCount: number;
    hasActiveGame: boolean;
  }) => void;
  'state:uno:game': (state: GameState) => void;
  'state:uno:hand': (hand: Card[]) => void;
  // NOTE: Room list and game list moved to HTTP REST endpoints
  // 'state:common:rooms': (rooms: Array<...>) => void;  // Now: GET /api/rooms
  // 'state:common:games': (games: GameMetadata[]) => void;  // Now: GET /api/games
  // 'state:common:game:info': (metadata: GameMetadata) => void;  // Now: GET /api/games/:gameType

  // Errors (error:)
  'error:common:room': (data: { message: string }) => void;
  'error:uno:game': (data: { message: string }) => void;
  'error:uno:card': (data: { action: string; message: string }) => void;
  'error:uno:uno': (data: { message: string }) => void;
}

/**
 * Game start data from client
 */
export interface GameStartData {
  gameType: string; // e.g., 'uno', 'poker', 'chess'
}

/**
 * Game info query data
 */
export interface GameInfoQuery {
  gameType: string;
}

/**
 * Game metadata for display
 */
export interface GameMetadata {
  name: string;
  displayName: string;
  minPlayers: number;
  maxPlayers: number;
  description: string;
}

/**
 * Events that clients can emit to the server
 * Pattern: type:game:domain:action
 * Types: command (player intentions), query (read requests)
 */
export interface ClientToServerEvents {
  // Common Room Commands (command:)
  'command:common:room:join': (data: RoomJoinData) => void;
  'command:common:game:start': (data: GameStartData) => void; // Generic game start

  // Uno Game Commands (command:)
  // NOTE: Game start moved to common (above) - now works for any game!
  'command:uno:card:draw': () => void;
  'command:uno:card:play': (data: CardPlayData) => void;
  'command:uno:turn:pass': () => void;
  'command:uno:uno:call': () => void;
  'command:uno:uno:challenge': (data: UnoChallengeData) => void;

  // Queries (query:)
  // NOTE: Room list and game list moved to HTTP REST endpoints
  // 'query:common:room:list': () => void;  // Now: GET /api/rooms
  // 'query:common:game:list': () => void;  // Now: GET /api/games
  // 'query:common:game:info': (data: GameInfoQuery) => void;  // Now: GET /api/games/:gameType
}

/**
 * Typed Socket and Server aliases for convenience
 * Use these throughout the codebase instead of repeating the full generic types
 */
export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
