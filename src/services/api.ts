import axios from 'axios';
import { auth } from '../firebase/firebase';

// Main API (Express server) - port 8000
const API_BASE_URL = 'http://localhost:8000/api';
// AI Server (Django) - port 8001
const AI_API_BASE_URL = 'http://localhost:8001/api/ai';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// AI Server API client (Django server on port 8001)
export const aiApi = axios.create({
  baseURL: AI_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Firebase ID token to requests
const addAuthToken = async (config: any) => {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
  }
  return config;
};

// Add interceptor to both API clients
api.interceptors.request.use(addAuthToken);
aiApi.interceptors.request.use(addAuthToken);

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

  getTransactions: async (uid: string, limit?: number, startDate?: string, endDate?: string, noCache?: boolean) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (noCache) params.append('noCache', 'true');
    
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

// AI API (Django server)
export const aiAPI = {
  getQuickInsight: async (userId: string) => {
    // Fetch data from main API first
    const [goals, income, transactions] = await Promise.all([
      goalsAPI.getGoals(userId),
      incomeAPI.getIncomeSources(userId),
      transactionsAPI.getTransactions(userId, 100)
    ]);
    
    // Pass data to AI server
    const response = await aiApi.post('/quick-insight/', {
      user_id: userId,
      goals,
      income,
      transactions
    });
    
    // Save to Firebase
    try {
      await api.post(`/users/${userId}/insights`, {
        user_id: userId,
        analysis_type: 'quick_insight',
        summary: response.data.summary,
        ai_insights: response.data.ai_insights,
        recommendations: response.data.recommendations,
        spending_by_category: response.data.spending_by_category,
      });
    } catch (error) {
      console.error('Error saving quick insight to Firebase:', error);
      // Don't fail the request if saving fails
    }
    
    return response.data;
  },

  getFinancialInsights: async (userId: string, analysisType: string, additionalContext?: any) => {
    // Fetch data from main API first
    const [goals, income, transactions] = await Promise.all([
      goalsAPI.getGoals(userId),
      incomeAPI.getIncomeSources(userId),
      transactionsAPI.getTransactions(userId, 100)
    ]);
    
    // Pass data to AI server
    const response = await aiApi.post('/insights/', {
      user_id: userId,
      analysis_type: analysisType,
      goals,
      income,
      transactions,
      additional_context: additionalContext || {},
    });
    
    // Save to Firebase
    try {
      await api.post(`/users/${userId}/insights`, {
        user_id: userId,
        analysis_type: analysisType,
        insights: response.data.insights,
        recommendations: response.data.recommendations,
        model_used: response.data.model_used,
        analysis_id: response.data.analysis_id,
      });
    } catch (error) {
      console.error(`Error saving ${analysisType} to Firebase:`, error);
      // Don't fail the request if saving fails
    }
    
    return response.data;
  },

  getAnalysisHistory: async (userId: string, limit?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    
    const response = await aiApi.get(`/history/${userId}/?${params.toString()}`);
    return response.data;
  },

  getAnalysisDetail: async (analysisId: string) => {
    const response = await aiApi.get(`/analysis/${analysisId}`);
    return response.data;
  },

  // Save insight to Firebase
  saveInsight: async (userId: string, insight: any) => {
    const response = await api.post(`/users/${userId}/insights`, insight);
    return response.data;
  },

  // Get insights from Firebase by type
  getInsights: async (userId: string, analysisType: string, limit?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    
    const response = await api.get(`/users/${userId}/insights/${analysisType}?${params.toString()}`);
    return response.data;
  },

  // Get latest insight from Firebase by type
  getLatestInsight: async (userId: string, analysisType: string) => {
    const response = await api.get(`/users/${userId}/insights/${analysisType}/latest`);
    return response.data;
  },
};

// Page Cache API (cached endpoints)
export const pageCacheAPI = {
  // Get cached dashboard data
  getDashboardData: async (uid: string, noCache?: boolean) => {
    const params = new URLSearchParams();
    if (noCache) params.append('noCache', 'true');
    const response = await api.get(`/pages/dashboard/${uid}?${params.toString()}`);
    return response.data;
  },

  // Get cached transactions data
  getTransactionsData: async (uid: string, limit?: number, noCache?: boolean) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (noCache) params.append('noCache', 'true');
    const response = await api.get(`/pages/transactions/${uid}?${params.toString()}`);
    return response.data;
  },

  // Get cached AI insights data
  getAIInsightsData: async (uid: string, noCache?: boolean) => {
    const params = new URLSearchParams();
    if (noCache) params.append('noCache', 'true');
    const response = await api.get(`/pages/ai-insights/${uid}?${params.toString()}`);
    return response.data;
  },

  // Invalidate page cache
  invalidatePageCache: async (uid: string) => {
    const response = await api.post(`/pages/invalidate/${uid}`);
    return response.data;
  },
};

