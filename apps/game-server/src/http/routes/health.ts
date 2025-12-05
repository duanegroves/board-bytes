import { Router } from 'express';
import os from 'os';

/**
 * Health check routes
 * Export pattern: Default (static router, no dependencies)
 * Health checks are stateless, so no DI needed
 */
const router = Router();

/**
 * Health check endpoint
 * Returns server status, uptime, and memory usage
 */
router.get('/health', (_req, res) => {
  const memUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memPercent = ((totalMem - freeMem) / totalMem) * 100;

  return res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      systemPercent: memPercent.toFixed(2),
    },
  });
});

export default router;
