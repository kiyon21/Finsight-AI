import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  constructor(private authService: AuthService) {}

  async register(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      const result = await this.authService.createUser(email, password);
      res.status(201).json({ 
        message: 'User created successfully',
        uid: result.uid,
        email: result.email,
        customToken: result.customToken
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific Firebase errors
      if (error.message.includes('email address is already in use')) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      if (error.message.includes('email address is improperly formatted')) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      
      res.status(500).json({ error: error.message || 'Failed to register user' });
    }
  }

  async initializeProfile(req: Request, res: Response) {
    try {
      const { uid, email } = req.body;

      if (!uid || !email) {
        return res.status(400).json({ error: 'User ID and email are required' });
      }

      await this.authService.initializeUserProfile(uid, email);
      res.status(201).json({ 
        message: 'User profile initialized successfully'
      });
    } catch (error: any) {
      console.error('Initialize profile error:', error);
      res.status(500).json({ error: error.message || 'Failed to initialize user profile' });
    }
  }

  async getUserData(req: Request, res: Response) {
    try {
      const { uid } = req.params;

      if (!uid) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const userData = await this.authService.getUserData(uid);
      
      if (!userData) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(userData);
    } catch (error: any) {
      console.error('Get user data error:', error);
      res.status(500).json({ error: error.message || 'Failed to get user data' });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const { uid } = req.params;
      const updateData = req.body;

      if (!uid) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      await this.authService.updateUser(uid, updateData);
      res.json({ message: 'User updated successfully' });
    } catch (error: any) {
      console.error('Update user error:', error);
      res.status(500).json({ error: error.message || 'Failed to update user' });
    }
  }

  async updatePlaidToken(req: Request, res: Response) {
    try {
      const { uid, accessToken } = req.body;

      if (!uid || !accessToken) {
        return res.status(400).json({ error: 'User ID and access token are required' });
      }

      await this.authService.updateUserPlaidToken(uid, accessToken);
      res.json({ message: 'Plaid token updated successfully' });
    } catch (error: any) {
      console.error('Update Plaid token error:', error);
      res.status(500).json({ error: error.message || 'Failed to update Plaid token' });
    }
  }

  async completeOnboarding(req: Request, res: Response) {
    try {
      const { uid } = req.body;

      if (!uid) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      await this.authService.completeOnboarding(uid);
      res.json({ message: 'Onboarding completed successfully' });
    } catch (error: any) {
      console.error('Complete onboarding error:', error);
      res.status(500).json({ error: error.message || 'Failed to complete onboarding' });
    }
  }

  async verifyToken(req: Request, res: Response) {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({ error: 'ID token is required' });
      }

      const decodedToken = await this.authService.verifyIdToken(idToken);
      res.json({ 
        uid: decodedToken.uid,
        email: decodedToken.email 
      });
    } catch (error: any) {
      console.error('Verify token error:', error);
      res.status(401).json({ error: error.message || 'Invalid token' });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const { uid } = req.params;

      if (!uid) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      await this.authService.deleteUser(uid);
      res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete user' });
    }
  }
}

