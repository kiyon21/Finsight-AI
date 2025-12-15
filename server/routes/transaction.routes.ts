import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import multer from 'multer';

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

export function createTransactionRoutes(transactionController: TransactionController): Router {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(authenticateToken);

  // Transaction CRUD
  router.post('/:uid/transactions', (req, res) => transactionController.addTransaction(req, res));
  router.get('/:uid/transactions', (req, res) => transactionController.getTransactions(req, res));
  router.get('/:uid/transactions/category/:category', (req, res) => transactionController.getTransactionsByCategory(req, res));
  router.delete('/:uid/transactions/:transactionId', (req, res) => transactionController.deleteTransaction(req, res));
  router.delete('/:uid/transactions', (req, res) => transactionController.deleteAllTransactions(req, res));
  router.put('/:uid/transactions/:transactionId', (req, res) => transactionController.updateTransaction(req, res));

  // Analytics
  router.get('/:uid/spending/summary', (req, res) => transactionController.getSpendingSummary(req, res));
  router.get('/:uid/spending/total', (req, res) => transactionController.getTotalSpending(req, res));

  // Plaid sync
  router.post('/:uid/transactions/sync-plaid', (req, res) => transactionController.syncPlaidTransactions(req, res));

  // CSV upload
  router.post('/:uid/transactions/upload-csv', upload.single('file'), (req, res) => transactionController.uploadCSV(req, res));

  // Job Management
  router.get('/jobs/:jobId', (req, res) => transactionController.getJobStatus(req, res));
  router.get('/:uid/jobs', (req, res) => transactionController.getUserJobs(req, res));

  return router;
}

