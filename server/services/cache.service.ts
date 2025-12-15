import { redisConnection } from '../config/redis.config';

export class CacheService {
  private static readonly DEFAULT_TTL = 3600; // 1 hour in seconds

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const client = redisConnection.getClient();
      if (!client || !redisConnection.isConnected()) {
        return null;
      }

      const value = await client.get(key);
      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`[Cache] Error getting key ${key}:`, error);
      return null; // Fail gracefully - return null so app can fetch from Firebase
    }
  }

  /**
   * Set value in cache with optional TTL
   */
  async set(key: string, value: any, ttl: number = CacheService.DEFAULT_TTL): Promise<void> {
    try {
      const client = redisConnection.getClient();
      if (!client || !redisConnection.isConnected()) {
        return;
      }

      const serialized = JSON.stringify(value);
      await client.setEx(key, ttl, serialized);
    } catch (error) {
      console.error(`[Cache] Error setting key ${key}:`, error);
      // Fail silently - cache is optional
    }
  }

  /**
   * Delete a specific key from cache
   */
  async delete(key: string): Promise<void> {
    try {
      const client = redisConnection.getClient();
      if (!client || !redisConnection.isConnected()) {
        return;
      }

      await client.del(key);
    } catch (error) {
      console.error(`[Cache] Error deleting key ${key}:`, error);
    }
  }

  /**
   * Delete all keys matching a pattern (for cache invalidation)
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      const client = redisConnection.getClient();
      if (!client || !redisConnection.isConnected()) {
        return;
      }

      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
      }
    } catch (error) {
      console.error(`[Cache] Error deleting pattern ${pattern}:`, error);
    }
  }

  /**
   * Invalidate all cache for a specific user
   */
  async invalidateUserCache(uid: string): Promise<void> {
    const patterns = [
      `dashboard:${uid}*`,
      `transactions:${uid}*`,
      `spending:${uid}*`,
      `goals:${uid}*`,
      `income:${uid}*`,
      `ai-insights:${uid}*`,
      `user:${uid}*`,
    ];

    await Promise.all(patterns.map(pattern => this.deletePattern(pattern)));
  }

  /**
   * Generate cache key for transactions
   */
  static getTransactionsKey(uid: string, limit?: number, startDate?: string, endDate?: string): string {
    const parts = ['transactions', uid];
    if (limit) parts.push(`limit:${limit}`);
    if (startDate) parts.push(`start:${startDate}`);
    if (endDate) parts.push(`end:${endDate}`);
    return parts.join(':');
  }

  /**
   * Generate cache key for spending summary
   */
  static getSpendingSummaryKey(uid: string, startDate?: string, endDate?: string): string {
    const parts = ['spending:summary', uid];
    if (startDate) parts.push(`start:${startDate}`);
    if (endDate) parts.push(`end:${endDate}`);
    return parts.join(':');
  }

  /**
   * Generate cache key for total spending
   */
  static getTotalSpendingKey(uid: string, startDate?: string, endDate?: string): string {
    const parts = ['spending:total', uid];
    if (startDate) parts.push(`start:${startDate}`);
    if (endDate) parts.push(`end:${endDate}`);
    return parts.join(':');
  }

  /**
   * Generate cache key for dashboard data
   */
  static getDashboardKey(uid: string): string {
    return `dashboard:${uid}`;
  }

  /**
   * Generate cache key for goals
   */
  static getGoalsKey(uid: string): string {
    return `goals:${uid}`;
  }

  /**
   * Generate cache key for income sources
   */
  static getIncomeKey(uid: string): string {
    return `income:${uid}`;
  }

  /**
   * Generate cache key for user data
   */
  static getUserDataKey(uid: string): string {
    return `user:${uid}`;
  }

  /**
   * Generate cache key for AI insights
   */
  static getAIInsightsKey(uid: string, analysisType: string, limit?: number): string {
    const parts = ['ai-insights', uid, analysisType];
    if (limit) parts.push(`limit:${limit}`);
    return parts.join(':');
  }

  /**
   * Generate cache key for latest AI insight
   */
  static getLatestAIInsightKey(uid: string, analysisType: string): string {
    return `ai-insights:${uid}:${analysisType}:latest`;
  }
}

export const cacheService = new CacheService();

