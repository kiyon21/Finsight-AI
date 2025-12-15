import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

/**
 * Middleware to verify Firebase ID token from Authorization header
 * If token is valid, adds user info to req.user
 * If token is missing or invalid, returns 401/403
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(403).json({ 
        error: 'Access denied. Authorization token required.',
        message: 'Please provide a valid Firebase ID token in the Authorization header: Bearer <token>'
      });
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return res.status(403).json({ 
        error: 'Access denied. Invalid token format.',
        message: 'Token is missing from Authorization header'
      });
    }

    try {
      const decodedToken = await authService.verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
      };
      next();
    } catch (error: any) {
      console.error('Token verification error:', error.message);
      return res.status(403).json({ 
        error: 'Access denied. Invalid or expired token.',
        message: error.message || 'Token verification failed'
      });
    }
  } catch (error: any) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ 
      error: 'Authentication error',
      message: error.message || 'Internal server error during authentication'
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if token is missing
 * Useful for endpoints that work with or without authentication
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      if (token) {
        try {
          const decodedToken = await authService.verifyIdToken(token);
          req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
          };
        } catch (error) {
          // Token invalid, but continue without user
          console.warn('Optional auth: Invalid token, continuing without user');
        }
      }
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
