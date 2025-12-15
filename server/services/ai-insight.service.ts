import { adminDb } from '../config/firebase.config';
import { Timestamp } from 'firebase-admin/firestore';

export interface AIInsight {
  id?: string;
  user_id: string;
  analysis_type: string;
  summary?: any;
  ai_insights?: string;
  insights?: any;
  recommendations?: string[];
  spending_by_category?: Record<string, number>;
  model_used?: string;
  analysis_id?: number; // Django analysis ID
  created_at: string;
  updated_at?: string;
}

export class AIInsightService {
  // Collection names for each insight type
  private static readonly COLLECTIONS = {
    quick_insight: 'quickInsights',
    spending_analysis: 'spendingAnalyses',
    goal_recommendation: 'goalRecommendations',
    budget_suggestion: 'budgetSuggestions',
    savings_advice: 'savingsAdvices',
  };

  // Get collection name for an analysis type
  private getCollectionName(analysisType: string): string {
    const normalized = analysisType.toLowerCase().replace(/-/g, '_');
    return AIInsightService.COLLECTIONS[normalized as keyof typeof AIInsightService.COLLECTIONS] || 'insights';
  }

  // Save an AI insight to Firebase
  async saveInsight(uid: string, insight: Omit<AIInsight, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const collectionName = this.getCollectionName(insight.analysis_type);
      const now = new Date().toISOString();

      const insightData = {
        ...insight,
        created_at: now,
        updated_at: now,
      };

      const insightRef = await adminDb
        .collection('users')
        .doc(uid)
        .collection(collectionName)
        .add(insightData);

      console.log(`AI insight saved for user ${uid} in collection ${collectionName}: ${insightRef.id}`);
      return insightRef.id;
    } catch (error: any) {
      console.error(`Error saving AI insight for user ${uid}:`, error);
      throw new Error(`Failed to save AI insight: ${error.message}`);
    }
  }

  // Get insights for a user by type
  async getInsights(uid: string, analysisType: string, limit?: number): Promise<AIInsight[]> {
    try {
      const collectionName = this.getCollectionName(analysisType);
      let query = adminDb
        .collection('users')
        .doc(uid)
        .collection(collectionName)
        .orderBy('created_at', 'desc');

      if (limit) {
        query = query.limit(limit) as any;
      }

      const snapshot = await query.get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as AIInsight[];
    } catch (error: any) {
      console.error(`Error getting AI insights for user ${uid}:`, error);
      throw new Error(`Failed to get AI insights: ${error.message}`);
    }
  }

  // Get latest insight for a user by type
  async getLatestInsight(uid: string, analysisType: string): Promise<AIInsight | null> {
    try {
      const insights = await this.getInsights(uid, analysisType, 1);
      return insights.length > 0 ? insights[0] : null;
    } catch (error: any) {
      console.error(`Error getting latest AI insight for user ${uid}:`, error);
      return null;
    }
  }

  // Delete an insight
  async deleteInsight(uid: string, analysisType: string, insightId: string): Promise<void> {
    try {
      const collectionName = this.getCollectionName(analysisType);
      await adminDb
        .collection('users')
        .doc(uid)
        .collection(collectionName)
        .doc(insightId)
        .delete();
    } catch (error: any) {
      throw new Error(`Failed to delete AI insight: ${error.message}`);
    }
  }
}

