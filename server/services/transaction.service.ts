import { adminDb } from '../config/firebase.config';
import { Timestamp } from 'firebase-admin/firestore';

export interface Transaction {
  id?: string;
  transactionId: string; // Plaid transaction ID
  accountId: string;
  amount: number;
  isExpense?: boolean; // True if this is an expense (debit), false for income (credit)
  date: string;
  name: string;
  merchantName?: string;
  category?: string[];
  pending: boolean;
  paymentChannel?: string;
  location?: {
    city?: string;
    region?: string;
    country?: string;
  };
  personalFinanceCategory?: {
    primary?: string;
    detailed?: string;
  };
  balance?: number; // Account balance at time of transaction (from CSV)
  createdAt?: string;
  updatedAt?: string;
}

export interface TransactionSyncResult {
  added: number;
  modified: number;
  removed: number;
}

export class TransactionService {
  // Add a single transaction to Plaid collection
  async addPlaidTransaction(uid: string, transaction: Transaction): Promise<string> {
    try {
      const transactionData = {
        ...transaction,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await adminDb
        .collection('users')
        .doc(uid)
        .collection('plaidTransactions')
        .add(transactionData);
      
      return docRef.id;
    } catch (error: any) {
      throw new Error(`Failed to add Plaid transaction: ${error.message}`);
    }
  }

  // Add a single transaction to uploaded collection
  async addUploadedTransaction(uid: string, transaction: Transaction): Promise<string> {
    try {
      const transactionData = {
        ...transaction,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await adminDb
        .collection('users')
        .doc(uid)
        .collection('uploadedTransactions')
        .add(transactionData);
      
      return docRef.id;
    } catch (error: any) {
      throw new Error(`Failed to add uploaded transaction: ${error.message}`);
    }
  }

  // Legacy method - adds to uploaded by default
  async addTransaction(uid: string, transaction: Transaction): Promise<string> {
    return this.addUploadedTransaction(uid, transaction);
  }

  // Add multiple Plaid transactions (bulk import)
  async addPlaidTransactionsBulk(uid: string, transactions: Transaction[]): Promise<TransactionSyncResult> {
    try {
      const batch = adminDb.batch();
      const transactionsRef = adminDb
        .collection('users')
        .doc(uid)
        .collection('plaidTransactions');

      let added = 0;

      for (const transaction of transactions) {
        // Check if transaction already exists by transactionId
        const existingQuery = await transactionsRef
          .where('transactionId', '==', transaction.transactionId)
          .limit(1)
          .get();

        if (existingQuery.empty) {
          // Transaction doesn't exist, add it
          const newDocRef = transactionsRef.doc();
          batch.set(newDocRef, {
            ...transaction,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          added++;
        }
      }

      await batch.commit();

      return {
        added,
        modified: 0,
        removed: 0,
      };
    } catch (error: any) {
      throw new Error(`Failed to add Plaid transactions in bulk: ${error.message}`);
    }
  }

  // Add multiple uploaded transactions (bulk import from CSV)
  // Organized by year-month subcollections for better performance
  async addUploadedTransactionsBulk(uid: string, transactions: any[]): Promise<TransactionSyncResult> {
    try {
      const batch = adminDb.batch();
      const baseRef = adminDb
        .collection('users')
        .doc(uid)
        .collection('uploadedTransactions');

      let added = 0;
      let modified = 0;

      for (const transaction of transactions) {
        // Extract year-month from transaction date (YYYY-MM)
        const yearMonth = transaction.date.substring(0, 7); // e.g., "2025-07"
        
        // Use deterministic document ID if provided
        const docId = transaction.docId || transaction.transactionId;
        
        // Store in year-month subcollection
        const docRef = baseRef
          .doc(yearMonth)
          .collection('transactions')
          .doc(docId);

        // Check if document already exists
        const existingDoc = await docRef.get();

        if (!existingDoc.exists) {
          // New transaction - use set() with deterministic ID
          const transactionData = { ...transaction };
          delete transactionData.docId; // Remove docId field before saving
          
          batch.set(docRef, {
            ...transactionData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          added++;
        } else {
          // Transaction exists - update timestamp only (idempotent)
          batch.update(docRef, {
            updatedAt: new Date().toISOString(),
          });
          modified++;
        }
      }

      await batch.commit();

      return {
        added,
        modified,
        removed: 0,
      };
    } catch (error: any) {
      throw new Error(`Failed to add uploaded transactions in bulk: ${error.message}`);
    }
  }

  // Legacy method - uses uploaded collection
  async addTransactionsBulk(uid: string, transactions: Transaction[]): Promise<TransactionSyncResult> {
    return this.addUploadedTransactionsBulk(uid, transactions);
  }

  // Get all transactions for a user (combines both Plaid and uploaded)
  async getTransactions(uid: string, limit?: number, startDate?: string, endDate?: string): Promise<Transaction[]> {
    try {
      const plaidTransactions = await this.getPlaidTransactions(uid, undefined, startDate, endDate);
      const uploadedTransactions = await this.getUploadedTransactions(uid, undefined, startDate, endDate);

      // Combine and sort by date
      const allTransactions = [...plaidTransactions, ...uploadedTransactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Apply limit if specified
      return limit ? allTransactions.slice(0, limit) : allTransactions;
    } catch (error: any) {
      throw new Error(`Failed to get transactions: ${error.message}`);
    }
  }

  // Get Plaid transactions only
  async getPlaidTransactions(uid: string, limit?: number, startDate?: string, endDate?: string): Promise<Transaction[]> {
    try {
      let query = adminDb
        .collection('users')
        .doc(uid)
        .collection('plaidTransactions')
        .orderBy('date', 'desc');

      if (startDate) {
        query = query.where('date', '>=', startDate) as any;
      }

      if (endDate) {
        query = query.where('date', '<=', endDate) as any;
      }

      if (limit) {
        query = query.limit(limit) as any;
      }

      const snapshot = await query.get();

      // Filter out metadata document
      return snapshot.docs
        .filter(doc => doc.id !== '_metadata')
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Transaction[];
    } catch (error: any) {
      throw new Error(`Failed to get Plaid transactions: ${error.message}`);
    }
  }

  // Get uploaded transactions only (from year-month subcollections)
  async getUploadedTransactions(uid: string, limit?: number, startDate?: string, endDate?: string): Promise<Transaction[]> {
    try {
      const baseRef = adminDb
        .collection('users')
        .doc(uid)
        .collection('uploadedTransactions');

      // Generate list of year-months to query
      const yearMonths = this.getYearMonthsInRange(startDate, endDate);
      
      let allTransactions: Transaction[] = [];

      // Query each year-month subcollection
      for (const yearMonth of yearMonths) {
        try {
          const snapshot = await baseRef
            .doc(yearMonth)
            .collection('transactions')
            .get();

          const transactions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Transaction[];

          allTransactions = allTransactions.concat(transactions);
        } catch (error) {
          // Subcollection might not exist yet, continue
          console.log(`[Transaction Service] Subcollection ${yearMonth} not found, skipping`);
        }
      }

      // Filter by date if specified
      if (startDate || endDate) {
        allTransactions = allTransactions.filter(t => {
          if (startDate && t.date < startDate) return false;
          if (endDate && t.date > endDate) return false;
          return true;
        });
      }

      // Sort by date descending
      allTransactions.sort((a, b) => b.date.localeCompare(a.date));

      // Apply limit if specified
      if (limit) {
        allTransactions = allTransactions.slice(0, limit);
      }

      return allTransactions;
    } catch (error: any) {
      throw new Error(`Failed to get uploaded transactions: ${error.message}`);
    }
  }

  // Helper to generate year-month strings in a date range
  private getYearMonthsInRange(startDate?: string, endDate?: string): string[] {
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear() - 2, 0, 1); // Default: 2 years ago
    const end = endDate ? new Date(endDate) : now;

    const yearMonths: string[] = [];
    const current = new Date(start.getFullYear(), start.getMonth(), 1);

    while (current <= end) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      yearMonths.push(`${year}-${month}`);
      current.setMonth(current.getMonth() + 1);
    }

    return yearMonths;
  }

  // Get transactions by category
  async getTransactionsByCategory(uid: string, category: string): Promise<Transaction[]> {
    try {
      const snapshot = await adminDb
        .collection('users')
        .doc(uid)
        .collection('transactions')
        .where('personalFinanceCategory.primary', '==', category)
        .orderBy('date', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Transaction[];
    } catch (error: any) {
      throw new Error(`Failed to get transactions by category: ${error.message}`);
    }
  }

  // Get spending summary by category
  async getSpendingSummary(uid: string, startDate?: string, endDate?: string): Promise<Record<string, number>> {
    try {
      const transactions = await this.getTransactions(uid, undefined, startDate, endDate);
      
      const summary: Record<string, number> = {};

      transactions.forEach(transaction => {
        // For CSV uploads, check isExpense flag; for Plaid, check if amount is positive
        const isExpense = transaction.isExpense !== undefined 
          ? transaction.isExpense 
          : transaction.amount > 0;
        
        if (isExpense && transaction.amount > 0) { // Only count expenses with positive amounts
          const rawCategory = transaction.personalFinanceCategory?.primary || 'OTHER';
          // Format category name for display (e.g., "FOOD_AND_DRINK" -> "Food and Drink")
          const category = this.formatCategoryName(rawCategory);
          summary[category] = (summary[category] || 0) + transaction.amount;
        }
      });

      return summary;
    } catch (error: any) {
      throw new Error(`Failed to get spending summary: ${error.message}`);
    }
  }

  // Helper to format category names for display
  private formatCategoryName(category: string): string {
    return category
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Get total spending for a period
  async getTotalSpending(uid: string, startDate?: string, endDate?: string): Promise<number> {
    try {
      const transactions = await this.getTransactions(uid, undefined, startDate, endDate);
      
      return transactions.reduce((total, transaction) => {
        // For CSV uploads, check isExpense flag; for Plaid, check if amount is positive
        const isExpense = transaction.isExpense !== undefined 
          ? transaction.isExpense 
          : transaction.amount > 0;
        
        return total + (isExpense && transaction.amount > 0 ? transaction.amount : 0);
      }, 0);
    } catch (error: any) {
      throw new Error(`Failed to get total spending: ${error.message}`);
    }
  }

  // Delete a transaction
  async deleteTransaction(uid: string, transactionId: string): Promise<void> {
    try {
      await adminDb
        .collection('users')
        .doc(uid)
        .collection('transactions')
        .doc(transactionId)
        .delete();
    } catch (error: any) {
      throw new Error(`Failed to delete transaction: ${error.message}`);
    }
  }

  // Delete all transactions for a user
  async deleteAllTransactions(uid: string): Promise<void> {
    try {
      const snapshot = await adminDb
        .collection('users')
        .doc(uid)
        .collection('transactions')
        .get();

      const batch = adminDb.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error: any) {
      throw new Error(`Failed to delete all transactions: ${error.message}`);
    }
  }

  // Update transaction (for manual edits)
  async updateTransaction(uid: string, transactionId: string, updates: Partial<Transaction>): Promise<void> {
    try {
      await adminDb
        .collection('users')
        .doc(uid)
        .collection('transactions')
        .doc(transactionId)
        .update({
          ...updates,
          updatedAt: new Date().toISOString(),
        });
    } catch (error: any) {
      throw new Error(`Failed to update transaction: ${error.message}`);
    }
  }
}

