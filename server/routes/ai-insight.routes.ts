import { Router } from 'express';
import { AIInsightController } from '../controllers/ai-insight.controller';
import { authenticateToken } from '../middleware/auth.middleware';

export function createAIInsightRoutes(aiInsightController: AIInsightController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authenticateToken);

  // Save an AI insight
  router.post('/:uid/insights', aiInsightController.saveInsight);

  // Get insights by type
  router.get('/:uid/insights/:analysisType', aiInsightController.getInsights);

  // Get latest insight by type
  router.get('/:uid/insights/:analysisType/latest', aiInsightController.getLatestInsight);

  // Delete an insight
  router.delete('/:uid/insights/:analysisType/:insightId', aiInsightController.deleteInsight);

  return router;
}

