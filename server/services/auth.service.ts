import admin from 'firebase-admin';
import { adminAuth, adminDb } from '../config/firebase.config';

export interface UserData {
  uid: string;
  email: string;
  hasCompletedOnboarding: boolean;
  createdAt: string;
  accessToken?: string;
  balance?: number;
  balanceUpdated?: string;
}

export class AuthService {
  async createUser(email: string, password: string): Promise<{ uid: string; email: string; customToken: string }> {
    try {
      // Create user with Firebase Auth Admin SDK
      const userRecord = await adminAuth.createUser({
        email,
        password,
        emailVerified: false,
      });

      // Create user document in Firestore
      await adminDb.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: email,
        hasCompletedOnboarding: false,
        createdAt: new Date().toISOString(),
        accessToken: '',
        balance: 0,
        balanceUpdated: null, // null so first CSV upload sets balance
      });

      // Initialize all user subcollections with metadata documents
      await this.initializeUserCollections(userRecord.uid);

      // Generate custom token for frontend to sign in
      const customToken = await adminAuth.createCustomToken(userRecord.uid);

      return {
        uid: userRecord.uid,
        email: userRecord.email || email,
        customToken: customToken,
      };
    } catch (error: any) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  // Initialize all user subcollections
  private async initializeUserCollections(uid: string): Promise<void> {
    try {
      const batch = adminDb.batch();

      // Initialize goals collection with metadata document
      const goalsMetaRef = adminDb
        .collection('users')
        .doc(uid)
        .collection('goals')
        .doc('_metadata');
      batch.set(goalsMetaRef, {
        initialized: true,
        createdAt: new Date().toISOString(),
        totalGoals: 0,
      });

      // Initialize income collection with metadata document
      const incomeMetaRef = adminDb
        .collection('users')
        .doc(uid)
        .collection('income')
        .doc('_metadata');
      batch.set(incomeMetaRef, {
        initialized: true,
        createdAt: new Date().toISOString(),
        totalIncomeSources: 0,
      });

      // Initialize plaidTransactions collection with metadata document
      const plaidTxnMetaRef = adminDb
        .collection('users')
        .doc(uid)
        .collection('plaidTransactions')
        .doc('_metadata');
      batch.set(plaidTxnMetaRef, {
        initialized: true,
        createdAt: new Date().toISOString(),
        totalTransactions: 0,
        lastSyncedAt: null,
      });

      // Initialize uploadedTransactions collection with metadata document
      const uploadedTxnMetaRef = adminDb
        .collection('users')
        .doc(uid)
        .collection('uploadedTransactions')
        .doc('_metadata');
      batch.set(uploadedTxnMetaRef, {
        initialized: true,
        createdAt: new Date().toISOString(),
        totalTransactions: 0,
        lastUploadedAt: null,
      });

      // Initialize AI insight collections with metadata documents
      const aiInsightCollections = [
        'quickInsights',
        'spendingAnalyses',
        'goalRecommendations',
        'budgetSuggestions',
        'savingsAdvices',
      ];

      for (const collectionName of aiInsightCollections) {
        const insightMetaRef = adminDb
          .collection('users')
          .doc(uid)
          .collection(collectionName)
          .doc('_metadata');
        batch.set(insightMetaRef, {
          initialized: true,
          createdAt: new Date().toISOString(),
          totalInsights: 0,
        });
      }

      await batch.commit();
      console.log(`Initialized collections for user ${uid}`);
    } catch (error: any) {
      console.error(`Failed to initialize user collections: ${error.message}`);
      // Don't throw - collections can still be created when first real document is added
    }
  }

  // Initialize user profile in Firestore (for when Auth user already exists)
  async initializeUserProfile(uid: string, email: string): Promise<void> {
    try {
      // Check if user profile already exists
      const userDoc = await adminDb.collection('users').doc(uid).get();
      
      if (userDoc.exists) {
        console.log('User profile already exists');
        return;
      }

      // Create user document in Firestore
      await adminDb.collection('users').doc(uid).set({
        uid: uid,
        email: email,
        hasCompletedOnboarding: false,
        createdAt: new Date().toISOString(),
        accessToken: '',
        balance: 0,
        balanceUpdated: null, // null so first CSV upload sets balance
      });

      // Initialize all user subcollections
      await this.initializeUserCollections(uid);
    } catch (error: any) {
      throw new Error(`Failed to initialize user profile: ${error.message}`);
    }
  }

  async getUserData(uid: string): Promise<UserData | null> {
    try {
      const userDoc = await adminDb.collection('users').doc(uid).get();
      
      if (!userDoc.exists) {
        return null;
      }

      return userDoc.data() as UserData;
    } catch (error: any) {
      throw new Error(`Failed to get user data: ${error.message}`);
    }
  }

  async updateUser(uid: string, data: Partial<UserData>): Promise<void> {
    try {
      await adminDb.collection('users').doc(uid).update(data);
    } catch (error: any) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      return await adminAuth.verifyIdToken(idToken);
    } catch (error: any) {
      throw new Error(`Failed to verify token: ${error.message}`);
    }
  }

  async deleteUser(uid: string): Promise<void> {
    try {
      // Delete user from Auth
      await adminAuth.deleteUser(uid);
      
      // Delete user document from Firestore
      await adminDb.collection('users').doc(uid).delete();
    } catch (error: any) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  async updateUserPlaidToken(uid: string, accessToken: string): Promise<void> {
    try {
      await adminDb.collection('users').doc(uid).update({
        accessToken: accessToken,
      });
    } catch (error: any) {
      throw new Error(`Failed to update Plaid token: ${error.message}`);
    }
  }

  async completeOnboarding(uid: string): Promise<void> {
    try {
      await adminDb.collection('users').doc(uid).update({
        hasCompletedOnboarding: true,
      });
    } catch (error: any) {
      throw new Error(`Failed to complete onboarding: ${error.message}`);
    }
  }

  async updateUserBalance(uid: string, balance: number, transactionDate: string): Promise<void> {
    try {
      await adminDb.collection('users').doc(uid).update({
        balance: balance,
        balanceUpdated: transactionDate,
      });
    } catch (error: any) {
      throw new Error(`Failed to update user balance: ${error.message}`);
    }
  }
}

