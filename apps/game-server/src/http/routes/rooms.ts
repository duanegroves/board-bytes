import { Router, Request, Response } from 'express';
import { RoomManager } from '../../core/room/RoomManager';
import { log } from '../../shared/logger/Logger';

/**
 * Create rooms router
 *
 * Export pattern: Factory function (dynamic route with dependencies)
 * Why factory? This router needs RoomManager to access room state
 * Alternative would be module-level state, but factory is more testable
 *
 * @param roomManager - RoomManager instance for accessing room data
 * @returns Express router with room endpoints
 */
export function createRoomsRouter(roomManager: RoomManager): Router {
  const router = Router();

  /**
   * GET /api/rooms
   * Returns list of all active rooms
   *
   * Response: Array of room info
   * Example: [
   *   {
   *     roomId: 'room-123',
   *     playerCount: 3,
   *     hasActiveGame: true
   *   }
   * ]
   */
  router.get('/rooms', (_req: Request, res: Response) => {
    try {
      const rooms = roomManager.getAllRooms();

      log.debug('Room list requested via HTTP', {
        count: rooms.length,
      });

      // Short cache (30 seconds) - room list changes frequently
      res.set('Cache-Control', 'public, max-age=30');

      res.status(200).json({
        success: true,
        data: rooms,
        count: rooms.length,
      });
    } catch (error) {
      log.error('Failed to fetch room list', { error });

      res.status(500).json({
        success: false,
        error: 'Failed to fetch room list',
      });
    }
  });

  /**
   * GET /api/rooms/:roomId
   * Returns detailed info about a specific room
   *
   * Params:
   *   roomId - The room ID
   *
   * Response: Room state
   */
  router.get('/rooms/:roomId', (req: Request, res: Response) => {
    const { roomId } = req.params;

    try {
      const room = roomManager.getRoom(roomId);

      if (!room) {
        log.warn('Room info requested for non-existent room', { roomId });

        return res.status(404).json({
          success: false,
          error: `Room '${roomId}' not found`,
        });
      }

      const roomState = room.getRoomState();

      log.debug('Room info requested via HTTP', { roomId });

      // Very short cache (10 seconds) - room state changes frequently
      res.set('Cache-Control', 'public, max-age=10');

      res.status(200).json({
        success: true,
        data: roomState,
      });
    } catch (error) {
      log.error('Failed to fetch room info', { roomId, error });

      res.status(500).json({
        success: false,
        error: 'Failed to fetch room info',
      });
    }
  });

  /**
   * GET /api/stats
   * Returns server statistics
   *
   * Response: Server stats
   */
  router.get('/stats', (_req: Request, res: Response) => {
    try {
      const stats = roomManager.getStats();

      log.debug('Server stats requested via HTTP');

      // Short cache (30 seconds)
      res.set('Cache-Control', 'public, max-age=30');

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      log.error('Failed to fetch stats', { error });

      res.status(500).json({
        success: false,
        error: 'Failed to fetch stats',
      });
    }
  });

  return router;
}
