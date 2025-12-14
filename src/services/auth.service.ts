import { auth } from '../firebase/firebase';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithCustomToken,
  GoogleAuthProvider,
  type User
} from 'firebase/auth';
import { authAPI } from './api';

export class AuthServiceClient {
  async register(email: string, password: string): Promise<User> {
    // Create user via backend (Auth + Firestore)
    const result = await authAPI.register(email, password);
    
    // Sign in with the custom token returned by backend
    const userCredential = await signInWithCustomToken(auth, result.customToken);
    return userCredential.user;
  }

  async login(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  }

  async loginWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    
    // Check if user document exists, if not create it
    try {
      await authAPI.getUserData(userCredential.user.uid);
    } catch (error) {
      // User doesn't exist, initialize profile
      await authAPI.initializeProfile(
        userCredential.user.uid, 
        userCredential.user.email || ''
      );
    }

    return userCredential.user;
  }

  async logout(): Promise<void> {
    await auth.signOut();
  }

  async getUserData(uid: string) {
    return await authAPI.getUserData(uid);
  }

  async completeOnboarding(uid: string) {
    return await authAPI.completeOnboarding(uid);
  }
}

export const authService = new AuthServiceClient();

