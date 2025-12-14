import dotenv from 'dotenv';
import { QueueService, CSVJobPayload } from '../services/queue.service';
import { JobService } from '../services/job.service';
import { CSVParserService } from '../services/csv-parser.service';
import { TransactionService } from '../services/transaction.service';
import { AuthService } from '../services/auth.service';

dotenv.config();

class CSVWorker {
  private queueService: QueueService;
  private jobService: JobService;
  private csvParser: CSVParserService;
  private transactionService: TransactionService;
  private authService: AuthService;

  constructor() {
    this.queueService = new QueueService();
    this.jobService = new JobService();
    this.csvParser = new CSVParserService();
    this.transactionService = new TransactionService();
    this.authService = new AuthService();
  }

  async start(): Promise<void> {
    try {
      console.log('[CSV Worker] Starting...');
      
      // Initialize queue service
      await this.queueService.initialize();
      
      // Start consuming jobs
      await this.queueService.consumeCSVJobs(this.processCSVJob.bind(this));
      
      console.log('[CSV Worker] Ready to process jobs');
    } catch (error) {
      console.error('[CSV Worker] Failed to start:', error);
      process.exit(1);
    }
  }

  private async processCSVJob(payload: CSVJobPayload): Promise<void> {
    const { jobId, uid, csvContent, fileName } = payload;

    try {
      console.log(`[CSV Worker] Processing job ${jobId} for user ${uid}`);
      
      // Update job status to processing
      await this.jobService.updateJobStatus(jobId, {
        status: 'processing',
        progress: 10,
      } as any);

      // Parse CSV
      const csvTransactions = this.csvParser.parseTDBank(csvContent);
      
      if (csvTransactions.length === 0) {
        throw new Error('No valid transactions found in CSV');
      }

      await this.jobService.updateJobStatus(jobId, {
        status: 'processing',
        progress: 30,
        totalTransactions: csvTransactions.length,
      } as any);

      // CSV is ordered with last row being most recent
      const mostRecentTransaction = csvTransactions[csvTransactions.length - 1];

      // Extract and update balance if this CSV has more recent data
      if (mostRecentTransaction.balance !== undefined) {
        // Get user's current balance date
        const userData = await this.authService.getUserData(uid);
        const currentBalanceDate = userData?.balanceUpdated ? new Date(userData.balanceUpdated) : null;
        const newBalanceDate = new Date(mostRecentTransaction.date);

        // Only update if the CSV has a more recent transaction or no balance exists yet
        if (!currentBalanceDate || newBalanceDate >= currentBalanceDate) {
          await this.authService.updateUserBalance(uid, mostRecentTransaction.balance, mostRecentTransaction.date);
          console.log(`[CSV Worker] Updated balance to $${mostRecentTransaction.balance} as of ${mostRecentTransaction.date}`);
        } else {
          console.log(`[CSV Worker] Skipping balance update - existing balance (${userData?.balanceUpdated}) is more recent than CSV (${mostRecentTransaction.date})`);
        }
      }

      await this.jobService.updateJobStatus(jobId, {
        status: 'processing',
        progress: 50,
      } as any);

      // Convert to transaction format
      const transactions = this.csvParser.convertToTransactions(csvTransactions, uid);

      await this.jobService.updateJobStatus(jobId, {
        status: 'processing',
        progress: 70,
      } as any);

      // Save to database
      const result = await this.transactionService.addUploadedTransactionsBulk(uid, transactions);

      await this.jobService.updateJobStatus(jobId, {
        status: 'processing',
        progress: 90,
      } as any);

      // Mark job as completed
      await this.jobService.updateJobStatus(jobId, {
        status: 'completed',
        progress: 100,
        totalTransactions: transactions.length,
        addedTransactions: result.added,
        modifiedTransactions: result.modified,
        balance: mostRecentTransaction.balance,
        balanceUpdated: mostRecentTransaction.date,
      } as any);

      console.log(`[CSV Worker] Job ${jobId} completed successfully (${result.added} new, ${result.modified} updated)`);
    } catch (error: any) {
      console.error(`[CSV Worker] Job ${jobId} failed:`, error);
      
      // Mark job as failed
      await this.jobService.updateJobStatus(jobId, {
        status: 'failed',
        error: error.message,
      } as any);
    }
  }

  async stop(): Promise<void> {
    console.log('[CSV Worker] Stopping...');
    await this.queueService.close();
  }
}

// Start the worker
const worker = new CSVWorker();

worker.start().catch((error) => {
  console.error('[CSV Worker] Fatal error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[CSV Worker] Received SIGINT, shutting down gracefully...');
  await worker.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[CSV Worker] Received SIGTERM, shutting down gracefully...');
  await worker.stop();
  process.exit(0);
});

