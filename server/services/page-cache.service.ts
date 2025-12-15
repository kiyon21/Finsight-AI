import { cacheService, CacheService } from './cache.service';
import { TransactionService } from './transaction.service';
import { UserService } from './user.service';
import { AIInsightService } from './ai-insight.service';
import { AuthService } from './auth.service';

export interface DashboardCacheData {
  transactions: any[];
  userData: any;
  goals: any[];
  incomeSources: any[];
  spendingSummary: Record<string, number>;
  totalSpending: number;
  totalEarnings: number;
  cachedAt: string;
}

export interface TransactionsCacheData {
  transactions: any[];
  cachedAt: string;
}

export interface AIInsightsCacheData {
  quickInsight: any | null;
  spendingAnalysis: any | null;
  savingsAdvice: any | null;
  analysisHistory: any[];
  cachedAt: string;
}

export class PageCacheService {
  private static readonly DEFAULT_TTL = 1800; // 30 minutes

  constructor(
    private transactionService: TransactionService,
    private userService: UserService,
    private aiInsightService: AIInsightService,
    private authService: AuthService
  ) {}

  /**
   * Get or fetch dashboard data (cache-first)
   */
  async getDashboardData(uid: string, bypassCache: boolean = false): Promise<DashboardCacheData> {
    const cacheKey = CacheService.getDashboardKey(uid);

    // Check cache first
    if (!bypassCache) {
      const cached = await cacheService.get<DashboardCacheData>(cacheKey);
      if (cached && this.isCacheValid(cached.cachedAt)) {
        return cached;
      }
    }

    // Fetch from Firebase
    const [transactions, userData, goals, incomeSources] = await Promise.all([
      this.transactionService.getTransactions(uid, 100, undefined, undefined, true),
      this.authService.getUserData(uid),
      this.userService.getGoals(uid),
      this.userService.getIncomeSources(uid),
    ]);

    // Calculate spending summary from all transactions (for top categories)
    // This shows spending across all time, not just current month
    const spendingSummary: Record<string, number> = {};
    transactions.forEach(transaction => {
      const isExpense = transaction.isExpense !== undefined 
        ? transaction.isExpense 
        : transaction.amount > 0;
      
      if (isExpense && transaction.amount > 0) {
        // Get category from personalFinanceCategory or fallback to category array
        const rawCategory = transaction.personalFinanceCategory?.primary 
          || transaction.category?.[0] 
          || 'OTHER';
        
        // Format category name for display (e.g., "FOOD_AND_DRINK" -> "Food and Drink")
        const category = rawCategory
          .toLowerCase()
          .split('_')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        spendingSummary[category] = (spendingSummary[category] || 0) + transaction.amount;
      }
    });

    // Calculate current month's spending from transactions directly
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const currentMonthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));
    const totalSpending = currentMonthTransactions.reduce((sum, t) => {
      const isExpense = t.isExpense !== undefined ? t.isExpense : t.amount > 0;
      return sum + (isExpense && t.amount > 0 ? t.amount : 0);
    }, 0);

    // Calculate monthly earnings
    const totalEarnings = currentMonthTransactions.reduce((sum, t) => {
      const isIncome = t.isExpense !== undefined ? !t.isExpense : t.amount <= 0;
      return sum + (isIncome && t.amount > 0 ? t.amount : 0);
    }, 0);

    // Get balance from most recent transaction that has a balance field
    // Transactions are already sorted by date descending (most recent first)
    const mostRecentTransactionWithBalance = transactions.find(t => t.balance !== undefined && t.balance !== null);
    const balance = mostRecentTransactionWithBalance?.balance ?? userData?.balance ?? 0;
    const balanceUpdatedDate = mostRecentTransactionWithBalance?.date ?? userData?.balanceUpdated;

    const dashboardData: DashboardCacheData = {
      transactions,
      userData: {
        ...userData,
        balance, // Override with transaction balance
        balanceUpdated: balanceUpdatedDate,
      },
      goals,
      incomeSources,
      spendingSummary,
      totalSpending,
      totalEarnings,
      cachedAt: new Date().toISOString(),
    };

    // Cache the result
    await cacheService.set(cacheKey, dashboardData, PageCacheService.DEFAULT_TTL);

    return dashboardData;
  }

  /**
   * Get or fetch transactions data (cache-first)
   */
  async getTransactionsData(
    uid: string,
    limit?: number,
    bypassCache: boolean = false
  ): Promise<TransactionsCacheData> {
    const cacheKey = `page:transactions:${uid}:${limit || 'all'}`;

    // Check cache first
    if (!bypassCache) {
      const cached = await cacheService.get<TransactionsCacheData>(cacheKey);
      if (cached && cached.transactions && cached.transactions.length > 0 && this.isCacheValid(cached.cachedAt)) {
        return cached;
      }
    }

    // Fetch from Firebase
    const transactions = await this.transactionService.getTransactions(uid, limit, undefined, undefined, true);
    const sortedTransactions = transactions.sort((a: any, b: any) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    const transactionsData: TransactionsCacheData = {
      transactions: sortedTransactions,
      cachedAt: new Date().toISOString(),
    };

    // Only cache non-empty results to avoid caching "no transactions" state
    // This ensures that after CSV uploads, we always check Firebase for new data
    if (sortedTransactions.length > 0) {
      await cacheService.set(cacheKey, transactionsData, PageCacheService.DEFAULT_TTL);
    }

    return transactionsData;
  }

  /**
   * Get or fetch AI insights data (cache-first)
   */
  async getAIInsightsData(uid: string, bypassCache: boolean = false): Promise<AIInsightsCacheData> {
    const cacheKey = `page:ai-insights:${uid}`;

    // Check cache first
    if (!bypassCache) {
      const cached = await cacheService.get<AIInsightsCacheData>(cacheKey);
      if (cached && this.isCacheValid(cached.cachedAt)) {
        return cached;
      }
    }

    // Fetch from Firebase
    const [quickInsight, spendingAnalysis, savingsAdvice] = await Promise.all([
      this.aiInsightService.getLatestInsight(uid, 'quick_insight'),
      this.aiInsightService.getLatestInsight(uid, 'spending_analysis'),
      this.aiInsightService.getLatestInsight(uid, 'savings_advice'),
    ]);

    // Get analysis history (get insights from all types)
    const quickInsights = await this.aiInsightService.getInsights(uid, 'quick_insight', 5).catch(() => []);
    const spendingInsights = await this.aiInsightService.getInsights(uid, 'spending_analysis', 5).catch(() => []);
    const savingsInsights = await this.aiInsightService.getInsights(uid, 'savings_advice', 5).catch(() => []);
    
    // Combine and sort by created_at, limit to 5 most recent
    const analysisHistory = [...quickInsights, ...spendingInsights, ...savingsInsights]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    const aiInsightsData: AIInsightsCacheData = {
      quickInsight,
      spendingAnalysis,
      savingsAdvice,
      analysisHistory: analysisHistory || [],
      cachedAt: new Date().toISOString(),
    };

    // Cache the result
    await cacheService.set(cacheKey, aiInsightsData, PageCacheService.DEFAULT_TTL);

    return aiInsightsData;
  }

  /**
   * Check if cache is still valid (within TTL)
   */
  private isCacheValid(cachedAt: string): boolean {
    const cacheAge = Date.now() - new Date(cachedAt).getTime();
    const maxAge = PageCacheService.DEFAULT_TTL * 1000; // Convert to milliseconds
    return cacheAge < maxAge;
  }

  /**
   * Invalidate page cache for a user
   */
  async invalidatePageCache(uid: string): Promise<void> {
    const patterns = [
      CacheService.getDashboardKey(uid),
      `page:transactions:${uid}*`,
      `page:ai-insights:${uid}`,
    ];

    await Promise.all(patterns.map(pattern => cacheService.deletePattern(pattern)));
  }
}

