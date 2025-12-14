import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API
export const authAPI = {
  register: async (email: string, password: string) => {
    const response = await api.post('/auth/register', { email, password });
    return response.data; // Returns { uid, email, customToken }
  },

  initializeProfile: async (uid: string, email: string) => {
    const response = await api.post('/auth/initialize-profile', { uid, email });
    return response.data;
  },

  getUserData: async (uid: string) => {
    const response = await api.get(`/auth/user/${uid}`);
    return response.data;
  },

  updateUser: async (uid: string, data: any) => {
    const response = await api.put(`/auth/user/${uid}`, data);
    return response.data;
  },

  updatePlaidToken: async (uid: string, accessToken: string) => {
    const response = await api.post('/auth/user/plaid-token', { uid, accessToken });
    return response.data;
  },

  completeOnboarding: async (uid: string) => {
    const response = await api.post('/auth/user/complete-onboarding', { uid });
    return response.data;
  },
};

// Goals API
export const goalsAPI = {
  addGoal: async (uid: string, goal: any) => {
    const response = await api.post(`/users/${uid}/goals`, goal);
    return response.data;
  },

  getGoals: async (uid: string) => {
    const response = await api.get(`/users/${uid}/goals`);
    return response.data;
  },

  deleteGoal: async (uid: string, goalId: string) => {
    const response = await api.delete(`/users/${uid}/goals/${goalId}`);
    return response.data;
  },

  updateGoal: async (uid: string, goalId: string, goal: any) => {
    const response = await api.put(`/users/${uid}/goals/${goalId}`, goal);
    return response.data;
  },
};

// Income API
export const incomeAPI = {
  addIncomeSource: async (uid: string, income: any) => {
    const response = await api.post(`/users/${uid}/income`, income);
    return response.data;
  },

  getIncomeSources: async (uid: string) => {
    const response = await api.get(`/users/${uid}/income`);
    return response.data;
  },

  deleteIncomeSource: async (uid: string, incomeId: string) => {
    const response = await api.delete(`/users/${uid}/income/${incomeId}`);
    return response.data;
  },

  updateIncomeSource: async (uid: string, incomeId: string, income: any) => {
    const response = await api.put(`/users/${uid}/income/${incomeId}`, income);
    return response.data;
  },
};

// Plaid API
export const plaidAPI = {
  createLinkToken: async () => {
    const response = await api.post('/plaid/link/token/create');
    return response.data;
  },

  exchangePublicToken: async (publicToken: string) => {
    const response = await api.post('/plaid/exchange_public_token', { public_token: publicToken });
    return response.data;
  },

  getAccounts: async (accessToken: string) => {
    const response = await api.post('/plaid/accounts/get', { access_token: accessToken });
    return response.data;
  },

  getAuth: async (accessToken: string) => {
    const response = await api.post('/plaid/auth', { access_token: accessToken });
    return response.data;
  },
};

// Transactions API
export const transactionsAPI = {
  addTransaction: async (uid: string, transaction: any) => {
    const response = await api.post(`/transactions/${uid}/transactions`, transaction);
    return response.data;
  },

  getTransactions: async (uid: string, limit?: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/transactions/${uid}/transactions?${params.toString()}`);
    return response.data;
  },

  getTransactionsByCategory: async (uid: string, category: string) => {
    const response = await api.get(`/transactions/${uid}/transactions/category/${category}`);
    return response.data;
  },

  getSpendingSummary: async (uid: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/transactions/${uid}/spending/summary?${params.toString()}`);
    return response.data;
  },

  getTotalSpending: async (uid: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/transactions/${uid}/spending/total?${params.toString()}`);
    return response.data;
  },

  syncPlaidTransactions: async (uid: string, accessToken: string, startDate?: string, endDate?: string) => {
    const response = await api.post(`/transactions/${uid}/transactions/sync-plaid`, {
      accessToken,
      startDate,
      endDate,
    });
    return response.data;
  },

  uploadCSV: async (uid: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/transactions/${uid}/transactions/upload-csv`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteTransaction: async (uid: string, transactionId: string) => {
    const response = await api.delete(`/transactions/${uid}/transactions/${transactionId}`);
    return response.data;
  },

  deleteAllTransactions: async (uid: string) => {
    const response = await api.delete(`/transactions/${uid}/transactions`);
    return response.data;
  },

  updateTransaction: async (uid: string, transactionId: string, updates: any) => {
    const response = await api.put(`/transactions/${uid}/transactions/${transactionId}`, updates);
    return response.data;
  },

  getJobStatus: async (jobId: string) => {
    const response = await api.get(`/transactions/jobs/${jobId}`);
    return response.data;
  },

  getUserJobs: async (uid: string, limit?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    
    const response = await api.get(`/transactions/${uid}/jobs?${params.toString()}`);
    return response.data;
  },
};

