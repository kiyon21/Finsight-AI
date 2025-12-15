import { Transaction } from './transaction.service';
import { TransactionCategorizationService } from './transaction-categorization.service';

export interface CSVTransaction {
  date: string;
  description: string;
  debit?: number;
  credit?: number;
  balance?: number;
  amount: number; // Calculated: negative for debit, positive for credit
  type: 'debit' | 'credit';
}

export class CSVParserService {
  private categorizationService: TransactionCategorizationService;

  constructor() {
    this.categorizationService = new TransactionCategorizationService();
  }

  // Parse TD Bank format CSV
  parseTDBank(csvContent: string): CSVTransaction[] {
    const lines = csvContent.trim().split('\n');
    const transactions: CSVTransaction[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      const parts = line.split(',');
      if (parts.length < 4) continue;

      const date = parts[0]?.trim();
      const description = parts[1]?.trim();
      const debitStr = parts[2]?.trim();
      const creditStr = parts[3]?.trim();
      const balanceStr = parts[4]?.trim();

      if (!date || !description) continue;

      const debit = debitStr ? parseFloat(debitStr) : undefined;
      const credit = creditStr ? parseFloat(creditStr) : undefined;
      const balance = balanceStr ? parseFloat(balanceStr) : undefined;

      // Calculate amount (negative for debit, positive for credit)
      const amount = debit ? -debit : (credit || 0);
      const type: 'debit' | 'credit' = debit ? 'debit' : 'credit';

      transactions.push({
        date: this.parseDate(date),
        description,
        debit,
        credit,
        balance,
        amount,
        type,
      });
    }

    return transactions;
  }

  // Generic CSV parser - tries to detect format
  parseGenericCSV(csvContent: string, hasHeader: boolean = true): CSVTransaction[] {
    const lines = csvContent.trim().split('\n');
    const startIndex = hasHeader ? 1 : 0;
    const transactions: CSVTransaction[] = [];

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const parts = line.split(',');
      if (parts.length < 3) continue;

      // Try to parse as: Date, Description, Amount format
      const date = parts[0]?.trim();
      const description = parts[1]?.trim();
      const amountStr = parts[2]?.trim();

      if (!date || !description || !amountStr) continue;

      const amount = parseFloat(amountStr);
      if (isNaN(amount)) continue;

      const type: 'debit' | 'credit' = amount < 0 ? 'debit' : 'credit';

      transactions.push({
        date: this.parseDate(date),
        description,
        amount,
        type,
      });
    }

    return transactions;
  }

  // Convert CSV transactions to our Transaction format
  convertToTransactions(csvTransactions: CSVTransaction[], uid: string): Array<Omit<Transaction, 'id'> & { docId: string }> {
    return csvTransactions.map((csvTx) => {
      // Generate deterministic ID from transaction data
      const docId = this.generateDeterministicId(uid, csvTx);
      
      return {
        docId, // Deterministic document ID for idempotent inserts
        transactionId: docId, // Also use as transaction ID
        accountId: 'uploaded_csv',
        amount: csvTx.type === 'debit' ? Math.abs(csvTx.amount) : Math.abs(csvTx.amount),
        isExpense: csvTx.type === 'debit',
        date: csvTx.date,
        name: csvTx.description,
        merchantName: this.extractMerchantName(csvTx.description),
        category: this.categorizationService.categorizeTransaction(csvTx.description),
        pending: false,
        paymentChannel: csvTx.type === 'debit' ? 'other' : 'other',
        personalFinanceCategory: this.categorizationService.detectCategory(csvTx.description),
        balance: csvTx.balance,
      };
    });
  }

  // Generate deterministic document ID from transaction data
  private generateDeterministicId(uid: string, transaction: CSVTransaction): string {
    // Combine key fields that uniquely identify a transaction
    const uniqueString = [
      uid,
      transaction.date,
      transaction.description.trim().toLowerCase(),
      Math.abs(transaction.amount).toFixed(2),
      transaction.type,
    ].join('|');

    // Create a simple hash (can use crypto for better hashing)
    return this.simpleHash(uniqueString);
  }

  // Simple hash function (for production, consider using crypto.createHash)
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Convert to positive hex string
    return 'txn_' + Math.abs(hash).toString(36);
  }

  // Parse date from various formats
  private parseDate(dateStr: string): string {
    // Handle MM/DD/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [month, day, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Handle YYYY-MM-DD format (already correct)
    if (dateStr.includes('-')) {
      return dateStr;
    }

    // Default: return as-is
    return dateStr;
  }

  // Extract merchant name from description
  private extractMerchantName(description: string): string {
    // Remove common suffixes and clean up
    return description
      .replace(/\s+_V$/, '')
      .replace(/\s+MSP$/, '')
      .replace(/\s+PRO$/, '')
      .replace(/\s+GST$/, '')
      .replace(/\s+EPAY$/, '')
      .trim();
  }
}

