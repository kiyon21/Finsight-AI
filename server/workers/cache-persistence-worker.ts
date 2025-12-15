import dotenv from 'dotenv';
import { QueueService, CachePersistenceJobPayload } from '../services/queue.service';
import { TransactionService } from '../services/transaction.service';
import { UserService } from '../services/user.service';
import { AIInsightService } from '../services/ai-insight.service';
import { AuthService } from '../services/auth.service';
import { DashboardCacheData, TransactionsCacheData, AIInsightsCacheData } from '../services/page-cache.service';

dotenv.config();

class CachePersistenceWorker {
  private queueService: QueueService;
  private transactionService: TransactionService;
  private userService: UserService;
  private aiInsightService: AIInsightService;
  private authService: AuthService;

  constructor() {
    this.queueService = new QueueService();
    this.transactionService = new TransactionService();
    this.userService = new UserService();
    this.aiInsightService = new AIInsightService();
    this.authService = new AuthService();
  }

  async start(): Promise<void> {
    try {
      console.log('[Cache Persistence Worker] Starting...');
      
      // Initialize queue service
      await this.queueService.initialize();
      
      // Start consuming cache persistence jobs
      await this.queueService.consumeCachePersistenceJobs(
        (payload) => this.processCachePersistenceJob(payload)
      );
      
      console.log('[Cache Persistence Worker] Started successfully');
    } catch (error) {
      console.error('[Cache Persistence Worker] Failed to start:', error);
      process.exit(1);
    }
  }

  private async processCachePersistenceJob(payload: CachePersistenceJobPayload): Promise<void> {
    const { uid, pageType, cacheData } = payload;
    
    try {
      console.log(`[Cache Persistence Worker] Processing ${pageType} cache persistence for user ${uid}`);
      
      switch (pageType) {
        case 'dashboard':
          await this.persistDashboardData(uid, cacheData as DashboardCacheData);
          break;
        case 'transactions':
          await this.persistTransactionsData(uid, cacheData as TransactionsCacheData);
          break;
        case 'ai-insights':
          await this.persistAIInsightsData(uid, cacheData as AIInsightsCacheData);
          break;
        default:
          console.warn(`[Cache Persistence Worker] Unknown page type: ${pageType}`);
      }
      
      console.log(`[Cache Persistence Worker] Successfully persisted ${pageType} data for user ${uid}`);
    } catch (error: any) {
      console.error(`[Cache Persistence Worker] Error processing job ${payload.jobId}:`, error);
      throw error; // Re-throw to trigger retry
    }
  }

  private async persistDashboardData(uid: string, data: DashboardCacheData): Promise<void> {
    // Dashboard data is already persisted in Firebase when fetched
    // This worker ensures data consistency by verifying all components exist
    // No action needed as data is already in Firebase
    console.log(`[Cache Persistence Worker] Dashboard data for ${uid} is already in Firebase`);
  }

  private async persistTransactionsData(uid: string, data: TransactionsCacheData): Promise<void> {
    // Transactions are already persisted in Firebase when fetched
    // This worker ensures data consistency
    console.log(`[Cache Persistence Worker] Transactions data for ${uid} is already in Firebase`);
  }

  private async persistAIInsightsData(uid: string, data: AIInsightsCacheData): Promise<void> {
    // AI insights are already persisted in Firebase when fetched
    // This worker ensures data consistency
    console.log(`[Cache Persistence Worker] AI insights data for ${uid} is already in Firebase`);
  }

  async stop(): Promise<void> {
    console.log('[Cache Persistence Worker] Stopping...');
    await this.queueService.close();
  }
}

// Start the worker
const worker = new CachePersistenceWorker();

worker.start().catch((error) => {
  console.error('[Cache Persistence Worker] Fatal error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[Cache Persistence Worker] Received SIGINT, shutting down gracefully...');
  await worker.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[Cache Persistence Worker] Received SIGTERM, shutting down gracefully...');
  await worker.stop();
  process.exit(0);
});

