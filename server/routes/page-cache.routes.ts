import { Router } from 'express';
import { PageCacheController } from '../controllers/page-cache.controller';
import { authenticateToken } from '../middleware/auth.middleware';

export function createPageCacheRoutes(pageCacheController: PageCacheController): Router {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(authenticateToken);

  // Page cache routes
  router.get('/dashboard/:uid', (req, res) => pageCacheController.getDashboardData(req, res));
  router.get('/transactions/:uid', (req, res) => pageCacheController.getTransactionsData(req, res));
  router.get('/ai-insights/:uid', (req, res) => pageCacheController.getAIInsightsData(req, res));
  router.post('/invalidate/:uid', (req, res) => pageCacheController.invalidatePageCache(req, res));

  return router;
}

