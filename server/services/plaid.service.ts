import { plaidClient } from '../config/plaid.config';
import {
  AuthGetRequest,
  AccountsGetRequest,
  SandboxItemFireWebhookRequest,
  SandboxItemFireWebhookRequestWebhookCodeEnum,
  LinkTokenCreateRequest,
  CountryCode,
  Products,
  TransactionsEnrichRequest,
  ClientProvidedTransaction,
  EnrichTransactionDirection,
  DepositoryAccountSubtype,
  CreditAccountSubtype,
  TransactionsGetRequest,
  TransactionsSyncRequest,
} from 'plaid';

export class PlaidService {
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  async getAuth(accessToken: string) {
    const plaidRequest: AuthGetRequest = {
      access_token: accessToken,
    };
    const response = await plaidClient.authGet(plaidRequest);
    return response.data;
  }

  async getAccounts(accessToken: string) {
    const request: AccountsGetRequest = {
      access_token: accessToken,
    };
    const response = await plaidClient.accountsGet(request);
    return response.data.accounts;
  }

  async fireWebhook(accessToken: string) {
    const request: SandboxItemFireWebhookRequest = {
      access_token: accessToken,
      webhook_code: SandboxItemFireWebhookRequestWebhookCodeEnum.NewAccountsAvailable,
    };
    const response = await plaidClient.sandboxItemFireWebhook(request);
    return response.data;
  }

  async createLinkToken() {
    const request: LinkTokenCreateRequest = {
      user: {
        client_user_id: 'user-id',
        phone_number: '+1 415 5550123',
      },
      client_name: 'Finsight-Ai',
      products: [Products.Transactions],
      transactions: {
        days_requested: 730,
      },
      country_codes: [CountryCode.Ca],
      language: 'en',
      webhook: `${this.webhookUrl}/webhook`,
      account_filters: {
        depository: {
          account_subtypes: [DepositoryAccountSubtype.Checking, DepositoryAccountSubtype.Savings],
        },
        credit: {
          account_subtypes: [CreditAccountSubtype.CreditCard],
        },
      },
    };
    const response = await plaidClient.linkTokenCreate(request);
    return response.data.link_token;
  }

  async createSimpleLinkToken() {
    const request: LinkTokenCreateRequest = {
      user: {
        client_user_id: 'user',
      },
      client_name: 'Plaid Test App',
      products: [Products.Auth],
      language: 'en',
      redirect_uri: 'http://localhost:5173/onboarding',
      country_codes: [CountryCode.Us, CountryCode.Ca],
    };
    const response = await plaidClient.linkTokenCreate(request);
    return response.data;
  }

  async exchangePublicToken(publicToken: string) {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });
    return {
      accessToken: response.data.access_token,
      itemID: response.data.item_id,
    };
  }

  async enrichTransactions() {
    const transactionsToEnrich: Array<ClientProvidedTransaction> = [
      {
        id: '1',
        description: 'PURCHASE WM SUPERCENTER #1700',
        amount: 72.1,
        iso_currency_code: 'USD',
        location: {
          city: 'Poway',
          region: 'CA',
        },
        direction: EnrichTransactionDirection.Outflow,
      },
      {
        id: '2',
        description: 'DD DOORDASH BURGERKIN 855-123-4567 CA',
        amount: 28.34,
        iso_currency_code: 'USD',
        direction: EnrichTransactionDirection.Outflow,
      },
    ];

    const request: TransactionsEnrichRequest = {
      account_type: 'depository',
      transactions: transactionsToEnrich,
    };

    const response = await plaidClient.transactionsEnrich(request);
    return response.data.enriched_transactions;
  }

  // Get transactions for a date range
  async getTransactions(accessToken: string, startDate: string, endDate: string) {
    const request: TransactionsGetRequest = {
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
    };

    const response = await plaidClient.transactionsGet(request);
    return response.data;
  }

  // Sync transactions (for incremental updates)
  async syncTransactions(accessToken: string, cursor?: string) {
    const request: TransactionsSyncRequest = {
      access_token: accessToken,
      cursor: cursor,
    };

    const response = await plaidClient.transactionsSync(request);
    return {
      added: response.data.added,
      modified: response.data.modified,
      removed: response.data.removed,
      nextCursor: response.data.next_cursor,
      hasMore: response.data.has_more,
    };
  }
}

