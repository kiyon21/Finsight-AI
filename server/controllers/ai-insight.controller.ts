import { Request, Response } from 'express';
import { AIInsightService } from '../services/ai-insight.service';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.middleware';

export class AIInsightController {
  private aiInsightService: AIInsightService;

  constructor() {
    this.aiInsightService = new AIInsightService();
  }

  // Save an AI insight
  saveInsight = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.userId || req.params.uid;
      if (!uid) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const insightData = req.body;
      const insightId = await this.aiInsightService.saveInsight(uid, insightData);

      res.status(201).json({
        success: true,
        id: insightId,
        message: 'AI insight saved successfully',
      });
    } catch (error: any) {
      console.error('Error saving AI insight:', error);
      res.status(500).json({ error: error.message || 'Failed to save AI insight' });
    }
  };

  // Get insights for a user by type
  getInsights = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.userId || req.params.uid;
      if (!uid) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const analysisType = req.params.analysisType || req.query.analysis_type as string;
      if (!analysisType) {
        return res.status(400).json({ error: 'Analysis type is required' });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const insights = await this.aiInsightService.getInsights(uid, analysisType, limit);

      res.json(insights);
    } catch (error: any) {
      console.error('Error getting AI insights:', error);
      res.status(500).json({ error: error.message || 'Failed to get AI insights' });
    }
  };

  // Get latest insight for a user by type
  getLatestInsight = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.userId || req.params.uid;
      if (!uid) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const analysisType = req.params.analysisType || req.query.analysis_type as string;
      if (!analysisType) {
        return res.status(400).json({ error: 'Analysis type is required' });
      }

      const insight = await this.aiInsightService.getLatestInsight(uid, analysisType);

      if (!insight) {
        return res.status(404).json({ error: 'No insight found' });
      }

      res.json(insight);
    } catch (error: any) {
      console.error('Error getting latest AI insight:', error);
      res.status(500).json({ error: error.message || 'Failed to get latest AI insight' });
    }
  };

  // Delete an insight
  deleteInsight = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.userId || req.params.uid;
      if (!uid) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const analysisType = req.params.analysisType || req.query.analysis_type as string;
      const insightId = req.params.insightId;

      if (!analysisType || !insightId) {
        return res.status(400).json({ error: 'Analysis type and insight ID are required' });
      }

      await this.aiInsightService.deleteInsight(uid, analysisType, insightId);

      res.json({ success: true, message: 'AI insight deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting AI insight:', error);
      res.status(500).json({ error: error.message || 'Failed to delete AI insight' });
    }
  };
}

