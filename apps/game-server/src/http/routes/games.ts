import { Router, Request, Response } from 'express';
import { getAllGames, getGameMetadata, isGameRegistered } from '../../games/registry';
import { log } from '../../shared/logger/Logger';

/**
 * Games routes
 * Export pattern: Default (static router, no runtime dependencies)
 * All game registry functions are pure/stateless, so no DI needed
 */
const router = Router();

/**
 * GET /api/games
 * Returns list of all available games
 *
 * Response: Array of game metadata
 * Example: [
 *   {
 *     name: 'uno',
 *     displayName: 'UNO',
 *     minPlayers: 2,
 *     maxPlayers: 10,
 *     description: 'Classic card matching game'
 *   }
 * ]
 */
router.get('/games', (_req: Request, res: Response) => {
  try {
    const games = getAllGames();

    log.debug('Game list requested via HTTP', {
      count: games.length,
    });

    // Cache for 1 hour (game list doesn't change often)
    res.set('Cache-Control', 'public, max-age=3600');

    res.status(200).json({
      success: true,
      data: games,
      count: games.length,
    });
  } catch (error) {
    log.error('Failed to fetch game list', { error });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch game list',
    });
  }
});

/**
 * GET /api/games/:gameType
 * Returns detailed info about a specific game
 *
 * Params:
 *   gameType - The type of game (e.g., 'uno', 'poker')
 *
 * Response: Game metadata object
 * Example: {
 *   name: 'uno',
 *   displayName: 'UNO',
 *   minPlayers: 2,
 *   maxPlayers: 10,
 *   description: 'Classic card matching game'
 * }
 */
router.get('/games/:gameType', (req: Request, res: Response) => {
  const { gameType } = req.params;

  try {
    if (!isGameRegistered(gameType)) {
      log.warn('Game info requested for unknown game', { gameType });

      return res.status(404).json({
        success: false,
        error: `Game type '${gameType}' not found`,
        availableGames: getAllGames().map((g) => g.name),
      });
    }

    const metadata = getGameMetadata(gameType);

    log.debug('Game info requested via HTTP', { gameType });

    // Cache for 1 hour
    res.set('Cache-Control', 'public, max-age=3600');

    res.status(200).json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    log.error('Failed to fetch game info', { gameType, error });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch game info',
    });
  }
});

export default router;
