import { Request, Response } from 'express';
import { TransactionService } from '../services/transaction.service';
import { PlaidService } from '../services/plaid.service';
import { CSVParserService } from '../services/csv-parser.service';
import { AuthService } from '../services/auth.service';
import { QueueService } from '../services/queue.service';
import { JobService } from '../services/job.service';
import { randomUUID } from 'crypto';

export class TransactionController {
  private csvParser: CSVParserService;
  private authService: AuthService;
  private queueService: QueueService;
  private jobService: JobService;

  constructor(
    private transactionService: TransactionService,
    private plaidService: PlaidService
  ) {
    this.csvParser = new CSVParserService();
    this.authService = new AuthService();
    this.queueService = new QueueService();
    this.jobService = new JobService();
    
    // Initialize queue service
    this.queueService.initialize().catch(err => {
      console.error('[Transaction Controller] Failed to initialize queue:', err);
    });
  }

  async addTransaction(req: Request, res: Response) {
    try {
      const { uid } = req.params;
      const transaction = req.body;

      if (!uid) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const transactionId = await this.transactionService.addTransaction(uid, transaction);
      res.status(201).json({ 
        message: 'Transaction added successfully',
        transactionId 
      });
    } catch (error: any) {
      console.error('Add transaction error:', error);
      res.status(500).json({ error: error.message || 'Failed to add transaction' });
    }
  }

  async getTransactions(req: Request, res: Response) {
    try {
      const { uid } = req.params;
      const { limit, startDate, endDate } = req.query;

      if (!uid) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const transactions = await this.transactionService.getTransactions(
        uid,
        limit ? parseInt(limit as string) : undefined,
        startDate as string,
        endDate as string
      );
      res.json(transactions);
    } catch (error: any) {
      console.error('Get transactions error:', error);
      res.status(500).json({ error: error.message || 'Failed to get transactions' });
    }
  }

  async getTransactionsByCategory(req: Request, res: Response) {
    try {
      const { uid, category } = req.params;

      if (!uid || !category) {
        return res.status(400).json({ error: 'User ID and category are required' });
      }

      const transactions = await this.transactionService.getTransactionsByCategory(uid, category);
      res.json(transactions);
    } catch (error: any) {
      console.error('Get transactions by category error:', error);
      res.status(500).json({ error: error.message || 'Failed to get transactions by category' });
    }
  }

  async getSpendingSummary(req: Request, res: Response) {
    try {
      const { uid } = req.params;
      const { startDate, endDate } = req.query;

      if (!uid) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const summary = await this.transactionService.getSpendingSummary(
        uid,
        startDate as string,
        endDate as string
      );
      res.json(summary);
    } catch (error: any) {
      console.error('Get spending summary error:', error);
      res.status(500).json({ error: error.message || 'Failed to get spending summary' });
    }
  }

  async getTotalSpending(req: Request, res: Response) {
    try {
      const { uid } = req.params;
      const { startDate, endDate } = req.query;

      if (!uid) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const total = await this.transactionService.getTotalSpending(
        uid,
        startDate as string,
        endDate as string
      );
      res.json({ total });
    } catch (error: any) {
      console.error('Get total spending error:', error);
      res.status(500).json({ error: error.message || 'Failed to get total spending' });
    }
  }

  async syncPlaidTransactions(req: Request, res: Response) {
    try {
      const { uid } = req.params;
      const { accessToken, startDate, endDate } = req.body;

      if (!uid || !accessToken) {
        return res.status(400).json({ error: 'User ID and access token are required' });
      }

      // Fetch transactions from Plaid
      const plaidData = await this.plaidService.getTransactions(
        accessToken,
        startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default: last 30 days
        endDate || new Date().toISOString().split('T')[0] // Default: today
      );

      // Convert Plaid transactions to our format and save
      const transactions = plaidData.transactions.map(t => ({
        transactionId: t.transaction_id,
        accountId: t.account_id,
        amount: t.amount,
        date: t.date,
        name: t.name,
        merchantName: t.merchant_name || undefined,
        category: t.category || undefined,
        pending: t.pending,
        paymentChannel: t.payment_channel,
        location: t.location ? {
          city: t.location.city || undefined,
          region: t.location.region || undefined,
          country: t.location.country || undefined,
        } : undefined,
        personalFinanceCategory: t.personal_finance_category ? {
          primary: t.personal_finance_category.primary,
          detailed: t.personal_finance_category.detailed,
        } : undefined,
      }));

      const result = await this.transactionService.addPlaidTransactionsBulk(uid, transactions);
      
      res.json({ 
        message: 'Transactions synced successfully',
        ...result,
        totalTransactions: plaidData.total_transactions
      });
    } catch (error: any) {
      console.error('Sync Plaid transactions error:', error);
      res.status(500).json({ error: error.message || 'Failed to sync transactions' });
    }
  }

  async uploadCSV(req: Request, res: Response) {
    try {
      const { uid } = req.params;
      const file = req.file;

      if (!uid) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Generate unique job ID
      const jobId = randomUUID();

      // Read CSV content
      const csvContent = file.buffer.toString('utf-8');

      // Create job record in Firestore
      await this.jobService.createJob(jobId, uid, file.originalname);

      // Publish job to queue for async processing
      await this.queueService.publishCSVJob({
        jobId,
        uid,
        csvContent,
        fileName: file.originalname,
        timestamp: new Date().toISOString(),
      });

      // Return immediately with job ID
      res.status(202).json({
        message: 'CSV upload accepted and queued for processing',
        jobId,
        status: 'pending',
      });
    } catch (error: any) {
      console.error('Upload CSV error:', error);
      res.status(500).json({ error: error.message || 'Failed to upload CSV' });
    }
  }

  async getJobStatus(req: Request, res: Response) {
    try {
      const { jobId } = req.params;

      if (!jobId) {
        return res.status(400).json({ error: 'Job ID is required' });
      }

      const jobStatus = await this.jobService.getJobStatus(jobId);

      if (!jobStatus) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json(jobStatus);
    } catch (error: any) {
      console.error('Get job status error:', error);
      res.status(500).json({ error: error.message || 'Failed to get job status' });
    }
  }

  async getUserJobs(req: Request, res: Response) {
    try {
      const { uid } = req.params;
      const { limit } = req.query;

      if (!uid) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const jobs = await this.jobService.getUserJobs(
        uid,
        limit ? parseInt(limit as string) : 10
      );

      res.json(jobs);
    } catch (error: any) {
      console.error('Get user jobs error:', error);
      res.status(500).json({ error: error.message || 'Failed to get user jobs' });
    }
  }

  async deleteTransaction(req: Request, res: Response) {
    try {
      const { uid, transactionId } = req.params;

      if (!uid || !transactionId) {
        return res.status(400).json({ error: 'User ID and Transaction ID are required' });
      }

      await this.transactionService.deleteTransaction(uid, transactionId);
      res.json({ message: 'Transaction deleted successfully' });
    } catch (error: any) {
      console.error('Delete transaction error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete transaction' });
    }
  }

  async deleteAllTransactions(req: Request, res: Response) {
    try {
      const { uid } = req.params;

      if (!uid) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      await this.transactionService.deleteAllTransactions(uid);
      res.json({ message: 'All transactions deleted successfully' });
    } catch (error: any) {
      console.error('Delete all transactions error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete all transactions' });
    }
  }

  async updateTransaction(req: Request, res: Response) {
    try {
      const { uid, transactionId } = req.params;
      const updates = req.body;

      if (!uid || !transactionId) {
        return res.status(400).json({ error: 'User ID and Transaction ID are required' });
      }

      await this.transactionService.updateTransaction(uid, transactionId, updates);
      res.json({ message: 'Transaction updated successfully' });
    } catch (error: any) {
      console.error('Update transaction error:', error);
      res.status(500).json({ error: error.message || 'Failed to update transaction' });
    }
  }
}

