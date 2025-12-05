import { Room } from './Room';

/**
 * RoomManager - Manages persistent rooms
 * Each room can contain an active game or be in lobby state
 * Rooms persist between games - players stay in the room
 */
export class RoomManager {
  private rooms: Map<string, Room>;

  constructor() {
    this.rooms = new Map();
  }

  /**
   * Get or create a room
   */
  getOrCreateRoom(roomId: string): Room {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Room(roomId));
      console.log(`Created new room: ${roomId}`);
    }
    return this.rooms.get(roomId)!;
  }

  /**
   * Get an existing room
   */
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Check if a room exists
   */
  hasRoom(roomId: string): boolean {
    return this.rooms.has(roomId);
  }

  /**
   * Delete a room (cleanup when empty)
   */
  deleteRoom(roomId: string): boolean {
    const deleted = this.rooms.delete(roomId);
    if (deleted) {
      console.log(`Deleted room: ${roomId}`);
    }
    return deleted;
  }

  /**
   * Get all rooms
   */
  getAllRooms(): Array<{
    roomId: string;
    playerCount: number;
    hasActiveGame: boolean;
  }> {
    return Array.from(this.rooms.values()).map((room) => ({
      roomId: room.roomId,
      playerCount: room.players.length,
      hasActiveGame: room.hasActiveGame(),
    }));
  }

  /**
   * Clean up empty rooms (call periodically or on disconnect)
   */
  cleanupEmptyRooms(): number {
    let cleaned = 0;
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.isEmpty()) {
        this.rooms.delete(roomId);
        cleaned++;
        console.log(`Cleaned up empty room: ${roomId}`);
      }
    }
    return cleaned;
  }

  /**
   * Get statistics
   */
  getStats() {
    const rooms = Array.from(this.rooms.values());
    return {
      totalRooms: this.rooms.size,
      activeGames: rooms.filter((r) => r.hasActiveGame()).length,
      lobbies: rooms.filter((r) => !r.hasActiveGame()).length,
    };
  }

  /**
   * Get total number of rooms
   */
  get size(): number {
    return this.rooms.size;
  }
}
