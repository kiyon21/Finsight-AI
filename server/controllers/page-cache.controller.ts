import { Request, Response } from 'express';
import { PageCacheService } from '../services/page-cache.service';
import { QueueService } from '../services/queue.service';
import { randomUUID } from 'crypto';

export class PageCacheController {
  constructor(
    private pageCacheService: PageCacheService,
    private queueService: QueueService
  ) {}

  /**
   * Get cached dashboard data
   */
  getDashboardData = async (req: Request, res: Response) => {
    try {
      const { uid } = req.params;
      const { noCache } = req.query;

      if (!uid) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const bypassCache = noCache === 'true' || noCache === '1';
      const dashboardData = await this.pageCacheService.getDashboardData(uid, bypassCache);

      // Queue background job to persist cache to Firebase (if needed)
      // Note: Data is already in Firebase, this ensures consistency
      const jobId = randomUUID();
      await this.queueService.publishCachePersistenceJob({
        jobId,
        uid,
        pageType: 'dashboard',
        cacheData: dashboardData,
        timestamp: new Date().toISOString(),
      });

      res.json(dashboardData);
    } catch (error: any) {
      console.error('Get dashboard data error:', error);
      res.status(500).json({ error: error.message || 'Failed to get dashboard data' });
    }
  };

  /**
   * Get cached transactions data
   */
  getTransactionsData = async (req: Request, res: Response) => {
    try {
      const { uid } = req.params;
      const { limit, noCache } = req.query;

      if (!uid) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const bypassCache = noCache === 'true' || noCache === '1';
      const transactionsData = await this.pageCacheService.getTransactionsData(
        uid,
        limit ? parseInt(limit as string) : undefined,
        bypassCache
      );

      // Queue background job to persist cache to Firebase
      const jobId = randomUUID();
      await this.queueService.publishCachePersistenceJob({
        jobId,
        uid,
        pageType: 'transactions',
        cacheData: transactionsData,
        timestamp: new Date().toISOString(),
      });

      res.json(transactionsData);
    } catch (error: any) {
      console.error('Get transactions data error:', error);
      res.status(500).json({ error: error.message || 'Failed to get transactions data' });
    }
  };

  /**
   * Get cached AI insights data
   */
  getAIInsightsData = async (req: Request, res: Response) => {
    try {
      const { uid } = req.params;
      const { noCache } = req.query;

      if (!uid) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const bypassCache = noCache === 'true' || noCache === '1';
      const aiInsightsData = await this.pageCacheService.getAIInsightsData(uid, bypassCache);

      // Queue background job to persist cache to Firebase
      const jobId = randomUUID();
      await this.queueService.publishCachePersistenceJob({
        jobId,
        uid,
        pageType: 'ai-insights',
        cacheData: aiInsightsData,
        timestamp: new Date().toISOString(),
      });

      res.json(aiInsightsData);
    } catch (error: any) {
      console.error('Get AI insights data error:', error);
      res.status(500).json({ error: error.message || 'Failed to get AI insights data' });
    }
  };

  /**
   * Invalidate page cache for a user
   */
  invalidatePageCache = async (req: Request, res: Response) => {
    try {
      const { uid } = req.params;

      if (!uid) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      await this.pageCacheService.invalidatePageCache(uid);

      res.json({ message: 'Page cache invalidated successfully' });
    } catch (error: any) {
      console.error('Invalidate page cache error:', error);
      res.status(500).json({ error: error.message || 'Failed to invalidate page cache' });
    }
  };
}

