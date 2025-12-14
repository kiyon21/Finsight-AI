import { Router } from 'express';
import { UserController } from '../controllers/user.controller';

export function createUserRoutes(userController: UserController): Router {
  const router = Router();

  // Goal routes
  router.post('/:uid/goals', (req, res) => userController.addGoal(req, res));
  router.get('/:uid/goals', (req, res) => userController.getGoals(req, res));
  router.delete('/:uid/goals/:goalId', (req, res) => userController.deleteGoal(req, res));
  router.put('/:uid/goals/:goalId', (req, res) => userController.updateGoal(req, res));

  // Income routes
  router.post('/:uid/income', (req, res) => userController.addIncomeSource(req, res));
  router.get('/:uid/income', (req, res) => userController.getIncomeSources(req, res));
  router.delete('/:uid/income/:incomeId', (req, res) => userController.deleteIncomeSource(req, res));
  router.put('/:uid/income/:incomeId', (req, res) => userController.updateIncomeSource(req, res));

  return router;
}

