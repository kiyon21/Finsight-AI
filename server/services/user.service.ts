import { adminDb } from '../config/firebase.config';
import { cacheService, CacheService } from './cache.service';

export interface Goal {
  id?: string;
  goal_name: string;
  goal_type: string;
  goal_description: string;
  target_amount: string;
  current_amount: string;
  target_date: string;
  monthly_contribution: string;
  priority_level: string;
}

export interface IncomeSource {
  id?: string;
  sourceName: string;
  type: string;
  amount: string;
  currency: string;
  frequency: string;
  startDate: string;
  endDate: string;
  isTaxed: boolean;
  estimatedTaxRate: string;
  stability: string;
  confidenceRating: string;
  notes: string;
  isPrimary: boolean;
}

export class UserService {
  // Goal operations
  async addGoal(uid: string, goal: Goal): Promise<string> {
    try {
      // Remove id field if it exists (shouldn't be in new documents)
      const { id, ...goalData } = goal;
      
      const goalRef = await adminDb
        .collection('users')
        .doc(uid)
        .collection('goals')
        .add(goalData);
      
      // Invalidate cache
      await cacheService.delete(CacheService.getGoalsKey(uid));
      await cacheService.delete(CacheService.getDashboardKey(uid));
      // Also invalidate page cache patterns
      await cacheService.deletePattern(`page:*:${uid}*`);
      
      console.log(`Goal added successfully for user ${uid}: ${goalRef.id}`);
      return goalRef.id;
    } catch (error: any) {
      console.error(`Error adding goal for user ${uid}:`, error);
      throw new Error(`Failed to add goal: ${error.message}`);
    }
  }

  async getGoals(uid: string): Promise<Goal[]> {
    try {
      // Check cache first
      const cacheKey = CacheService.getGoalsKey(uid);
      const cached = await cacheService.get<Goal[]>(cacheKey);
      if (cached && cached.length > 0) {
        return cached;
      }

      const goalsSnapshot = await adminDb
        .collection('users')
        .doc(uid)
        .collection('goals')
        .get();

      // Filter out metadata document
      const goals = goalsSnapshot.docs
        .filter(doc => doc.id !== '_metadata')
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Goal[];

      // Only cache non-empty results to avoid caching "no goals" state
      // This ensures that after adding goals, we always check Firebase for new data
      if (goals.length > 0) {
      await cacheService.set(cacheKey, goals);
      }

      return goals;
    } catch (error: any) {
      throw new Error(`Failed to get goals: ${error.message}`);
    }
  }

  async deleteGoal(uid: string, goalId: string): Promise<void> {
    try {
      await adminDb
        .collection('users')
        .doc(uid)
        .collection('goals')
        .doc(goalId)
        .delete();
      
      // Invalidate cache
      await cacheService.delete(CacheService.getGoalsKey(uid));
      await cacheService.delete(CacheService.getDashboardKey(uid));
      // Also invalidate page cache patterns
      await cacheService.deletePattern(`page:*:${uid}*`);
    } catch (error: any) {
      throw new Error(`Failed to delete goal: ${error.message}`);
    }
  }

  async updateGoal(uid: string, goalId: string, goal: Partial<Goal>): Promise<void> {
    try {
      await adminDb
        .collection('users')
        .doc(uid)
        .collection('goals')
        .doc(goalId)
        .update(goal);
      
      // Invalidate cache
      await cacheService.delete(CacheService.getGoalsKey(uid));
      await cacheService.delete(CacheService.getDashboardKey(uid));
      // Also invalidate page cache patterns
      await cacheService.deletePattern(`page:*:${uid}*`);
    } catch (error: any) {
      throw new Error(`Failed to update goal: ${error.message}`);
    }
  }

  // Income operations
  async addIncomeSource(uid: string, income: IncomeSource): Promise<string> {
    try {
      // Remove id field if it exists (shouldn't be in new documents)
      const { id, ...incomeData } = income;
      
      const incomeRef = await adminDb
        .collection('users')
        .doc(uid)
        .collection('income')
        .add(incomeData);
      
      // Invalidate cache
      await cacheService.delete(CacheService.getIncomeKey(uid));
      await cacheService.delete(CacheService.getDashboardKey(uid));
      // Also invalidate page cache patterns
      await cacheService.deletePattern(`page:*:${uid}*`);
      
      console.log(`Income source added successfully for user ${uid}: ${incomeRef.id}`);
      return incomeRef.id;
    } catch (error: any) {
      console.error(`Error adding income source for user ${uid}:`, error);
      throw new Error(`Failed to add income source: ${error.message}`);
    }
  }

  async getIncomeSources(uid: string): Promise<IncomeSource[]> {
    try {
      // Check cache first
      const cacheKey = CacheService.getIncomeKey(uid);
      const cached = await cacheService.get<IncomeSource[]>(cacheKey);
      if (cached && cached.length > 0) {
        return cached;
      }

      const incomeSnapshot = await adminDb
        .collection('users')
        .doc(uid)
        .collection('income')
        .get();

      // Filter out metadata document
      const incomeSources = incomeSnapshot.docs
        .filter(doc => doc.id !== '_metadata')
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as IncomeSource[];

      // Only cache non-empty results to avoid caching "no income sources" state
      // This ensures that after adding income sources, we always check Firebase for new data
      if (incomeSources.length > 0) {
      await cacheService.set(cacheKey, incomeSources);
      }

      return incomeSources;
    } catch (error: any) {
      throw new Error(`Failed to get income sources: ${error.message}`);
    }
  }

  async deleteIncomeSource(uid: string, incomeId: string): Promise<void> {
    try {
      await adminDb
        .collection('users')
        .doc(uid)
        .collection('income')
        .doc(incomeId)
        .delete();
      
      // Invalidate cache
      await cacheService.delete(CacheService.getIncomeKey(uid));
      await cacheService.delete(CacheService.getDashboardKey(uid));
      // Also invalidate page cache patterns
      await cacheService.deletePattern(`page:*:${uid}*`);
    } catch (error: any) {
      throw new Error(`Failed to delete income source: ${error.message}`);
    }
  }

  async updateIncomeSource(uid: string, incomeId: string, income: Partial<IncomeSource>): Promise<void> {
    try {
      await adminDb
        .collection('users')
        .doc(uid)
        .collection('income')
        .doc(incomeId)
        .update(income);
      
      // Invalidate cache
      await cacheService.delete(CacheService.getIncomeKey(uid));
      await cacheService.delete(CacheService.getDashboardKey(uid));
      // Also invalidate page cache patterns
      await cacheService.deletePattern(`page:*:${uid}*`);
    } catch (error: any) {
      throw new Error(`Failed to update income source: ${error.message}`);
    }
  }
}

