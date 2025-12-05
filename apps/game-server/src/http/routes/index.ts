import { Router } from 'express';
import { RoomManager } from '../../core/room/RoomManager';
import healthRouter from './health';
import gamesRouter from './games';
import { createRoomsRouter } from './rooms';

/**
 * Main application router factory
 * Aggregates all route modules
 *
 * Export pattern explanation:
 * - Static routes (health, games) are imported directly
 * - Dynamic routes (rooms) use factory pattern to inject dependencies
 * - This keeps all route mounting in one place while allowing DI
 *
 * @param roomManager - RoomManager instance for routes that need it
 * @returns Configured Express router with all routes mounted
 */
export function createRouter(roomManager: RoomManager): Router {
  const router = Router();

  // Static routes (no dependencies)
  router.use('/health', healthRouter);
  router.use('/api', gamesRouter);

  // Dynamic routes (require dependencies)
  router.use('/api', createRoomsRouter(roomManager));

  return router;
}
