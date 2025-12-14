import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

export function createAuthRoutes(authController: AuthController): Router {
  const router = Router();

  router.post('/register', (req, res) => authController.register(req, res));
  router.post('/initialize-profile', (req, res) => authController.initializeProfile(req, res));
  router.get('/user/:uid', (req, res) => authController.getUserData(req, res));
  router.put('/user/:uid', (req, res) => authController.updateUser(req, res));
  router.post('/user/plaid-token', (req, res) => authController.updatePlaidToken(req, res));
  router.post('/user/complete-onboarding', (req, res) => authController.completeOnboarding(req, res));
  router.post('/verify-token', (req, res) => authController.verifyToken(req, res));
  router.delete('/user/:uid', (req, res) => authController.deleteUser(req, res));

  return router;
}

