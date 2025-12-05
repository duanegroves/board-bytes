import { TypedSocket, TypedServer } from './types';

// Re-export for convenience
export type { TypedSocket, TypedServer };

/**
 * Get the game room for a socket
 * Filters out the socket's own ID (which is always in socket.rooms)
 *
 * @param socket - The socket instance
 * @returns The room ID or null if not in a room
 */
export function getPlayerRoom(socket: TypedSocket): string | null {
  const rooms = Array.from(socket.rooms).filter((room) => room !== socket.id);
  return rooms[0] || null;
}

/**
 * Get all sockets in a specific room
 *
 * @param io - Socket.io server instance
 * @param roomId - The room ID
 * @returns Array of socket IDs
 */
export function getSocketsInRoom(io: TypedServer, roomId: string): string[] {
  const room = io.sockets.adapter.rooms.get(roomId);
  return room ? Array.from(room) : [];
}

/**
 * Check if a socket is in a specific room
 *
 * @param socket - The socket instance
 * @param roomId - The room ID to check
 * @returns True if socket is in the room
 */
export function isInRoom(socket: TypedSocket, roomId: string): boolean {
  return socket.rooms.has(roomId);
}
